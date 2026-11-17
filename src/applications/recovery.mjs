import {reconcileNativeGameplayOperation} from '../services/native-workshop-coordinator.mjs';
import {assertCurrentGameplayActor} from '../rules/current-character.mjs';
import {localizeRuleLinks} from '../services/journals.mjs';
import {damageBasis} from '../services/damage.mjs';
import {recoveryPreview,requestRecovery} from '../services/recovery.mjs';
const ID='heroes-of-legend';
export class RecoveryPanel extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
 constructor(actor){super();assertCurrentGameplayActor(actor);this.actor=actor;this.operation='';this.actorHook=Hooks.on('updateActor',changed=>{if(changed.uuid===actor.uuid&&this.rendered)void this.render();});}
 static DEFAULT_OPTIONS={classes:[ID,'hol-recovery'],window:{title:'Recovery',resizable:true},position:{width:620,height:'auto'},actions:{retry:RecoveryPanel.retry,operation:RecoveryPanel.operation,quick:RecoveryPanel.quick,apply:RecoveryPanel.apply}};
 static PARTS={main:{template:`systems/${ID}/templates/recovery.hbs`,scrollable:['.hol-tool-content']}};
 async _prepareContext(){assertCurrentGameplayActor(this.actor);if(!this.actor.testUserPermission(game.user,'OWNER'))throw new Error('Only this actor’s owner can record recovery.');this.basis=damageBasis(this.actor);return {pendingGameplay:Object.values(this.actor.getFlag(ID,'nativeWorkshopOperations')??{}).some(saved=>saved.kind==='gameplay'&&saved.status==='applying'),name:this.actor.name,character:this.actor.type==='character',basis:this.basis,owner:this.actor.isOwner,operation:this.operation,healing:this.operation==='heal',grit:this.operation==='grit',correction:this.operation==='correct',notice:this.notice,failed:this.basis.forgeVitals?.failedDeathRolls??0,successful:this.basis.forgeVitals?.successfulDeathRolls??0,dying:Boolean(this.basis.forgeVitals?.dying),gritHp:Math.min(Math.ceil(this.basis.maxHp/2),Math.max(0,this.basis.maxHp-(this.basis.recovery?.unavailableHp??0)))};}
 draft(){const value=name=>this.element.querySelector(`[name=${name}]`)?.value;const draft={kind:value('kind')};for(const key of ['amount','lifeResistance','hp'])if(value(key)!==undefined)draft[key]=String(value(key)).trim()===''?NaN:Number(value(key));return draft;}
 async _onRender(context,options){await super._onRender(context,options);const preview=()=>{const output=this.element.querySelector('[data-preview]');if(!output)return;try{const plan=recoveryPreview(this.actor,this.basis,this.draft());output.textContent=`HP ${this.basis.hp} → ${plan.after}`;}catch(error){output.textContent=error.message;}};this.element.addEventListener('input',preview);this.element.addEventListener('change',preview);preview();await localizeRuleLinks(this.element);}
 async _onClose(options){Hooks.off('updateActor',this.actorHook);return super._onClose(options);}
 static async retry(){try{await reconcileNativeGameplayOperation(this.actor);await this.render();}catch(error){ui.notifications.error(error.message);}}
 static async operation(_event,target){this.operation=target.dataset.kind;await this.render();}
 static async quick(_event,target){try{this.basis=damageBasis(this.actor);const draft={kind:target.dataset.kind};recoveryPreview(this.actor,this.basis,draft);await requestRecovery(this.actor,this.basis,draft);await this.render();}catch(error){ui.notifications.error(error.message);}}
 static async apply(){try{const draft=this.draft();recoveryPreview(this.actor,this.basis,draft);await requestRecovery(this.actor,this.basis,draft);this.operation='';await this.render();}catch(error){ui.notifications.error(error.message);}}
}
