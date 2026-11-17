const ID='heroes-of-legend';
export function isCurrentCharacter(actor) {
 const portable=actor?.getFlag?.(ID,'nativeWorkshop')?.portable;
 return actor?.type==='character'&&portable?.format==='heroes-of-legend-character'&&portable.schemaVersion===7&&Boolean(portable.draft)&&typeof portable.draft==='object'&&!Array.isArray(portable.draft);
}
/** Raw older Actors remain available for export/recreation, never old gameplay. */
export function assertCurrentGameplayActor(actor) {
 if(actor?.type==='character'&&!isCurrentCharacter(actor))throw new Error('This character is invalid for current play. Import a current Workshop character or recreate it; its stored data has been preserved.');
 return actor;
}