import { bladeCastingSpChanges, BLADE_CASTING_SP_FLAG } from "../rules/native-character-state.mjs";
import { equipmentBonuses } from "../rules/equipment-bonuses.mjs";
import { enqueueCharacterOperation, writeAuthorityDocument } from "./authority.mjs";

const ID = "heroes-of-legend";
const activeGM = () => game.user.isGM && game.users.activeGM?.isSelf;
const isPendingBlade = actor => actor.type === "character" &&
  !actor.getFlag(ID, BLADE_CASTING_SP_FLAG) &&
  actor.getFlag(ID, "nativeWorkshop")?.portable?.draft?.classId === "class-blade";

function migrateBladeReserves() {
  if (!activeGM()) return;
  for (const actor of game.actors.filter(isPendingBlade)) {
    void enqueueCharacterOperation(async () => {
      if (!activeGM() || !isPendingBlade(actor)) return;
      const { sp, attributes } = actor.toObject().system;
      const changes = bladeCastingSpChanges({
        classId: "class-blade", sp, attributes, bonusSp: equipmentBonuses(actor.items).sp,
      });
      if (changes) await writeAuthorityDocument(actor, changes);
    }).catch(error => console.error(`${ID} | Blade SP reserve update failed for ${actor.id}`, error));
  }
}

export function registerCastingSpMigration() {
  Hooks.once("ready", migrateBladeReserves);
  Hooks.on("userConnected", migrateBladeReserves);
}
