import {requestCombat,combatSide,canCancelParticipantTurn} from "../services/combat.mjs";
import {reconcileTurnRoster,availableParticipants,encounterSideLabel,oppositeEncounterSide} from "../rules/encounter.mjs";
import { chooseCombatParticipant } from "../dialogs/turn-choice.mjs";
import { finishCombatParticipant } from "../dialogs/turn-end.mjs";
const ID="heroes-of-legend";
export class EncounterPanel extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2){
 constructor(combat){super();this.combat=combat;this.hooks=[];for(const name of ["updateCombat","createCombatant","updateCombatant","deleteCombatant"]){this.hooks.push([name,Hooks.on(name,()=>{if(this.rendered)void this.render();})]);}this.hooks.push(["updateToken",Hooks.on("updateToken",token=>{if(this.rendered&&this.combat.combatants.some(participant=>participant.token?.uuid===token.uuid))void this.render();})]);this.hooks.push(["deleteCombat",Hooks.on("deleteCombat",document=>{if(document.id===combat.id)void this.close();})]);}
 static DEFAULT_OPTIONS={classes:[ID,"hol-encounter-panel"],window:{title:"Encounter",resizable:true},position:{width:372,height:"auto"},actions:{opening:EncounterPanel.opening,ambush:EncounterPanel.ambush,choose:EncounterPanel.choose,cancel:EncounterPanel.cancel,finish:EncounterPanel.finish,actor:EncounterPanel.actor,end:EncounterPanel.end,side:EncounterPanel.side}};
 static PARTS={main:{template:`systems/${ID}/templates/encounter.hbs`,scrollable:[".hol-tool-content"]}};
 async _onClose(options){for(const [name,id]of this.hooks)Hooks.off(name,id);return super._onClose(options);}
 async _prepareContext(){
  const saved=this.combat.getFlag(ID,"encounter"),state=saved?reconcileTurnRoster(saved,this.combat.combatants.map(c=>({id:c.id,side:combatSide(c)}))):null,current=this.combat.combatants.get(state?.current);
  const eligible=state?.startingSide?new Set(availableParticipants(state).map(p=>p.id)):null;
  const participants=this.combat.combatants.filter(c=>!(c.hidden&&!game.user.isGM)).map(c=>{
   const group=combatSide(c), destination=oppositeEncounterSide(group);
   const active=state?.current===c.id;
   const acted=(state?.acted??[]).includes(c.id);
   return {id:c.id,name:c.name,img:c.img??c.actor?.img,group,active,acted,destination,
    canChoose:Boolean(state)&&!current&&(!eligible||eligible.has(c.id))&&!acted&&(game.user.isGM||c.actor?.isOwner),
    moveLabel:`Move ${c.name} to ${encounterSideLabel(destination)}`,
    moveIcon:destination==="players"?"fa-shield-halved":"fa-skull"};
  });
  const canFinish=Boolean(current&&(game.user.isGM||(!current.hidden&&current.actor?.isOwner)));
  return {canOpen:!state,canAmbush:!state&&game.user.isGM,opening:state?.opening?.ambushSide?"Ambush":state?.opening?`Opening ${state.opening.total}`:"",
   startingSide:state?.startingSide?`${encounterSideLabel(state.startingSide)} start each round`:"",
   groups:encounterGroups(participants),participants,canEnd:game.user.isGM,canSetSide:game.user.isGM,round:state?.round??1,
   currentName:current?(current.hidden&&!game.user.isGM?"Turn in progress":`${current.name}’s turn`)
    :state?.startingSide?`${encounterSideLabel(state.nextSide)} act next`:state?"Take a turn":"Resolve the opening",
   canFinish,canCancel:canFinish&&canCancelParticipantTurn(this.combat,state)};
 }
 async run(action){try{await action();}catch(error){ui.notifications.error(error.message);}}
 static async opening(){await this.run(()=>requestCombat(this.combat,"start"));}
 static async ambush(){await this.run(()=>resolveAmbush(this.combat));}
 static async choose(event,target){await this.run(()=>chooseCombatParticipant(this.combat,target.dataset.id));}
 static async cancel(){await this.run(()=>requestCombat(this.combat,"cancel"));}
 static async finish(){await this.run(()=>finishCombatParticipant(this.combat));}
 static async end(){await this.run(()=>endEncounter(this.combat));}
 static async side(event,target){
  await this.run(async()=>{
   if(!game.user.isGM)throw new Error("Only the DA can assign encounter sides.");
   const participant=this.combat.combatants.get(target.dataset.id);
   if(!participant)throw new Error("That participant has left the encounter.");
   if(this.combat.getFlag(ID,"encounter")?.current===participant.id)
    throw new Error("End or cancel the current turn before moving its participant.");
   const destination=target.dataset.side;
   if(destination===oppositeEncounterSide(combatSide(participant)))
    await participant.setFlag(ID,"side",destination);
  });
 }
 static async actor(event,target){const actor=this.combat.combatants.get(target.dataset.id)?.actor;if(actor?.testUserPermission(game.user,"LIMITED"))await actor.sheet.render({force:true});}
}
export async function openEncounterPanel(combat){const existing=[...foundry.applications.instances.values()].find(app=>app instanceof EncounterPanel&&app.combat.id===combat.id);return (existing??new EncounterPanel(combat)).render({force:true});}

export function encounterGroups(participants){
 return ["players","opposition"].map(id=>({id,label:encounterSideLabel(id),participants:participants.filter(p=>p.group===id)})).filter(group=>group.participants.length);
}
export async function endEncounter(combat){if(!game.user.isGM)throw new Error("Only the DA can end combat.");return combat.endCombat();}

export async function resolveAmbush(combat) {
 if(!game.user.isGM)throw new Error("Only the DA can designate an ambush.");
 const result=await foundry.applications.api.DialogV2.wait({window:{title:"Resolve an ambush"},content:'<p>The DA decides whether either side caught the other unaware. The starting side opens every round. Alternate sides from the first turn.</p><p>If Shared Vigil warned the group before the attack, use the normal opening roll. Its defense reroll and Hunt at the Crossroads retain their printed rules.</p>',buttons:[{action:"players",label:"Allies start"},{action:"opposition",label:"Enemies start"},{action:"opening",label:"Roll initiative"}],rejectClose:false});
 if(result==="opening")return requestCombat(combat,"start");
 if(["players","opposition"].includes(result))return requestCombat(combat,"ambush",{side:result});
}
