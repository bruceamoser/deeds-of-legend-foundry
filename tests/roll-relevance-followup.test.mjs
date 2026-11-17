import test from 'node:test';
import assert from 'node:assert/strict';
import {rollReferenceApplies,reactionTrigger} from '../src/rules/ability-roll-relevance.mjs';
import {abilityRollConfiguration} from '../src/rules/ability-roll.mjs';
import {referencePickerOptions} from '../src/services/reference-play.mjs';
import {defaultWoundApplicability,describeWoundEffect} from '../src/rules/wound-contributions.mjs';
import {prepareRoll} from '../src/services/roll-preparation.mjs';
import {readFile} from 'node:fs/promises';
const item=(id,text,rollMode='none')=>({id,name:id,system:{activity:{rollMode},description:`<div class="hol-reference-rules"><p>${text}</p></div>`}});

test('roll picker includes initiating action and matching printed modifiers, omits unrelated actions and boilerplate',()=>{
 const own=item('own','3 physical damage.','attribute'),other=item('other','Gain 1 Boon to this attack.','attribute');
 const defense=item('defend','Gain 1 Boon to defense rolls.'),guile=item('party','Gain 1 Boon to Guile rolls made to entertain.');
 const unrelated=item('move','Move 2 squares.'),boilerplate=item('burst','Make one attack roll using the least favorable net Boons/Banes.');
 const options={mode:'attribute',attributeKey:'guile',initiatingItemId:'own'};
 assert(rollReferenceApplies(own,options));assert(rollReferenceApplies(guile,options));
 for(const i of [other,defense,unrelated,boilerplate])assert.equal(rollReferenceApplies(i,options),false,i.id);
 assert(rollReferenceApplies(defense,{mode:'defense',attributeKey:'agility'}));
 assert.equal(rollReferenceApplies(guile,{mode:'attribute',attributeKey:'brawn'}),false);
});

test('visible reference picker applies relevance while preserving initiating ability identity',()=>{
 const actor={uuid:'Actor.hero',testUserPermission:()=>true};actor.items=[item('main','Hit.','attribute'),item('bonus','Gain 1 Boon to Reason rolls.'),item('utility','Move 2 squares.')];actor.items.get=id=>actor.items.find(i=>i.id===id);
 for(const i of actor.items){Object.assign(i,{documentName:'Item',type:'ability',actor});}
 globalThis.game={user:{},scenes:{viewed:{tokens:[]}}};
 const rows=referencePickerOptions(actor,{abilityItemId:'main',referenceItemIds:['main']},{mode:'attribute',attributeKey:'reason',initiatingItemId:'main'});
 assert.deepEqual(rows.map(row=>row.id),['bonus','main']);assert(rows.find(row=>row.id==='main').selected);
});

test('reaction cards preserve authored trigger before effect and expose it in rolled snapshots',()=>{
 const record={reference:{rules:{details:[{label:'Action',value:'Reaction'},{label:'Attribute',value:'Agility'},{label:'Trigger',value:'An enemy leaves your reach.'}],body:[{text:'Strike once.'}]}}};
 assert.equal(reactionTrigger(record),'An enemy leaves your reach.');
 assert.equal(abilityRollConfiguration(item('reaction','Strike.'),record).trigger,'An enemy leaves your reach.');
 record.reference.rules.details.pop();record.reference.rules.details.push({label:'Target / range / shape',value:'Self, before a physical defense.'});assert.equal(reactionTrigger(record),'Self, before a physical defense.');
 record.reference.rules.details[0].value='Maneuver';assert.equal(reactionTrigger(record),'');
});

test('current roll dialog has closed ability disclosures and no retired wound controls',async()=>{
 const template=await readFile(new URL('../static/templates/attribute-roll.hbs',import.meta.url),'utf8');
 assert.doesNotMatch(template,/<details open class="hol-roll-abilities/);
 assert.doesNotMatch(template,/wound|deathMark/i);
});
