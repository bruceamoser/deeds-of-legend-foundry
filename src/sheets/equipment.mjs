import { CONSUMABLE_TYPES } from '../rules/consumables.mjs';
import { tracksConsumable } from '../services/consumables.mjs';
import { torchItemActions, requestTorchToggle } from "../services/torches.mjs";
import {ITEM_EFFECT_ATTRIBUTES,ITEM_EFFECT_MODES,readAttributeEffectRows} from "../rules/effective-attributes.mjs";
import { equipmentEditableDescription } from "./equipment-description.mjs";
import { equipmentReferenceHtml } from "../rules/item-construction.mjs";
import { itemCardContext, formatItemCard } from "./item-card-view.mjs";
import { localRulePage } from "../services/journals.mjs";
import { itemDisplayIcon } from "../rules/item-icons.mjs";
import { requestResupply } from "../services/resupply.mjs";
import { cardContext, bindCardState, toggleCardEdit } from "./card-state.mjs";
import { EquipmentPanel } from "../applications/equipment.mjs";
import { consumeOwnedSupply, depleteOwnedSupply } from "../services/inventory.mjs";
import { openPotionPreparation } from "../applications/potions.mjs";
import { loadWorkshopCatalogs } from "../services/catalog.mjs";
import { updateOwnedDocument } from "../services/documents.mjs";
import { isHealingPotionItem } from "../services/potions.mjs";
export class EquipmentSheet extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.sheets.ItemSheetV2,
) {
  static DEFAULT_OPTIONS = {
    actions: {
      cardEdit: toggleCardEdit,
      torch: EquipmentSheet.torch,
      resupply: EquipmentSheet.resupply,
      hands: EquipmentSheet.hands,
      supply: EquipmentSheet.supply,
      deplete: EquipmentSheet.deplete,
      usePotion: EquipmentSheet.usePotion,
    },
    classes: ["heroes-of-legend", "hol-equipment"],
    position: { width: 510, height: "auto" },
    window: { resizable:true },
    form: { submitOnChange: false, closeOnSubmit: false },
  };
  static PARTS = {
    main: { template: "systems/heroes-of-legend/templates/equipment.hbs", scrollable: [".hol-card-scroll"] },
  };
  async _prepareContext(options) {
    if(options?.editing && this.isEditable)this._cardEditing=true;
    const catalogs = await loadWorkshopCatalogs(),
      description = this.item.system.description,
      pending = this.item.actor?.getFlag(
        "heroes-of-legend",
        "pendingInventory",
      ),
      results =
        this.item.actor?.getFlag("heroes-of-legend", "inventoryResults") ?? {},
      catalogSupply = catalogs?.inventory.equipment.find(
        (record) => record.id === this.item.system.catalogId,
      )?.inventoryDie,
      priorSupply =
        pending?.target?.itemId === this.item.id
          ? pending.target.inventoryDie
          : Object.values(results)
              .reverse()
              .find((result) => result.target?.itemId === this.item.id)?.target
              .inventoryDie,
      originalSupplyDie = Number.isSafeInteger(catalogSupply)
        ? catalogSupply
        : priorSupply,
      hadSupply =
        Number.isSafeInteger(originalSupplyDie) && originalSupplyDie > 0,
      hasSupply = hadSupply || this.item.system.inventoryDie > 0;
    const presentation = itemCardContext(this.item, catalogs);
    let rules = description;
    if (presentation.cardSourcePath) {
      try { rules = (await localRulePage(presentation.cardSourcePath)).text.content; }
      catch (error) { console.warn("heroes-of-legend | Equipment rule reference unavailable", error.message); }
    }
    return {
      ...(await super._prepareContext(options)),
      ...presentation,
      customDescriptionHTML: description && presentation.cardRecord && description !== equipmentReferenceHtml(presentation.cardRecord,{sourceCommit:catalogs.commit})
        ? await foundry.applications.ux.TextEditor.implementation.enrichHTML(description,{relativeTo:this.item}) : "",
      ...cardContext(this, this.item),
      editableDescription: equipmentEditableDescription(description),
      supplyDieOptions: [0,4,6,8,10,12,20].map(value=>({value,label:value ? `d${value}` : "Depleted",selected:value===this.item.system.inventoryDie})),
      attributeEffectRows: ITEM_EFFECT_ATTRIBUTES.map(attribute=>{const effect=(this.item.system.attributeEffects??[]).find(effect=>effect.attribute===attribute);return {attribute,label:attribute[0].toUpperCase()+attribute.slice(1),value:effect?.value??0,cursed:effect?.cursed??false,modes:[{value:"none",label:"None",selected:!effect},...ITEM_EFFECT_MODES.map(mode=>({value:mode,label:{modifier:"Modifier",set:"Set exact value","curse-override":"Curse override"}[mode],selected:effect?.mode===mode}))]};}),
      attributeEffectSummary:(this.item.system.attributeEffects??[]).map(effect=>({label:effect.attribute[0].toUpperCase()+effect.attribute.slice(1),value:`${effect.mode === "modifier" ? "" : effect.mode === "set" ? "Set " : "Curse sets "}${effect.value>=0?"+":""}${effect.value}${effect.cursed?" · cursed":""}`})),
      consumableTypeOptions: Object.entries({auto:"From item type",none:"Not a consumable",...CONSUMABLE_TYPES}).map(([value,label])=>({value,label,selected:value===(this.item.system.consumableType??"auto")})),
      supplyTracking: tracksConsumable(this.item),
      maximumSupplyDie: catalogSupply > 0 ? catalogSupply : null,
      item: this.item,
      cardMark: itemDisplayIcon(this.item.toObject(), catalogs),
      system: this.item.system,
      editable: this.isEditable,
      descriptionHTML: rules
        ? await foundry.applications.ux.TextEditor.implementation.enrichHTML(
            rules,
            { relativeTo: this.item },
          )
        : "",
      owned: Boolean(this.item.actor),
      torchAction: this.item.actor ? torchItemActions(this.item.actor, {id:this.item.id})[0] : null,
      canCheckSupply: Boolean(
        this.item.actor &&
          hasSupply &&
          this.item.system.inventoryDie > 0 &&
          (this.item.actor.isOwner || game.user.isGM),
      ),
      canResupply: Boolean(this.item.actor?.isOwner && hasSupply),
      supplyOut:
        Boolean(this.item.actor) &&
        hadSupply &&
        this.item.system.inventoryDie === 0,
      potion: Boolean(
        this.item.actor &&
          isHealingPotionItem(this.item) &&
          (this.item.actor.isOwner || game.user.isGM),
      ),
    };
  }
  static async torch() {
    try { await requestTorchToggle(this.item.actor, this.item.id); }
    catch(error) { ui.notifications.error(error.message); }
  }
  static async resupply() {
    try { await requestResupply(this.item.actor, this.item); }
    catch(error) { ui.notifications.error(error.message); }
  }
  static async hands() {
    if (this.item.actor)
      await new EquipmentPanel(this.item.actor).render({ force: true });
  }
  static async supply() {
    try {
      if (!this.item.actor)
        throw new Error("Only an owned equipment item can check supply.");
      await consumeOwnedSupply(this.item.actor, this.item);
    } catch (error) {
      ui.notifications.error(error.message);
    }
  }
  static async deplete() {
    try { await depleteOwnedSupply(this.item.actor, this.item); await this.render({force:true}); }
    catch(error) { ui.notifications.error(error.message); }
  }
  static async usePotion() {
    try {
      if (!isHealingPotionItem(this.item))
        throw new Error("This equipment does not use a healing potion plan.");
      await openPotionPreparation(this.item, {
        bottleItemUuid: this.item.uuid,
      });
    } catch (error) {
      ui.notifications.error(error.message);
    }
  }
  async _onRender(context, options) {
    await super._onRender(context, options);
    bindCardState(this, this.item);
    formatItemCard(this.element);
    const {localizeRuleLinks} = await import("../services/journals.mjs");
    await localizeRuleLinks(this.element);
    this.element.querySelector("[data-item-quantity]")?.addEventListener("change", async event => {
      try {
        if (!this.isEditable) throw new Error(game.i18n.localize("HOL.NoPermission"));
        const quantity = Number(event.target.value);
        if (!Number.isSafeInteger(quantity) || quantity < 0) throw new Error("Quantity must be a nonnegative whole number.");
        await updateOwnedDocument(this.item,{"system.quantity":quantity});
        await this.render({force:true});
      } catch (error) { ui.notifications.error(error.message); await this.render({force:true}); }
    });
  }
  async _processSubmitData(event, form, data, options) {
    const image = form.querySelector('img[data-edit="img"]');
    if (image) data.img = image.getAttribute("src");
    const rows=[...form.querySelectorAll("[data-attribute-effect]")];
    if (rows.length) data["system.attributeEffects"]=readAttributeEffectRows(rows);
    const updated = await updateOwnedDocument(this.item, data, options);
    this._cardEditing = false;
    await this.render({force:true});
    return {updated};
  }
}
