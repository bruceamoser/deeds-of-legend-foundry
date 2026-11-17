import {ATTRIBUTES} from '../rules/character.mjs';
import {updateOwnedDocument} from '../services/documents.mjs';
import {editPortrait,viewPortrait} from './portrait.mjs';
import {promptAttributeRoll} from '../dialogs/attribute-roll.mjs';
import {RecoveryPanel} from '../applications/recovery.mjs';

/** Native NPC/creature document controls, independent of retired PC sheets. */
export class CreatureSheetBase extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS={
    classes:['heroes-of-legend'],position:{width:700,height:720},window:{resizable:true},
    form:{submitOnChange:false,closeOnSubmit:false},
    actions:{editImage:CreatureSheetBase.editPortrait,viewPortrait,recovery:CreatureSheetBase.recovery,rollAttribute:CreatureSheetBase.rollAttribute},
  };
  async _prepareContext(options) {
    return {...await super._prepareContext(options),actor:this.actor,system:this.actor.system,editable:this.isEditable,owned:this.actor.isOwner,gm:game.user.isGM,
      attributes:ATTRIBUTES.map(key=>({key,label:game.i18n.localize(`HOL.Attributes.${key}`),base:this.actor.system.attributes[key].base,effective:this.actor.system.attributes[key].effective})),
    };
  }
  async _processSubmitData(_event,_form,data,options) {
    if(!this.isEditable)throw new Error(game.i18n.localize('HOL.NoPermission'));
    return {updated:await updateOwnedDocument(this.actor,data,options)};
  }
  static async editPortrait(){try{return await editPortrait.call(this);}catch(error){ui.notifications.error(error.message);}}
  static async recovery(){await new RecoveryPanel(this.actor).render({force:true});}
  static async rollAttribute(_event,target){try{await promptAttributeRoll(this.actor,target.dataset.attribute);}catch(error){ui.notifications.error(error.message);}}
}
