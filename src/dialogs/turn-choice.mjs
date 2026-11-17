import {requestCombat} from '../services/combat.mjs';
import {actionConditions} from '../services/turn-budget.mjs';
import {ACTION_CATEGORIES} from '../rules/actions.mjs';
/** The player chooses which actions Dazed or Grappled leaves available. */
export async function chooseCombatParticipant(combat,id) {
 const actor=combat.combatants.get(id)?.actor;
 if(!actor)throw new Error('This participant needs an Actor.');
 if(!game.user.isGM&&!actor.testUserPermission(game.user,'OWNER'))throw new Error('Choose a participant you own, or ask the DA.');
 const conditions=actionConditions(actor),restriction=Math.min(3,Math.max(conditions.dazed??0,conditions.grappled??0));
 const payload={id};
 if(restriction===1||restriction===2){
  const count=3-restriction,labels={main:'Main Action',maneuver:'Maneuver',reaction:'Reaction'};
  const retained=await foundry.applications.api.DialogV2.wait({window:{title:'Choose turn actions'},
   content:`<p>Dazed or Grappled ${restriction}: choose exactly ${count} action ${count===1?'category':'categories'} to retain this turn.</p>${ACTION_CATEGORIES.map(category=>`<label><input type="checkbox" name="retained" value="${category}"> ${labels[category]}</label>`).join('')}`,
   buttons:[{action:'choose',label:'Begin turn',default:true,callback:(_event,_button,dialog)=>{
    const selected=[...dialog.element.querySelectorAll('[name=retained]:checked')].map(input=>input.value);
    if(selected.length!==count||new Set(selected).size!==count||selected.some(category=>!ACTION_CATEGORIES.includes(category)))throw new Error(`Choose exactly ${count} distinct action categories.`);
    return selected;
   }},{action:'cancel',label:'Cancel',callback:()=>null}],rejectClose:false});
  if(!retained)return null;
  payload.retained=retained;
 }else if(restriction===3)payload.retained=[];
 return requestCombat(combat,'choose',payload);
}
