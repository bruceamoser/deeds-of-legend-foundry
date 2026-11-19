import { EQUIPMENT_STAT_BONUSES } from "../rules/equipment-bonuses.mjs";
import { DAMAGE_TYPES } from "../rules/damage.mjs";
import { WATER_FLASK } from "../rules/equipment-identity.mjs";
import { legacyWaterSupplyDie } from "../rules/inventory.mjs";
import { CONSUMABLE_TYPES } from '../rules/consumables.mjs';
import {ITEM_EFFECT_ATTRIBUTES,ITEM_EFFECT_MODES,validateItemAttributeEffects} from "../rules/effective-attributes.mjs";
import { StrictNumberField as NumberField } from "./fields.mjs";
const { HTMLField, StringField, BooleanField, ArrayField, SchemaField } = foundry.data.fields;
const integer = (initial, min, max) =>
  new NumberField({
    required: true,
    nullable: false,
    integer: true,
    initial,
    min,
    max,
  });
export class EquipmentData extends foundry.abstract.TypeDataModel {
  static migrateData(source) {
    if (source.catalogId === WATER_FLASK && (source.schemaVersion ?? 1) === 1) {
      source.inventoryDie = source.inventoryDie || legacyWaterSupplyDie(source.waterUnits);
      source.schemaVersion = 2;
      delete source.waterUnits;
    }
    return super.migrateData(source);
  }
  static defineSchema() {
    return {
      schemaVersion: integer(1, 1, 2),
      catalogId: new StringField({
        required: true,
        nullable: false,
        initial: "",
      }),
      attributeEffects: new ArrayField(new SchemaField({
        attribute:new StringField({required:true,nullable:false,choices:ITEM_EFFECT_ATTRIBUTES}),
        mode:new StringField({required:true,nullable:false,choices:ITEM_EFFECT_MODES}),
        value:integer(0),
        cursed:new BooleanField({required:true,nullable:false,initial:false}),
      }),{required:true,nullable:false,initial:[]}),
      bonuses: new SchemaField(Object.fromEntries([
        ...Object.keys(EQUIPMENT_STAT_BONUSES).map(key => [key, integer(0, 0)]),
        ...DAMAGE_TYPES.map(type => [type, integer(0, 0, 3)]),
      ])),
      consumableType: new StringField({required:true,nullable:false,initial:"auto",choices:["auto","none",...Object.keys(CONSUMABLE_TYPES)]}),
      quantity: integer(1, 0),
      bulk: integer(1, 0),
      hands: integer(0, 0, 2),
      inventoryDie: integer(0, 0, 20),
      carried: new BooleanField({ initial: true }),
      held: new BooleanField({ initial: false }),
      worn: new BooleanField({ initial: false }),
      description: new HTMLField({
        required: true,
        nullable: false,
        initial: "",
      }),
    };
  }
  static validateJoint(data) {
    validateItemAttributeEffects(data.attributeEffects ?? []);
    if (data.carried === false && (data.held || data.worn))
      throw new Error("Stored equipment cannot be held or worn.");
    if (![0, 4, 6, 8, 10, 12, 20].includes(data.inventoryDie))
      throw new Error("Invalid inventory die");
  }
}
