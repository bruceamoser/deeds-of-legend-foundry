import {signatureProse} from '../rules/forge-signatures.mjs';
import {SharedRollDialog} from '../dialogs/attribute-roll.mjs';
import {prepareNativeActionCost,activateOwnedAbility,activateDefenseBenefit} from '../services/abilities.mjs';
import {postAbilityReference} from '../services/reference-play.mjs';
import {openPotionPreparation} from '../applications/potions.mjs';
import {HEALING_POTION_IDS} from '../rules/potions.mjs';
import {torchItemActions,requestTorchToggle} from '../services/torches.mjs';
import { projectNativeWorkshopInventory } from '../rules/native-inventory-projection.mjs';
import { nativeItemForWorkshopInstance } from '../rules/native-item-identity.mjs';
import { standardEquipmentSalePrice } from '../rules/equipment-sale.mjs';
import { setRangedWeaponAmmunition } from '../services/ranged-ammunition.mjs';
import { consumableTracking,tracksConsumable } from '../services/consumables.mjs';
import { lowerOwnedSupply } from '../services/inventory.mjs';
import { requestRest } from '../services/recovery.mjs';
import { bindPortraitControls,savePortrait,viewPortrait } from './portrait.mjs';
import { loadWorkshopCatalogs } from '../services/catalog.mjs';
import { newCreationDraft } from '../rules/creation.mjs';
import { rollCard, resourceCard } from '../rules/chat-cards.mjs';
import { equipmentBonuses } from "../rules/equipment-bonuses.mjs";
import { equipmentAttributeValue,effectiveActorAttributeValue } from '../rules/effective-attributes.mjs';
import { canCustomizeWorkshopRoll, validateWorkshopAbilityUse, workshopRollAttributes } from '../rules/workshop-ability.mjs';
import { ownedWorkshopAbility, ownedWorkshopRollAttribute, WORKSHOP_ROLL_ATTRIBUTE_FLAG } from '../rules/ability-roll.mjs';
import { ATTRIBUTES } from '../rules/character.mjs';
import { inventoryCheck } from '../rules/inventory.mjs';
import { classifyRoll } from '../rules/roll.mjs';
import { resolvedAttackEffects,spellAttackOutcomes } from '../rules/attack-outcomes.mjs';
import { workshopRollOutcome } from '../rules/workshop-outcomes.mjs';
import { writePortableCharacter } from '../rules/portable-character.mjs';
import { loadNativeWorkshopState } from '../services/native-workshop-state.mjs';
import {saveNativeWorkshopState,saveNativeWorkshopIdentity,sellNativeWorkshopEquipment,commitNativeWorkshopCharacter,claimNativeWorkshopOperation,updateNativeWorkshopOperation,completeNativeWorkshopOperation,interruptNativeWorkshopOperation,nativeWorkshopRoll} from '../services/native-workshop-coordinator.mjs';
const ID='heroes-of-legend';
const {HandlebarsApplicationMixin}=foundry.applications.api;

