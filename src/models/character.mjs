import { equipmentBonuses } from "../rules/equipment-bonuses.mjs";
import {effectiveActorAttributeValue} from "../rules/effective-attributes.mjs";
import {
  ATTRIBUTES,
  characterSummary,
  validateCharacter,
} from "../rules/character.mjs";
import { StrictNumberField as NumberField } from "./fields.mjs";
import { normalizeForgeRecovery } from "../rules/forge-recovery.mjs";
const { ArrayField, SchemaField, StringField, BooleanField } = foundry.data.fields;
const integer = (initial, min = 0, max) =>
  new NumberField({
    required: true,
    nullable: false,
    integer: true,
    initial,
    min,
    max,
  });

export class CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      schemaVersion: integer(1, 1, 1),
      attributes: new SchemaField(
        Object.fromEntries(
          ATTRIBUTES.map((key) => [
            key,
            new SchemaField({ base: integer(0, -2, 2) }),
          ]),
        ),
      ),
      health: new SchemaField({ value: integer(12), baseMax: integer(12, 1) }),
      grit: new SchemaField({ granted: integer(1), spent: integer(0) }),
      sp: new SchemaField({ value: integer(0), max: integer(0) }),
      recovery: new SchemaField({
        unavailableHp: integer(0, 0),
        debtUsed: new BooleanField({ required: true, nullable: false, initial: false }),
      }),
      damageImmunities: new ArrayField(new StringField({required:true, nullable:false, blank:false}), {required:true, nullable:false, initial:[]}),
      conditionImmunities: new ArrayField(new StringField({required:true, nullable:false, blank:false}), {required:true, nullable:false, initial:[]}),
      memorizedMessage: new StringField({
        required: true,
        nullable: false,
        initial: "",
        maxLength: 5000,
      }),
      biography: new StringField({
        required: true,
        nullable: false,
        initial: "",
      }),
    };
  }
  static validateJoint(data) {
    // Embedded equipment contributes to the effective maximum after source validation.
    validateCharacter(data, { maximumHp: Infinity });
    normalizeForgeRecovery(data.recovery);
  }
  prepareDerivedData() {
    const summary = characterSummary(this);
    const bonuses = equipmentBonuses(this.parent?.items);
    this.health.max = summary.healthMax + bonuses.hp;
    this.sp.max = this._source.sp.max + bonuses.sp;
    this.health.value = Math.min(this.health.value, this.health.max);
    this.sp.value = Math.min(this.sp.value, this.sp.max);
    this.grit.available = summary.gritAvailable;
    this.attributeEffectErrors = [];
    for (const key of ATTRIBUTES) {
      try {this.attributes[key].effective = effectiveActorAttributeValue(this.attributes[key].base,this.parent,key);}
      catch(error) {this.attributes[key].effective = null;this.attributeEffectErrors.push(error.message);}
    }
  }
  get attributeTotal() {
    return characterSummary(this).attributeTotal;
  }
}
