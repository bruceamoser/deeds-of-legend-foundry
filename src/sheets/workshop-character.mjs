import {signatureProse} from '../rules/forge-signatures.mjs';
import {SharedRollDialog} from '../dialogs/attribute-roll.mjs';
import {prepareNativeActionCost,activateOwnedAbility,activateDefenseBenefit} from '../services/abilities.mjs';
import {openPotionPreparation} from '../applications/potions.mjs';
import {HEALING_POTION_IDS} from '../rules/potions.mjs';
import {torchItemActions,requestTorchToggle} from '../services/torches.mjs';
import { projectNativeWorkshopInventory } from '../rules/native-inventory-projection.mjs';
import { nativeItemForWorkshopInstance } from '../rules/native-item-identity.mjs';
import { consumableTracking,tracksConsumable } from '../services/consumables.mjs';
import { editPortrait } from './portrait.mjs';
import { loadWorkshopCatalogs } from '../services/catalog.mjs';
import { newCreationDraft } from '../rules/creation.mjs';
import { rollCard, resourceCard } from '../rules/chat-cards.mjs';
import { equipmentAttributeValue } from '../rules/effective-attributes.mjs';
import { inventoryCheck } from '../rules/inventory.mjs';
import { classifyRoll } from '../rules/roll.mjs';
import { writePortableCharacter } from '../rules/portable-character.mjs';
import { loadNativeWorkshopState } from '../services/native-workshop-state.mjs';
import {saveNativeWorkshopState,saveNativeWorkshopDraft,saveNativeWorkshopIdentity,commitNativeWorkshopCharacter,claimNativeWorkshopOperation,updateNativeWorkshopOperation,completeNativeWorkshopOperation,reconcileNativeWorkshopOperation} from '../services/native-workshop-coordinator.mjs';
const ID='heroes-of-legend';
const {HandlebarsApplicationMixin}=foundry.applications.api;

