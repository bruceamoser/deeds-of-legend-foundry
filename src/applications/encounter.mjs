import {requestCombat,combatSide} from "../services/combat.mjs";
import {reconcileTurnRoster,availableParticipants} from "../rules/encounter.mjs";
import { chooseCombatParticipant } from "../dialogs/turn-choice.mjs";
import { finishCombatParticipant } from "../dialogs/turn-end.mjs";
const ID="heroes-of-legend";
export class EncounterPanel extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2){
 constructor(combat){super();this.combat=combat;this.hooks=[];for(const name of ["updateCombat","createCombatant","updateCombatant","deleteCombatant"]){this.hooks.push([name,Hooks.on(name,()=>{if(this.rendered)void this.render();})]);}this.hooks.push(["deleteCombat",Hooks.on("deleteCombat",document=>{if(document.id===combat.id)void this.close();})]);}
 static DEFAULT_OPTIONS={classes:[ID,"hol-encounter-panel"],window:{title:"Encounter",resizable:true},position:{width:372,height:"auto"},actions:{opening:EncounterPanel.opening,ambush:EncounterPanel.ambush,choose:EncounterPanel.choose,finish:EncounterPanel.finish,actor:EncounterPanel.actor,end:EncounterPanel.end,side:EncounterPanel.side}};
 static PARTS={main:{template:`systems/${ID}/templates/encounter.hbs`,scrollable:[".hol-tool-content"]}};
 async _onClose(options){for(const [name,id]of this.hooks)Hooks.off(name,id);return super._onClose(options);}
 async _prepareContext(){
  const saved=this.combat.getFlag(ID,"encounter"),state=saved?reconcileTurnRoster(saved,this.combat.combatants.map(c=>({id:c.id,side:combatSide(c)}))):null,current=this.combat.combatants.get(state?.current);
  const eligible=state?.startingSide?new Set(availableParticipants(state).map(p=>p.id)):null;
  const participants=this.combat.combatants.filter(c=>!(c.hidden&&!game.user.isGM)).map(c=>({id:c.id,name:c.name,img:c.img??c.actor?.img,group:combatSide(c)==="players"?"players":"creatures",active:state?.current===c.id,acted:(state?.acted??[]).includes(c.id),canChoose:Boolean(state)&&!current&&(!eligible||eligible.has(c.id))&&!(state?.acted??[]).includes(c.id)&&(game.user.isGM||c.actor?.isOwner)}));
  return {canOpen:!state,canAmbush:!state&&game.user.isGM,opening:state?.opening?.ambushSide?"Ambush":state?.opening?`Opening ${state.opening.total}`:"",startingSide:state?.startingSide?`${state.startingSide==="players"?"Players":"Opposition"} start each round`:"",groups:encounterGroups(participants),canEnd:game.user.isGM,canSetSide:game.user.isGM,round:state?.round??1,currentName:current?(current.hidden&&!game.user.isGM?"Turn in progress":`${current.name}’s turn`):state?.startingSide?`${state.nextSide==="players"?"Players":"Opposition"} choose next`:state?"Choose a turn":"Resolve the opening",canFinish:Boolean(current&&(game.user.isGM||current.actor?.isOwner)),participants};
 }
 async run(action){try{await action();}catch(error){ui.notifications.error(error.message);}}
 static async opening(){await this.run(()=>requestCombat(this.combat,"start"));}
 static async ambush(){await this.run(()=>resolveAmbush(this.combat));}
 static async choose(event,target){await this.run(()=>chooseCombatParticipant(this.combat,target.dataset.id));}
 static async finish(){await this.run(()=>finishCombatParticipant(this.combat));}
 static async end(){await this.run(()=>endEncounter(this.combat));}
 static async side(event,target){
  await this.run(async()=>{
   if(!game.user.isGM)throw new Error("Only the DA can assign encounter sides.");
   const participant=this.combat.combatants.get(target.dataset.id);
   if(!participant)throw new Error("That participant has left the encounter.");
   const current=participant.getFlag(ID,"side") ?? "default";
   const buttons=[
    {action:"default",label:"By actor type"},
    {action:"players",label:"Players"},
    {action:"opposition",label:"Creatures"},
   ];
   const side=await foundry.applications.api.DialogV2.wait({window:{title:`Side for ${participant.name}`},content:"<p>Heroes join the Players side and creature actors join the Creatures side. Choose a side to override that assignment.</p>",buttons,rejectClose:false});
   if(!side||side===current)return;
   if(side==="default")await participant.unsetFlag(ID,"side");
   else if(["players","opposition"].includes(side))await participant.setFlag(ID,"side",side);
  });
 }
 static async actor(event,target){const actor=this.combat.combatants.get(target.dataset.id)?.actor;if(actor?.testUserPermission(game.user,"LIMITED"))await actor.sheet.render({force:true});}
}
export async function openEncounterPanel(combat){const existing=[...foundry.applications.instances.values()].find(app=>app instanceof EncounterPanel&&app.combat.id===combat.id);return (existing??new EncounterPanel(combat)).render({force:true});}

export function encounterGroups(participants){return [{id:"players",label:"Players"},{id:"creatures",label:"Creatures"}].map(group=>({...group,participants:participants.filter(p=>p.group===group.id)})).filter(group=>group.participants.length);}
export async function endEncounter(combat){if(!game.user.isGM)throw new Error("Only the DA can end combat.");return combat.endCombat();}

export async function resolveAmbush(combat) {
 if(!game.user.isGM)throw new Error("Only the DA can designate an ambush.");
 const result=await foundry.applications.api.DialogV2.wait({window:{title:"Resolve an ambush"},content:'<p>The DA decides whether either side caught the other unaware. The starting side opens every round. Alternate sides from the first turn.</p><p>If Shared Vigil warned the group before the attack, use the normal opening roll. Its defense reroll and Hunt at the Crossroads retain their printed rules.</p>',buttons:[{action:"players",label:"Players start"},{action:"opposition",label:"Opposition start"},{action:"opening",label:"Roll initiative"}],rejectClose:false});
 if(result==="opening")return requestCombat(combat,"start");
 if(["players","opposition"].includes(result))return requestCombat(combat,"ambush",{side:result});
}