/** Native document shell; the published Workshop owns the rendered controls. */
export class WorkshopCharacterSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS={
    classes:[ID,'hol-workshop-character'],position:{width:780,height:780},
    // PopOut! 2.24 takes over the frame using ApplicationV1 methods. Use V14's
    // built-in Detach Window and Re-attach Window controls for this sheet.
    popOutModuleDisable:true,
    window:{resizable:true},form:{submitOnChange:false,closeOnSubmit:false},
    actions:{recreateWorkshop:WorkshopCharacterSheet.recreateWorkshop,viewPortrait},
  };
  static PARTS={main:{template:'systems/heroes-of-legend/templates/workshop-character.hbs'}};
  async _onDropItem(event,item) {
    if(item?.type!=='equipment' || item.actor?.uuid===this.actor.uuid || item.getFlag(ID,'grantKind')!=='nativeWorkshop')
      return super._onDropItem(event,item);
    if(!this.isEditable || !this.actor.isOwner)return null;
    // Copies keep their equipment and provenance. Acquisition, ammo and torch
    // state belong to the source Actor and cannot identify the new owned Item.
    const data=item.toObject();
    for(const key of ['grantKind','acquisitionInstance','ammunitionItemId','ammunitionInstanceId','torch'])
      delete data.flags[ID][key];
    delete data.folder;
    const keepId=!this.actor.items.has(item.id);
    if(!keepId)delete data._id;
    const [copy]=await this.actor.createEmbeddedDocuments('Item',[data],{keepId});
    return copy ?? null;
  }
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
    context.canCreate=this.isEditable && actor.testUserPermission(game.user,'OWNER') && !actor.pack && !actor.isToken;
    context.legacy=!current && !draft && !empty;
    context.workshopReady=Boolean(current || draft || (empty && context.canCreate));
    context.actorName=actor.name;
    context.portraitUrl=actor.img;
    return context;
  }
  async loadSheetState() {
    if(this.actor.getFlag(ID,'nativeWorkshop')?.portable || this.actor.getFlag(ID,'nativeWorkshopDraft')) {
      return loadNativeWorkshopState(this.actor);
    }
    this.assertOwner();
    const draft=newCreationDraft({paidProvisions:true});
    draft.name=this.actor.name;
    const catalogs=await loadWorkshopCatalogs();
    return {character:JSON.parse(writePortableCharacter(draft,catalogs)),revision:0,mode:'creation'};
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
    this.bindWorkshopPortrait(target.querySelector?.('[data-portrait-image]'));
    if(this.controller) {
      this.host.readOnly=!this.isEditable || !this.actor.testUserPermission(game.user,'OWNER');
      if(this.writing) {this.refreshAfterWrite=true;return;}
      if(!this.writing) {
        const saved=await this.loadSheetState();
        const imported=!this.host.committed && Boolean(this.actor.getFlag(ID,'nativeWorkshop')?.portable);
        if(imported) this.host.committed=true;
        this.nativeItems=saved.nativeItems ?? [];
        this.basePlay=structuredClone(saved.character.draft.play ?? {});
        this.baseLoadout=structuredClone(saved.character.draft.loadout ?? {});
        if(imported || saved.revision!==this.revision || this.controller.getState().mode==='sheet') {
          this.revision=saved.revision;
          const current=this.controller.getState();
          this.controller.setState(imported ? {...saved,mode:'sheet',tab:'Main'} : {...current,character:current.mode==='sheet' ? saved.character : current.character});
        } else this.controller.setState(this.controller.getState());
      }
      return;
    }
    const generation=++this.mountGeneration;
    this.mounting=true;
    let resolveMount;this.mountReady=new Promise(resolve=>resolveMount=resolve);
    try {
      const state=await this.loadSheetState();
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
        editEquipment:true,
        coinBalance:()=>{
          const coins=this.actor.getFlag(ID,'development')?.coins;
          return Number.isSafeInteger(coins) ? coins : undefined;
        },
        canDeleteItem:item=>!this.host.readOnly && nativeItemForWorkshopInstance(this.actor,item?.instanceId)?.type==='equipment',
        equipmentSale:row=>{
          const item=nativeItemForWorkshopInstance(this.actor,row.instanceId);
          if(this.host.readOnly || item?.type!=='equipment' || !item.isOwner || item.system.quantity<1)return null;
          return { itemId:item.id, quantity:item.system.quantity, inventoryDie:item.system.inventoryDie,
            coins:standardEquipmentSalePrice(row.definition,item.system) };
        },
        itemActions:item=>torchItemActions(this.actor,item),
        readOnly:!this.isEditable || !this.actor.testUserPermission(game.user,'OWNER'),
        committed:Boolean(this.actor.getFlag(ID,'nativeWorkshop')?.portable),
        nativePortrait:true,
        canEditAbilityAttribute:id=>Boolean(ownedWorkshopAbility(this.actor,id)),
        getAbilityAttribute:record=>ownedWorkshopRollAttribute(this.actor,record),
        getAttributeBase:key=>this.actor.system.attributes[key].base,
        getEquipmentBonuses:()=>equipmentBonuses(this.actor.items),
        getAttributes:attributes=>Object.fromEntries(Object.entries(attributes).map(([key,value])=>[key,equipmentAttributeValue(this.actor.system.attributes[key].base,this.actor.items,key)])),
        beforeUse:request=>this.beginRollOperation(request.kind,request.willRoll,request.id),
        captureSaveBase:()=>({basePlay:structuredClone(this.basePlay ?? {}),baseLoadout:structuredClone(this.baseLoadout ?? {})}),
        onChange:(saved,basis)=>this.saveState(saved,basis),
        onCommit:(portable,view)=>this.commitState(portable,view),
        onAction:async event=>{
          if(event.action==='edit-ability-attribute') {
            await this.editAbilityRollAttribute(event.id);
            return true;
          }
          if(event.action==='apply-workshop-rest') {
            this.assertOwner();
            await this.controller.flush();
            await requestRest(this.actor,event.rest);
            await this.render({force:true});
            return true;
          }
          if (event.action === 'assign-ammunition') {
            this.assertOwner();await this.controller.flush();
            await setRangedWeaponAmmunition(this.actor, event.dataset.instance, event.dataset.ammunition);
            await this.render({force:true});
            return true;
          }
          if(event.action==='sustain-spell') {
            this.assertOwner();await this.controller.flush();
            await prepareNativeActionCost(this.actor,'ability-sustain-spell',foundry.utils.randomID(),'sustain');
            return false;
          }
          if(event.action==='evade') {
            this.assertOwner();await this.controller.flush();
            await new SharedRollDialog(this.actor,'agility',{mode:'defense'}).render({force:true});return true;
          }
          if(event.action==='open-roll'&&!event.id&&event.dataset.attributeKey){
            this.assertOwner();
            await this.controller.flush();
            return new SharedRollDialog(this.actor,event.dataset.attributeKey).render({force:true});
          }
          if(event.action==='open-roll'&&event.id) {
            this.assertOwner();
            const item=this.actor.items.find(item=>item.type==='ability'&&item.getFlag(ID,'catalogId')===event.id&&item.getFlag(ID,'grantKind')==='nativeWorkshop');
            if(item) {
              await this.controller.flush();
              if(await activateOwnedAbility(item,{weaponAttackOnly:true}))return true;
            }
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
          if(event.action==='lower-supply') {
            this.assertOwner();
            if(event.target.disabled)return true;
            event.target.disabled=true;
            try {
              await this.controller.flush();
              const item=nativeItemForWorkshopInstance(this.actor,event.dataset.instance);
              if(!item?.system.quantity || !tracksConsumable(item))throw new Error('Choose an owned consumable with supply tracking enabled.');
              await lowerOwnedSupply(this.actor,item);
              await this.render({force:true});
            } finally {event.target.disabled=false;}
            return true;
          }

          if(event.action==='confirm-native-sale') {
            this.assertOwner();
            if(event.target.disabled)return true;
            const input=event.values['native-sale-price'];
            if(!input?.trim())throw new Error('Enter the agreed price.');
            event.target.disabled=true;
            try {
              await this.controller.flush();
              this.writing++;
              try {
                await sellNativeWorkshopEquipment(this.actor,{
                  itemId:event.id,quantity:Number(event.dataset.quantity),
                  inventoryDie:Number(event.dataset.inventoryDie),coins:Number(input),
                },{expectedRevision:this.revision});
              } finally {this.finishWrite();}
              event.target.closest('dialog')?.close();
              await this.render({force:true});
            } finally {event.target.disabled=false;}
            return true;
          }
          if(event.action==='native-edit-equipment' || event.action==='confirm-drop-item') {
            this.assertOwner();
            const instance=event.dataset.instance;
            const item=nativeItemForWorkshopInstance(this.actor,instance);
            if(item?.type!=='equipment' || !item.isOwner) throw new Error('That owned equipment no longer exists.');
            if(event.action==='native-edit-equipment') {
              await this.controller.flush();
              await item.sheet.render({force:true,editing:true});
              return true;
            }
            if(event.target.disabled)return true;
            event.target.disabled=true;
            try {
              await this.controller.flush();
              if(nativeItemForWorkshopInstance(this.actor,instance)?.id!==item.id)
                throw new Error('That owned equipment changed. Check the inventory before trying again.');
              await this.actor.deleteEmbeddedDocuments('Item',[item.id]);
              event.target.closest('dialog')?.close();
              await this.render({force:true});
            } finally {event.target.disabled=false;}
            return true;
          }
          if(event.action==='native-open-item') {
            if(!this.actor.testUserPermission(game.user,'OBSERVER')) throw new Error('You cannot inspect this character’s items.');
            const item=this.actor.items.get(event.id);
            if(!item) throw new Error('That owned item no longer exists.');
            await item.sheet.render({force:true});return true;
          }
          if(event.action==='native-item' && event.dataset.command==='torch-toggle') {
            this.assertOwner();await requestTorchToggle(this.actor,event.dataset.instance);await this.render({force:true});return true;
          }
          if(event.action==='use-supply-dialog' && event.preview.inventory.items.find(item=>item.instanceId===event.dataset.instance)?.catalogId==='item-lighting-bundle') {
            this.assertOwner();await requestTorchToggle(this.actor,event.dataset.instance);return true;
          }
          if(event.action==='edit-hero-name') {await this.editWorkshopName(event.state);return true;}
          return false;
        },
        postUse:async id=>{
          this.assertOwner();
          const item=this.actor.items.find(item=>item.type==='ability'&&item.getFlag(ID,'catalogId')===id&&item.getFlag(ID,'grantKind')==='nativeWorkshop');
          if(!item)throw new Error('The character no longer owns this ability.');
          return postAbilityReference(item);
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
      let next=await saveNativeWorkshopState(this.actor,saved,{expectedRevision:this.revision,resolvedImmediateDeathRoll,basePlay:basis.basePlay ?? this.basePlay,baseLoadout:basis.baseLoadout ?? this.baseLoadout});
      if(resolvedImmediateDeathRoll) this.resolvedImmediateDeathRoll=undefined;
      this.revision=next.revision;
      this.nativeItems=next.nativeItems ?? this.nativeItems ?? [];
      this.basePlay=structuredClone(next.character?.draft?.play ?? this.basePlay ?? {});
      this.baseLoadout=structuredClone(next.character?.draft?.loadout ?? this.baseLoadout ?? {});
      if(saved.mode==='sheet') {
        const before=this.actor.getFlag(ID,'nativeWorkshop')?.portable?.draft;
        const draft=saved.character?.draft;
        if(before && draft && (before.name!==draft.name || (before.profile?.story ?? '')!==(draft.profile?.story ?? ''))) {
          next=await saveNativeWorkshopIdentity(this.actor,saved.character,{expectedRevision:this.revision});
          this.revision=next.revision;
        }
      }
      if(this.pendingRollSave) {
        const id=this.pendingRollSave;
        this.forgetRoll(id);
        await completeNativeWorkshopOperation(this.actor,id).catch(error=>console.warn('Workshop roll receipt:',error));
      }
      return next;
    } catch(error) {
      await this.interruptRoll();
      throw error;
    } finally {this.finishWrite();}
  }
  async useWorkshopAbility(id) {
    this.assertOwner();
    await this.render({force:true});
    await this.mountReady;
    if(!this.controller) throw new Error('Finish creating this hero in the current Workshop first.');
    return this.controller.useAbility(id);
  }
  async editAbilityRollAttribute(id) {
    this.assertOwner();
    const catalogs=await loadWorkshopCatalogs();
    const record=catalogs.choices.find(record=>record.id===id);
    const item=ownedWorkshopAbility(this.actor,id);
    if(!item?.isOwner || !canCustomizeWorkshopRoll(record)) throw new Error('Choose a rolled ability this hero owns.');
    const original=ownedWorkshopRollAttribute(this.actor,record);
    const attributeName=key=>game.i18n.localize(`HOL.Attributes.${key}`);
    const defaults=workshopRollAttributes(record).map(attributeName).join(' / ');
    const options=ATTRIBUTES.map(key=>`<option value="${key}" ${original===key?'selected':''}>${foundry.utils.escapeHTML(attributeName(key))}</option>`).join('');
    const result=await foundry.applications.api.DialogV2.input({
      classes:[ID,'hol-native-dialog'],window:{title:`Edit ${record.name}`},
      content:`<div class="form-group"><label for="hol-ability-attribute">Roll attribute</label><select autofocus id="hol-ability-attribute" name="attribute"><option value="">Ability default (${foundry.utils.escapeHTML(defaults)})</option>${options}</select></div>`,
      buttons:[{action:'cancel',label:'COMMON.Cancel',type:'button'}],
      ok:{label:'Save attribute'},rejectClose:false,
    });
    if(!result || (result.attribute || null)===original) return;
    const key=result.attribute;
    if(key!=='' && !ATTRIBUTES.includes(key)) throw new Error('Choose a valid roll attribute.');
    await this.controller.flush();
    this.assertOwner();
    if(ownedWorkshopAbility(this.actor,id)?.id!==item.id || ownedWorkshopRollAttribute(this.actor,record)!==original)
      throw new Error('This ability changed. Open its attribute editor again.');
    if(key) await item.setFlag(ID,WORKSHOP_ROLL_ATTRIBUTE_FLAG,key);
    else await item.unsetFlag(ID,WORKSHOP_ROLL_ATTRIBUTE_FLAG);
    await this.render({force:true});
  }
  async saveIdentity(portable) {
    this.assertOwner();this.writing++;
    try {
      const next=await saveNativeWorkshopIdentity(this.actor,portable,{expectedRevision:this.revision});
      this.nativeItems=next.nativeItems ?? this.nativeItems ?? [];
      this.revision=next.revision;this.controller.setState({...next,mode:'sheet'});
    } finally {this.finishWrite();}
  }
  async editWorkshopName(portable) {
    this.assertOwner();
    const name=portable.draft.name;
    const result=await foundry.applications.api.DialogV2.input({
      classes:[ID,'hol-native-dialog'],window:{title:'Edit character name'},
      content:`<div class="form-group"><label for="hol-character-name">Character name</label><input autofocus id="hol-character-name" name="name" value="${foundry.utils.escapeHTML(name)}" required maxlength="200"></div>`,
      buttons:[{action:'cancel',label:'COMMON.Cancel',type:'button'}],
      ok:{label:'Save name'},rejectClose:false,
    });
    const nextName=result?.name?.trim();
    if(!nextName || nextName===name) return;
    await this.controller.flush();
    const current=this.controller.getState().character;
    current.draft.name=nextName;
    await this.saveIdentity(current);
  }
  async commitState(portable,{tab='Main'}={}) {
    this.assertOwner();this.writing++;
    try {
      const next=await commitNativeWorkshopCharacter(this.actor,portable,{expectedRevision:this.revision,tab});
      this.revision=next.revision;
      this.nativeItems=next.nativeItems ?? this.nativeItems ?? [];
      if(this.host) this.host.committed=true;
      this.basePlay=structuredClone(next.character.draft.play ?? {});
      this.baseLoadout=structuredClone(next.character.draft.loadout ?? {});
      this.controller.setState({...next,mode:'sheet',tab,step:0,editingLevel:null});
      ui.notifications.info('Hero saved to the native Actor.');
    } finally {this.finishWrite();}
  }
  bindWorkshopPortrait(image) {
    if(!image) return;
    const editable=this.isEditable && this.actor.testUserPermission(game.user,'OWNER');
    image.dataset.action=editable ? 'editImage' : 'viewPortrait';
    if(editable) image.dataset.edit='img';else delete image.dataset.edit;
    image.alt=editable ? 'Edit character portrait' : 'View character portrait';
    if(image.getAttribute('src')!==this.actor.img) image.setAttribute('src',this.actor.img);
    if(this.boundPortrait===image) return;
    this.portraitObserver?.disconnect();
    this.boundPortrait=image;
    bindPortraitControls(this);
    // The stock picker changes the IMG; the Workshop does not submit a sheet form.
    this.portraitObserver=new MutationObserver(()=>{
      if(image.dataset.edit && image.getAttribute('src')!==this.actor.img)
        savePortrait.call(this).catch(error=>ui.notifications.error(error.message));
    });
    this.portraitObserver.observe(image,{attributes:true,attributeFilter:['src']});
  }
  forgetRoll(id) {
    if(this.preparedRollId===id)this.preparedRollId=undefined;
    if(this.pendingRollSave===id)this.pendingRollSave=undefined;
  }
  async interruptRoll(id=this.preparedRollId) {
    if(!id)return;
    this.forgetRoll(id);
    await interruptNativeWorkshopOperation(this.actor,id).catch(error=>console.warn('Workshop roll receipt:',error));
  }
  async beginRollOperation(kind,willRoll=true,id) {
    this.assertOwner();
    if(this.operationStarting || this.preparedRollId) throw new Error('This window is still processing a roll.');
    this.operationStarting=true;
    const operation={id:foundry.utils.randomID(),status:'prepared',kind};
    try {
      await this.controller?.flush();
      if(kind==='cast'&&id)await prepareNativeActionCost(this.actor,id,operation.id,'cast');
      else await claimNativeWorkshopOperation(this.actor,operation);
      this.preparedRollId=operation.id;
      if(!willRoll) this.pendingRollSave=operation.id;
      return operation;
    } finally {this.operationStarting=false;}
  }
  async rollDice(request) {
    this.assertOwner();
    try {
      return await this.evaluateWorkshopDice(request);
    } catch (error) {
      await this.interruptRoll();
      throw error;
    }
  }
  async evaluateWorkshopDice(request) {
    await this.controller?.flush();
    const {count,sides,net=0,kind}=request;
    const abilityId=request.activeRoll?.id;
    const catalogs=abilityId || request.abilityIds?.length ? await loadWorkshopCatalogs() : null;
    const record=catalogs?.choices.find(record=>record.id===abilityId) ?? catalogs?.forge.spells.find(record=>record.id===abilityId);
    const override=ownedWorkshopRollAttribute(this.actor,record);
    if (request.activeRoll?.attributeOverride !== undefined && request.activeRoll.attributeOverride !== override)
      throw new Error('This ability’s roll attribute changed. Reopen the roll to use its current attribute.');
    if (record?.weaponRequirement || record?.attributeChoices || override)
      validateWorkshopAbilityUse(record, [...this.actor.items].filter(item=>item.type==='equipment').map(item=>item.system), request.attributeKey, override);
    const attribute=request.attributeKey ? effectiveActorAttributeValue(this.actor.system.attributes[request.attributeKey].base,this.actor,request.attributeKey) : (request.attribute ?? 0);
    if(request.attributeKey && attribute!==request.attribute) throw new Error('Equipment changed this attribute. Reopen the roll to use its current effective value.');
    const pendingDeathRoll=kind==='death' ? this.actor.getFlag(ID,'forgeVitals')?.immediateDeathRolls?.[0] : undefined;
    if(!Number.isInteger(count)||count<1||count>6||![4,6,8,10,12,20].includes(sides)) throw new Error('Invalid Workshop dice request.');
    const keep=kind==='supply' ? '' : net<0 ? 'kl3' : 'kh3';
    const modifier=kind==='supply' ? '' : attribute>=0 ? `+${attribute}` : String(attribute);
    const messageMode=game.settings.get('core','messageMode');
    if(this.host) this.host.hideRollResults=messageMode==='blind' && !game.user.isGM;
    const prepared=(this.preparedRollId && nativeWorkshopRoll(this.actor,this.preparedRollId)) || await this.beginRollOperation(kind);
    const operationId=prepared.id;
    const operation={...prepared,status:'evaluating',kind,settings:{...request.activeRoll,key:request.attributeKey}};
    await updateNativeWorkshopOperation(this.actor,operation);
    const roll=await new foundry.dice.Roll(`${count}d${sides}${keep}${modifier}`).evaluate({allowInteractive:messageMode!=='blind'});
    const faces=roll.dice[0].results.filter(result=>!result.rerolled).map(result=>result.result);
    await updateNativeWorkshopOperation(this.actor,{...operation,status:'evaluated',faces,formula:roll.formula});
    let content, rollSnapshot;
    if(kind==='supply') {
      const check=inventoryCheck({die:sides,retained:faces[0]});
      content=resourceCard({actor:this.actor.name,title:request.item?.name ?? request.item?.definition?.name ?? 'Supply check',kind:'supply',die:{face:faces[0],before:sides,after:check.after},status:'Rolled',detail:'A 1 steps the supply down; the final use still works.'});
    } else {
      const dice=roll.dice[0].results.filter(die=>!die.rerolled)
        .map((die,index)=>({index,face:die.result,kept:die.active!==false}));
      const retainedIndices=dice.filter(die=>die.kept).map(die=>die.index);
      const retained=retainedIndices.map(index=>faces[index]);
      const result=classifyRoll(retained,attribute);
      if(kind==='death') {result.tier=result.total<=8 ? 'weak' : result.total<=14 ? 'standard' : 'strong';result.natural='none';}
      const outcomes=spellAttackOutcomes(request.activeRoll?.cast||request.activeRoll?.finishRitual?record:null);
      if(outcomes) {
        rollSnapshot={mode:'attack',actorUuid:this.actor.uuid,ability:{name:record.name,effect:record.effect,outcomes},
          resolvedEffects:resolvedAttackEffects(outcomes[result.tier]),attributeKey:request.attributeKey,
          attribute,net,count,boons:Math.max(0,net),banes:Math.max(0,-net),dice,retained,...result};
      } else {
        const learned = new Set(this.actor.getFlag(ID, 'forgeLearned') ?? []);
        const improvements = record ? catalogs.forge.nodes.filter(node => node.improves === record.id && learned.has(node.id)) : [];
        const outcome = workshopRollOutcome(record, improvements, result.tier);
        content=rollCard({actor:this.actor.name,portrait:this.actor.img,allowReroll:false,mode:request.activeRoll?.defense ? 'defense' : 'attribute',
          attribute:request.attributeKey ?? (kind==='death' ? 'fortitude' : ''),title:kind==='death' ? 'Fortitude death roll' : `${record?.name ?? 'Attribute check'}${request.equipmentNames?.length ? ' · '+request.equipmentNames.join(', ') : ''}`,
          outcome:outcome.text, effect:record?.signatureComponent ? signatureProse(record) : record?.effect ?? '',abilities:(request.abilityIds ?? []).map(id=>catalogs?.choices.find(record=>record.id===id)?.name ?? id),roll:{faces,retainedIndices,result,plan:{attribute,net,count,formula:roll.formula}}});
      }
    }
    const flags=rollSnapshot?{roll:rollSnapshot}:{nativeWorkshopRoll:{kind,actorUuid:this.actor.uuid}};
    await roll.toMessage({speaker:ChatMessage.getSpeaker({actor:this.actor}),...(content?{content}:{}),flags:{[ID]:flags}},{messageMode});
    if(kind==='death') this.resolvedImmediateDeathRoll=pendingDeathRoll;
    if(kind==='death' || kind==='supply') this.pendingRollSave=operationId;
    else {
      this.forgetRoll(operationId);
      await completeNativeWorkshopOperation(this.actor,operationId).catch(error=>console.warn('Workshop roll receipt:',error));
    }
    return faces;
  }
  async close(options={}) {
    try {
      if(this.controller?.settle) await this.controller.settle();else await this.controller?.flush();
    } catch(error) {
      ui.notifications.error(error.message);
    }
    return super.close(options);
  }
  async _preClose(options) {
    await super._preClose(options);
    // Foundry serializes this hook after queued Actor renders. A render before
    // teardown can still use the current controller and its live frame.
    this.portraitObserver?.disconnect();
    this.boundPortrait=null;
    ++this.mountGeneration;this.controller?.dispose();this.controller=null;
    this.refreshAfterWrite=false;
  }
  static async recreateWorkshop() {
    try {
      this.assertOwner();
      const actor=await Actor.create({name:'New hero',type:'character'});
      return actor.sheet.render({force:true});
    } catch(error){ui.notifications.error(error.message);}
  }
}

/** The compact Workshop card already shows the evaluated result. */
export function bindNativeWorkshopChat(message,element) {
  const saved=message.getFlag(ID,'nativeWorkshopRoll');
  if(!saved || !message.isContentVisible) return;
  // The shared compact card already contains the full visual dice result.
  element.querySelectorAll('.dice-roll').forEach(node=>node.hidden=true);
}
