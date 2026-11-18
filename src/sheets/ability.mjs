import { abilityCatalogRecord } from "../rules/ability-roll.mjs";
import { itemCardContext, formatItemCard } from "./item-card-view.mjs";
import { itemDisplayIcon } from "../rules/item-icons.mjs";
import { loadWorkshopCatalogs } from "../services/catalog.mjs";
import { cardContext, bindCardState, toggleCardEdit } from "./card-state.mjs";
import { postAbilityReference } from "../services/reference-play.mjs";
import {
  itemAbilityDefinition,
  activateOwnedAbility,
} from "../services/abilities.mjs";
import { openPotionPreparation } from "../applications/potions.mjs";
import { isPotionAbility } from "../services/potions.mjs";
import { isForgeModifier } from "../rules/forge-casting.mjs";
import { ATTRIBUTES } from "../rules/character.mjs";
import { updateOwnedDocument } from "../services/documents.mjs";
import { formatStoredRuleProse } from "../rules/authored-markdown.mjs";
export class AbilitySheet extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.sheets.ItemSheetV2,
) {
  static DEFAULT_OPTIONS = {
    classes: ["heroes-of-legend", "hol-ability"],
    position: { width: 510, height: "auto" },
    window: { resizable: true },
    form: { submitOnChange: false, closeOnSubmit: false },
    actions: {
      cardEdit: toggleCardEdit,
      useAbility: AbilitySheet.useAbility,
      postReference: AbilitySheet.postReference,
    },
  };
  static PARTS = {
    main: {
      template: "systems/heroes-of-legend/templates/ability.hbs",
      scrollable: [".hol-card-scroll"],
    },
  };
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    let definition = null;
    try {
      definition = itemAbilityDefinition(this.item);
    } catch {}
    const spell = this.item.getFlag("heroes-of-legend", "spell");
    const workshopRecord = this.item.getFlag("heroes-of-legend", "workshopRecord");
    const current = Boolean(spell || this.item.getFlag("heroes-of-legend", "grantKind") === "nativeWorkshop" || this.item.getFlag("heroes-of-legend", "workshopRecord"));
    const iconCatalogs = await loadWorkshopCatalogs();
    const record = abilityCatalogRecord(this.item, iconCatalogs.choices);
    const system = this.item.system;
    const description = current ? formatStoredRuleProse(system.description) : system.description;
    const learned = new Set(this.item.actor?.getFlag("heroes-of-legend", "forgeLearned") ?? []);
    const learnedImprovements = current ? (iconCatalogs.forge?.nodes ?? []).filter(node => learned.has(node.id) && node.improves === this.item.getFlag("heroes-of-legend", "catalogId")) : [];
    const labels = (keys) =>
      Object.fromEntries(
        keys.map((key) => [key, game.i18n.localize(`HOL.Choices.${key}`)]),
      );
    return {
      ...context,
      ...cardContext(this, this.item),
      ...itemCardContext(this.item, iconCatalogs),
      definition,
      spell,
      currentWorkshop: current,
      ...(workshopRecord ? {cardLevel:workshopRecord.level??1,cardCost:workshopRecord.cost??"—"} : {}),
      cardKind: spell ? "Spell" : "Ability",
      spellTiming: spell?.action ?? "",
      learnedImprovements,
      manualOutcomes: !description.includes("hol-reference-outcomes") ? ["weak","standard","strong"].filter(tier=>system.outcomes?.[tier]).map(tier=>({label:game.i18n.localize(`HOL.${tier[0].toUpperCase()+tier.slice(1)}`),text:system.outcomes[tier]})) : [],
      cardMark: itemDisplayIcon(this.item.toObject(), iconCatalogs),
      canPost: Boolean(this.item.actor && this.item.isOwner),
      catalogAbility: Boolean(record),
      potionAbility: isPotionAbility(this.item),
      canUse: Boolean(this.item.actor?.isOwner && (system.activity.action !== "passive" || (isForgeModifier(workshopRecord) && Number.isSafeInteger(workshopRecord?.sp))) && !["section", "improvement"].includes(workshopRecord?.kind)),
      pendingAutomation:
        !definition &&
        this.item.getFlag("heroes-of-legend", "automation") === "pending",
      descriptionHTML: description
        ? await foundry.applications.ux.TextEditor.implementation.enrichHTML(
            description,
            { relativeTo: this.item },
          )
        : "",
      item: this.item,
      system,
      editable: this.isEditable,
      attributes: Object.fromEntries(
        ATTRIBUTES.map((key) => [
          key,
          game.i18n.localize(`HOL.Attributes.${key}`),
        ]),
      ),
      actions: {...labels(["main", "maneuver", "reaction", "passive", "movement", "other"]),ritual:"Ritual"},
      rollModes: labels(["attribute", "none", "delegated"]),
    };
  }
  static async postReference() {
    try {
      await postAbilityReference(this.item);
    } catch (e) {
      ui.notifications.error(e.message);
    }
  }
  static async useAbility() {
    try {
      if (isPotionAbility(this.item)) return openPotionPreparation(this.item);
      if (this.item.actor?.getFlag("heroes-of-legend", "nativeWorkshop")?.portable && (this.item.getFlag("heroes-of-legend", "grantKind") === "nativeWorkshop" || this.item.getFlag("heroes-of-legend", "workshopRecord") || this.item.getFlag("heroes-of-legend", "spell"))) {
        const sheet = this.item.actor.sheet;
        await sheet.render({force:true});
        if (!sheet.useWorkshopAbility) throw new Error("Open the current character sheet to use this ability.");
        return sheet.useWorkshopAbility(this.item.getFlag("heroes-of-legend", "catalogId"));
      }
      await activateOwnedAbility(this.item);
    } catch (e) {
      ui.notifications.error(e.message);
    }
  }
  async _onRender(context, options) {
    await super._onRender(context, options);
    bindCardState(this, this.item);
    formatItemCard(this.element);
    const {localizeRuleLinks} = await import("../services/journals.mjs");
    await localizeRuleLinks(this.element);
  }
  async _processSubmitData(event, form, data, options) {
    if (!this.isEditable)
      throw new Error(game.i18n.localize("HOL.NoPermission"));
    return { updated: await updateOwnedDocument(this.item, data, options) };
  }
}