/** Native document shell; the published Workshop owns the rendered controls. */
export class WorkshopCharacterSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS={
    classes:[ID,'hol-workshop-character'],position:{width:1060,height:940},
    window:{resizable:true},form:{submitOnChange:false,closeOnSubmit:false},
    actions:{startWorkshop:WorkshopCharacterSheet.startWorkshop,recreateWorkshop:WorkshopCharacterSheet.recreateWorkshop,reconcileRoll:WorkshopCharacterSheet.reconcileRoll},
  };
  static PARTS={main:{template:'systems/heroes-of-legend/templates/workshop-character.hbs'}};
  controller=null;
  revision=0;
  writing=0;
  mountGeneration=0;
  mounting=false;
  refreshAfterWrite=false;
  mountReady=Promise.resolve();
  async _prepareContext(options) {
    const context=await super._prepareContext(options);
    const actor=this.actor;
    const current=actor.getFlag(ID,'nativeWorkshop')?.portable;
    const draft=actor.getFlag(ID,'nativeWorkshopDraft');
    const empty=!actor.getFlag(ID,'creationReceipt') && !actor.items.size && !actor.items.length;
    context.workshopReady=Boolean(current || draft);
    context.canCreate=this.isEditable && actor.testUserPermission(game.user,'OWNER') && !actor.pack && !actor.isToken;
    context.legacy=!context.workshopReady && !empty;
    context.actorName=actor.name;
    return context;
  }
  // Actor.update rerenders document sheets. Preserve the live controller and its
  // focus/atlas state while its own acknowledged writes update the document.
  _replaceHTML(result,content,options) {
    if((this.controller || this.mounting) && this.element?.querySelector('[data-workshop-mount]')) return;
    return super._replaceHTML(result,content,options);
  }
  async _onRender(context,options) {
    await super._onRender(context,options);
    const target=this.element.querySelector('[data-workshop-mount]');
    if(!target || this.mounting) return;
    if(this.controller) {
      this.host.readOnly=!this.isEditable || !this.actor.testUserPermission(game.user,'OWNER');
      this.host.portraitUrl=this.actor.img;
      if(this.writing) {this.refreshAfterWrite=true;return;}
      if(!this.writing) {
        const saved=await loadNativeWorkshopState(this.actor);
        this.nativeItems=saved.nativeItems ?? [];
        this.basePlay=structuredClone(saved.character.draft.play ?? {});
        this.baseLoadout=structuredClone(saved.character.draft.loadout ?? {});
        if(saved.revision!==this.revision || this.controller.getState().mode==='sheet') {
          this.revision=saved.revision;
          const current=this.controller.getState();
          const character=current.mode!=='sheet' ? current.character : current.editing ? {...saved.character,draft:{...saved.character.draft,name:current.character.draft.name,profile:current.character.draft.profile}} : saved.character;
          this.controller.setState({...current,character});
        } else this.controller.setState(this.controller.getState());
      }
      return;
    }
    const generation=++this.mountGeneration;
    this.mounting=true;
    let resolveMount;this.mountReady=new Promise(resolve=>resolveMount=resolve);
    try {
      const state=await loadNativeWorkshopState(this.actor);
      if(state.mode==='creation') state.mode='builder';
      this.revision=state.revision;
      this.nativeItems=state.nativeItems ?? [];
      this.basePlay=structuredClone(state.character.draft.play ?? {});
      this.baseLoadout=structuredClone(state.character.draft.loadout ?? {});
      const {mountWorkshop}=await import(new URL('systems/heroes-of-legend/workshop/workshop-mount.mjs', document.baseURI).href);
      this.host={
        get tracking(){return consumableTracking();},
        nativeItems:()=>this.nativeItems ?? [],
        projectInventory:items=>projectNativeWorkshopInventory(this.actor,items),
        tracksItem:item=>{const native=nativeItemForWorkshopInstance(this.actor,item.instanceId);return native ? tracksConsumable(native) : undefined;},
        canDeleteItem:item=>{const native=nativeItemForWorkshopInstance(this.actor,item?.instanceId);return !native || native.getFlag(ID,'grantKind')==='nativeWorkshop';},
        itemActions:item=>{
          const native=nativeItemForWorkshopInstance(this.actor,item.instanceId);
          return [...torchItemActions(this.actor,item),...(native && native.getFlag(ID,'grantKind')!=='nativeWorkshop' ? [{action:'open-card',label:'Open card',title:'Edit or delete this owned item in its card'}] : [])];
        },
        readOnly:!this.isEditable || !this.actor.testUserPermission(game.user,'OWNER'),
        committed:Boolean(this.actor.getFlag(ID,'nativeWorkshop')?.portable),
        portraitUrl:this.actor.img,
        getAttributeBase:key=>this.actor.system.attributes[key].base,
        getAttributes:attributes=>Object.fromEntries(Object.entries(attributes).map(([key,value])=>[key,equipmentAttributeValue(this.actor.system.attributes[key].base,this.actor.items,key)])),
        beforeUse:request=>this.beginRollOperation(request.kind,request.willRoll,request.id),
        captureSaveBase:()=>({basePlay:structuredClone(this.basePlay ?? {}),baseLoadout:structuredClone(this.baseLoadout ?? {})}),
        onChange:(saved,basis)=>this.saveState(saved,basis),
        onCommit:portable=>this.commitState(portable),
        onAction:async event=>{
          if(event.action==='sustain-spell') {
            this.assertOwner();await this.controller.flush();
            await prepareNativeActionCost(this.actor,'ability-sustain-spell',foundry.utils.randomID(),'sustain');
            return false;
          }
          if(event.action==='evade') {
            this.assertOwner();await this.controller.flush();
            await new SharedRollDialog(this.actor,'agility',{mode:'defense'}).render({force:true});return true;
          }
          if(event.action==='open-roll'&&['ability-basic-melee','ability-basic-ranged','ability-basic-unarmed'].includes(event.id)) {
            this.assertOwner();await this.controller.flush();
            const item=this.actor.items.find(item=>item.type==='ability'&&item.getFlag(ID,'catalogId')===event.id&&item.getFlag(ID,'grantKind')==='nativeWorkshop');
            if(!item)throw new Error('That current owned basic attack is unavailable.');
            await activateOwnedAbility(item);return true;
          }
          if(event.action==='inline-action' && event.dataset.useAbility==='true' && ['ability-defend','ability-shield-block'].includes(event.id)) {
            this.assertOwner();await this.controller.flush();
            const item=this.actor.items.find(item=>item.type==='ability'&&item.getFlag(ID,'catalogId')===event.id&&item.getFlag(ID,'grantKind')==='nativeWorkshop');
            if(!item)throw new Error('That current owned defense ability no longer exists.');
            await activateDefenseBenefit(item);await this.render({force:true});return true;
          }
          if(event.action==='potion-dialog') {
            this.assertOwner();await this.controller.flush();
            const item=this.actor.items.find(item=>item.type==='ability'&&item.getFlag(ID,'catalogId')==='ability-use-a-healing-potion'&&item.getFlag(ID,'grantKind')==='nativeWorkshop');
            if(!item)throw new Error('The current owned Use a Healing Potion action is unavailable.');
            await openPotionPreparation(item);return true;
          }
          if(event.action==='use-supply-dialog' && HEALING_POTION_IDS.includes(event.preview.inventory.items.find(item=>item.instanceId===event.dataset.instance)?.catalogId)) {
            this.assertOwner();await this.controller.flush();
            const item=nativeItemForWorkshopInstance(this.actor,event.dataset.instance);
            if(!item)throw new Error('That owned healing bottle no longer exists.');
            await openPotionPreparation(item,{bottleItemUuid:item.uuid});return true;
          }

          if(event.action==='native-open-item' || (event.action==='native-item' && event.dataset.command==='open-card')) {
            if(!this.actor.testUserPermission(game.user,'OBSERVER')) throw new Error('You cannot inspect this character’s items.');
            const item=event.action==='native-open-item' ? this.actor.items.get(event.id) : nativeItemForWorkshopInstance(this.actor,event.dataset.instance);
            if(!item) throw new Error('That owned item no longer exists.');
            await item.sheet.render({force:true});return true;
          }
          if(event.action==='native-item' && event.dataset.command==='torch-toggle') {
            this.assertOwner();await requestTorchToggle(this.actor,event.dataset.instance);await this.render({force:true});return true;
          }
          if(event.action==='use-supply-dialog' && event.preview.inventory.items.find(item=>item.instanceId===event.dataset.instance)?.catalogId==='item-lighting-bundle') {
            this.assertOwner();await requestTorchToggle(this.actor,event.dataset.instance);return true;
          }
          if(event.action==='edit' && event.editing) {await this.controller.flush();await this.saveIdentity(event.state);return true;}
          if(event.action!=='native-portrait') return false;
          await editPortrait.call(this);return true;
        },
        onRoll:request=>this.rollDice(request),
      };
      const controller=await mountWorkshop(target,{host:this.host,initialState:state});
      if(generation!==this.mountGeneration){controller.dispose();return;}
      this.controller=controller;
    } catch(error) {
      target.textContent=error.message;
      ui.notifications.error(error.message);
    } finally {this.mounting=false;resolveMount();}
  }
  assertOwner() {
    if(this.actor.pack || this.actor.isToken) throw new Error('Use a linked world character for Workshop changes.');
    if(!this.isEditable || !this.actor.testUserPermission(game.user,'OWNER')) throw new Error('Only this character’s owner can change it.');
  }
  finishWrite() {
    this.writing--;
    if(!this.writing && this.refreshAfterWrite && this.controller) {
      this.refreshAfterWrite=false;
      queueMicrotask(()=>{if(this.controller) this.render({force:true});});
    }
  }
  async saveState(saved,basis={}) {
    this.assertOwner();this.writing++;
    try {
      const resolvedImmediateDeathRoll=this.resolvedImmediateDeathRoll;
      let next=await saveNativeWorkshopState(this.actor,saved,{expectedRevision:this.revision,resolvedImmediateDeathRoll,rollOperationId:this.preparedRollId,basePlay:basis.basePlay ?? this.basePlay,baseLoadout:basis.baseLoadout ?? this.baseLoadout});
      if(resolvedImmediateDeathRoll) this.resolvedImmediateDeathRoll=undefined;
      this.revision=next.revision;
      this.nativeItems=next.nativeItems ?? this.nativeItems ?? [];
      this.basePlay=structuredClone(next.character?.draft?.play ?? this.basePlay ?? {});
      this.baseLoadout=structuredClone(next.character?.draft?.loadout ?? this.baseLoadout ?? {});
      if(saved.mode==='sheet') {
        const before=this.actor.getFlag(ID,'nativeWorkshop')?.portable?.draft;
        const draft=saved.character?.draft;
        if(before && draft && (before.name!==draft.name || (before.profile?.story ?? '')!==(draft.profile?.story ?? ''))) {
          next=await saveNativeWorkshopIdentity(this.actor,saved.character,{expectedRevision:this.revision,rollOperationId:this.preparedRollId});
          this.revision=next.revision;
        }
      }
      if(this.pendingRollSave) {
        const id=this.pendingRollSave;
        await completeNativeWorkshopOperation(this.actor,id);
        if(this.preparedRollId===id)this.preparedRollId=undefined;
        this.pendingRollSave=undefined;
      }
      return next;
    } finally {this.finishWrite();}
  }
  async useWorkshopAbility(id) {
    this.assertOwner();
    await this.render({force:true});
    await this.mountReady;
    if(!this.controller) throw new Error('Finish creating this hero in the current Workshop first.');
    return this.controller.useAbility(id);
  }
  async saveIdentity(portable) {
    this.assertOwner();this.writing++;
    try {
      const next=await saveNativeWorkshopIdentity(this.actor,portable,{expectedRevision:this.revision});
      this.nativeItems=next.nativeItems ?? this.nativeItems ?? [];
      this.revision=next.revision;this.controller.setState({...next,mode:'sheet'});
    } finally {this.finishWrite();}
  }
  async commitState(portable) {
    this.assertOwner();this.writing++;
    try {
      const next=await commitNativeWorkshopCharacter(this.actor,portable,{expectedRevision:this.revision});
      this.revision=next.revision;
      this.nativeItems=next.nativeItems ?? this.nativeItems ?? [];
      if(this.host) this.host.committed=true;
      this.controller.setState({...next,mode:'sheet',tab:'Main',step:0});
      ui.notifications.info('Hero saved to the native Actor.');
    } finally {this.finishWrite();}
  }
  _getHeaderControls() {
    return [...super._getHeaderControls(),{action:'reconcileRoll',label:'Reconcile pending Workshop roll',icon:'fa-solid fa-rotate'}];
  }
  static async reconcileRoll() {
    try {
      this.assertOwner();
      const pending=this.actor.getFlag(ID,'nativeWorkshopPendingRoll');
      if(!pending) return ui.notifications.info('No unresolved Workshop roll.');
      const confirmed=await foundry.applications.api.DialogV2.confirm({window:{title:'Reconcile pending Workshop roll'},content:'<p>An earlier roll did not finish its acknowledged save. New rolls are blocked to prevent duplicate costs or dice. Inspect the chat and character, and correct any unapplied resources or death marks before clearing this marker. Clearing it does not roll again or refund costs.</p>'});
      if(confirmed) {await reconcileNativeWorkshopOperation(this.actor,pending.id);if(this.preparedRollId===pending.id)this.preparedRollId=undefined;if(this.pendingRollSave===pending.id)this.pendingRollSave=undefined;}
    } catch(error){ui.notifications.error(error.message);}
  }
  async beginRollOperation(kind,willRoll=true,id) {
    this.assertOwner();
    if(this.operationStarting || this.actor.getFlag(ID,'nativeWorkshopPendingRoll')) throw new Error('A Workshop use awaits reconciliation. Use Reconcile pending Workshop roll in the window menu before trying again.');
    this.operationStarting=true;
    try {
      await this.controller?.flush();
      const operation={id:foundry.utils.randomID(),status:'prepared',kind,startedAt:Date.now()};
      await claimNativeWorkshopOperation(this.actor,operation);
      this.preparedRollId=operation.id;
      if(kind==='cast'&&id)await prepareNativeActionCost(this.actor,id,operation.id,'cast');
      if(!willRoll) this.pendingRollSave=operation.id;
      return operation;
    } finally {this.operationStarting=false;}
  }
  async rollDice(request) {
    this.assertOwner();
    const pending=this.actor.getFlag(ID,'nativeWorkshopPendingRoll');
    if(pending && (pending.id!==this.preparedRollId || pending.status!=='prepared')) throw new Error('A Workshop roll awaits reconciliation. Use Reconcile pending Workshop roll in the window menu before rolling again.');
    await this.controller?.flush();
    const {count,sides,net=0,kind}=request;
    const attribute=request.attributeKey ? equipmentAttributeValue(this.actor.system.attributes[request.attributeKey].base,this.actor.items,request.attributeKey) : (request.attribute ?? 0);
    if(request.attributeKey && attribute!==request.attribute) throw new Error('Equipment changed this attribute. Reopen the roll to use its current effective value.');
    const pendingDeathRoll=kind==='death' ? this.actor.getFlag(ID,'forgeVitals')?.immediateDeathRolls?.[0] : undefined;
    if(!Number.isInteger(count)||count<1||count>6||![4,6,8,10,12,20].includes(sides)) throw new Error('Invalid Workshop dice request.');
    const keep=kind==='supply' ? '' : net<0 ? 'kl3' : 'kh3';
    const modifier=kind==='supply' ? '' : attribute>=0 ? `+${attribute}` : String(attribute);
    const messageMode=game.settings.get('core','messageMode');
    if(this.host) this.host.hideRollResults=messageMode==='blind' && !game.user.isGM;
    const prepared=pending ?? await this.beginRollOperation(kind);
    const operationId=prepared.id;
    const operation={...prepared,status:'evaluating',kind,settings:{...request.activeRoll,key:request.attributeKey}};
    await updateNativeWorkshopOperation(this.actor,operation);
    const roll=await new foundry.dice.Roll(`${count}d${sides}${keep}${modifier}`).evaluate({allowInteractive:messageMode!=='blind'});
    const faces=roll.dice[0].results.filter(result=>!result.rerolled).map(result=>result.result);
    await updateNativeWorkshopOperation(this.actor,{...operation,status:'evaluated',faces,formula:roll.formula});
    let content;
    if(kind==='supply') {
      const check=inventoryCheck({die:sides,retained:faces[0]});
      content=resourceCard({actor:this.actor.name,title:'Supply check',kind:'supply',die:{face:faces[0],before:sides,after:check.after},status:'Rolled',detail:'A 1 steps the supply down; the final use still works.'});
    } else {
      const retainedIndices=faces.map((face,index)=>({face,index})).sort((a,b)=>(net<0 ? a.face-b.face : b.face-a.face)||a.index-b.index).slice(0,3).map(die=>die.index);
      const result=classifyRoll(retainedIndices.map(index=>faces[index]),attribute);
      if(kind==='death') {result.tier=result.total<=8 ? 'weak' : result.total<=14 ? 'standard' : 'strong';result.natural='none';}
      const abilityId=request.activeRoll?.id;
      const catalogs=abilityId || request.abilityIds?.length ? await loadWorkshopCatalogs() : null;
      const record=catalogs?.choices.find(record=>record.id===abilityId) ?? catalogs?.forge.spells.find(record=>record.id===abilityId);
      content=rollCard({actor:this.actor.name,portrait:this.actor.img,mode:request.activeRoll?.defense ? 'defense' : 'attribute',
        attribute:request.attributeKey ?? (kind==='death' ? 'fortitude' : ''),title:kind==='death' ? 'Fortitude death roll' : `${record?.name ?? 'Attribute check'}${request.equipmentNames?.length ? ' · '+request.equipmentNames.join(', ') : ''}`,
        effect:record?.signatureComponent ? signatureProse(record).replace(/\*\*/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1') : record?.effect ?? '',abilities:(request.abilityIds ?? []).map(id=>catalogs?.choices.find(record=>record.id===id)?.name ?? id),roll:{faces,retainedIndices,result,plan:{attribute,net,count,formula:roll.formula}}});
    }
    await roll.toMessage({speaker:ChatMessage.getSpeaker({actor:this.actor}),content,flags:{[ID]:{nativeWorkshopRoll:{kind,settings:{...request.activeRoll,key:request.attributeKey},actorUuid:this.actor.uuid}}}},{messageMode});
    if(kind==='death') this.resolvedImmediateDeathRoll=pendingDeathRoll;
    if(kind==='death' || kind==='supply') this.pendingRollSave=operationId;
    else {await completeNativeWorkshopOperation(this.actor,operationId);if(this.preparedRollId===operationId)this.preparedRollId=undefined;}
    return faces;
  }
  async close(options={}) {
    if(this.controller?.settle) await this.controller.settle();else await this.controller?.flush();
    ++this.mountGeneration;this.controller?.dispose();this.controller=null;
    return super.close(options);
  }
  static async startWorkshop() {
    try {
      this.assertOwner();
      const actor=this.actor;
      if(actor.getFlag(ID,'creationReceipt') || actor.items.size || actor.items.length) throw new Error('Recreate an older hero as a separate Actor.');
      const draft=newCreationDraft();draft.name=actor.name;
      const catalogs=await loadWorkshopCatalogs();
      await saveNativeWorkshopDraft(actor,JSON.parse(writePortableCharacter(draft,catalogs)));
      await this.render({force:true});
    } catch(error){ui.notifications.error(error.message);}
  }
  static async recreateWorkshop() {
    try {
      this.assertOwner();
      const actor=await Actor.create({name:'New hero',type:'character'});
      return actor.sheet.render({force:true});
    } catch(error){ui.notifications.error(error.message);}
  }
}

/** Shared chat controls open this same native Workshop roll surface. */
export function bindNativeWorkshopChat(message,element) {
  const saved=message.getFlag(ID,'nativeWorkshopRoll');
  if(!saved || !message.isContentVisible) return;
  // The shared compact card already contains the full visual dice result.
  element.querySelectorAll('.dice-roll').forEach(node=>node.hidden=true);
  for(const button of element.querySelectorAll('[data-chat-reroll]')) button.addEventListener('click',async()=>{
    try {
      const actor=await fromUuid(saved.actorUuid);
      if(!actor?.testUserPermission(game.user,'OWNER')) throw new Error('Only the character owner can roll again.');
      await actor.sheet.render({force:true});
      if(!actor.sheet.controller) throw new Error('Open this character in the Character Workshop sheet to roll again.');
      actor.sheet.controller.openRoll(saved.settings);
    } catch(error){ui.notifications.error(error.message);}
  });
}
