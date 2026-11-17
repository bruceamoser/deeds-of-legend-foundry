/** Validate native embedded data before a coordinated Actor update. */
export function validateEmbeddedActorChanges(actor, changes) {
  for (const data of changes.items ?? []) {
    const item = new Item(data, { parent: actor, strict: true });
    item.validate({ strict: true, fallback: false });
  }
  for (const data of changes.effects ?? []) {
    const effect = new foundry.documents.ActiveEffect(data, { parent: actor, strict: true });
    effect.validate({ strict: true, fallback: false });
  }
  actor.validate({
    changes: foundry.utils.expandObject(changes),
    strict: true,
    fallback: false,
  });
}
