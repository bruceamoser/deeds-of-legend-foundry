import {damageEvent} from "./damage.mjs";
const integer = (value, label) => {if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} must be a nonnegative integer.`); return value;};
/** Geometry adapter supplies the chosen consecutive path, including elevation.
 * Source and path coordinates use scene squares. No geometry or targeting is inferred. */
export function validateForcedDirection({kind, source, path, allowElevation = false}) {
  if (!["push", "pull", "slide"].includes(kind) || !Array.isArray(path) || !path.length) throw new Error("Choose a forced-movement kind and path.");
  const coordinates = point => {
    if (!point || ![point.x, point.y, point.z ?? 0].every(Number.isSafeInteger)) throw new Error("Forced movement needs integer square coordinates.");
    return [point.x, point.y, point.z ?? 0];
  };
  const origin = kind === "slide" ? null : coordinates(source), points = path.map(coordinates);
  for (let index = 1; index < points.length; index++) {
    const before = points[index - 1], after = points[index], delta = after.map((value, axis) => value - before[axis]);
    if (Math.max(...delta.map(Math.abs)) !== 1) throw new Error("Forced movement path must be consecutive.");
    if (kind !== "slide") {
      if (!allowElevation && delta[2]) throw new Error("This Push or Pull cannot change elevation.");
      const direction = before.map((value, axis) => Math.sign(value - origin[axis]) * (kind === "push" ? 1 : -1));
      for (let axis = 0; axis < 3; axis++) {
        if (axis === 2 && !allowElevation) continue;
        if (delta[axis] !== direction[axis]) throw new Error("Push moves directly away and Pull directly toward the source.");
      }
    }
  }
  return path.map(point => ({...point}));
}
/** Explicit contact ledger; placement and object-without-HP results stay with the DA.
 * A contact's terrain costs belong to travel before that contact. Continued contact
 * is ignored. Movable objects explicitly marked broken drop out before travel. */
export function forcedMovementPlan({allowance, original, contacts = []}) {
  let remaining = integer(allowance, "Movement"), stopped = false;
  const members = new Map(), struck = new Set(), impacts = [];
  const validate = member => {
    if (!member || typeof member.id !== "string" || !member.id || !["creature", "object", "barrier"].includes(member.kind)) throw new Error("Identify each collision participant and kind.");
    if (member.kind === "creature") integer(member.stability ?? 0, "Stability");
    if (member.hp != null) integer(member.hp, "Object HP");
    return structuredClone(member);
  };
  const first = validate(original);
  if (first.kind !== "creature") throw new Error("Identify the original moving creature.");
  members.set(first.id, first); struck.add(first.id);
  remaining = Math.max(0, remaining - Math.min(3, first.stability ?? 0));
  for (const contact of contacts) {
    if (stopped || !remaining) break;
    const cost = integer(contact.travelCost ?? 0, "Travel cost");
    remaining = Math.max(0, remaining - cost);
    if (!remaining) break;
    const target = validate(contact.target);
    if (struck.has(target.id)) continue;
    struck.add(target.id);
    const rawDamage = remaining + Number(target.kind === "barrier");
    const results = [...members.values(), target].map(member => ({id:member.id,
      ...(member.kind !== "creature" && member.hp == null ? {requiresObjectRuling:true, rawDamage} : {
        damage:damageEvent({components:[{type:"physical",amount:rawDamage}],resistances:member.resistances??[],weaknesses:member.weaknesses??[],immunities:member.immunities??[],isAttack:false})})}));
    impacts.push({targetId:target.id,remaining,rawDamage,results});
    for (const member of [...members.values(), target]) {
      const result = results.find(result=>result.id===member.id);
      if (member.kind === "object" && (member.broken === true || (member.hp != null && result.damage.total >= member.hp))) members.delete(member.id);
      else if (member.kind !== "barrier") {
        if (member.kind === "object" && member.hp != null) member.hp = Math.max(0, member.hp - result.damage.total);
        members.set(member.id,member);
      }
    }
    if (target.kind === "barrier") stopped = true;
    else if (target.kind === "creature") remaining = Math.max(0, remaining - Math.min(3,target.stability??0));
  }
  return {remaining,stopped,members:[...members.keys()],impacts,
    bounce:stopped ? {id:first.id,squares:1,direction:"opposite-impact",blockedMeansStay:true,additionalDamage:0}:null,
    placement:"Separate legal spaces; stop at last fitting group position; DA determines arrangement."};
}
