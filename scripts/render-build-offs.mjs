import fs from 'node:fs';
const dir = new URL('../Build-Offs/', import.meta.url);
const hol = JSON.parse(fs.readFileSync(new URL('hol-builds.json',dir))).builds;
const dnd = JSON.parse(fs.readFileSync(new URL('dnd-builds.json',dir))).builds;
const notes = {
barbarian: {
 concept:'A storm-country bruiser who becomes frighteningly effective when anger takes over.',
 verdict:'Strong match for the raging frontline bruiser, with a different defensive bargain and recovery cadence.',
 favorites:'Driving Blow, Go Berserk, Running Vault, Catch Your Balance; keep basic attacks and Opportunity Attack available.',
 turn:'Enter Go Berserk with the Maneuver, then use Driving Blow as the Main Action. At III, Strong pushes 2 and also applies Dazed 1. On later turns the Maneuver can support a Running Vault after its movement requirement. Catch Your Balance competes with other Reactions rather than granting an additional response.',
 utility:'Long Reach helps with objects and non-attack touch tasks, not longer melee attack reach. Built for the Weather supports travel. This build can contribute physical solutions without purchasing a separate menu of attacks.',
 tradeoff:'Seven DP buys one deep attack and two complementary choices. The free Armor discipline remains future potential: this hero has not learned armor training. Go Berserk is once per scene, not D&D’s replenishing limited Rage pool. Its printed untyped DR is a review question; do not stack it with armor by assumption.',
 test:'Can the player explain the rage’s defense Bane and remember both Strong riders without a lookup? Compare a second encounter before rest, not just the first turn.'
},
bard:{
 concept:'A traveling performer who wins arguments, unsettles enemies and makes companions better.',
 verdict:'Strong social and magical-support match. Healing is a deliberate omission from this particular selection.',
 favorites:'Vicious Mockery, Heroism, universal Aid with Follow My Signal, Steady Voice, Make the Case; keep illusion and disguise spells in the book.',
 turn:'Use Vicious Mockery for offense or Aid to enable allies. Follow My Signal lets that Aid help two allies, with named tasks and an expiry. A sustained Heroism uses the Maneuver for upkeep; it competes with Steady Voice and other Maneuvers. The inspiration benefit is not a stored die that allies can spend much later.',
 utility:'Make the Case II and Plausible Story cover distinct honest and deceptive approaches. Disguise Self, illusions, Message and Comprehend Languages add practical social tools without making the DA’s social objective automatic.',
 tradeoff:'Twelve DP supports broad skills and ten spells. That is close to the original overload concern if all are displayed as favorite buttons. The character has no armor training and no restoration spells; taking those would displace some social or illusion capability.',
 test:'Ask the player to support two allies, then negotiate with a suspicious gatekeeper. Track whether the Aid expiry and sustain competition remain understandable.'
},
cleric:{
 concept:'A shrine-keeper who heals the wounded and stands between companions and supernatural danger.',
 verdict:'Strong healer and warder, but the selected kit does not reproduce the undead-turning/channel-divinity loop.',
 favorites:'Mend, Sacred Flame, Healing Word, Shield, Sanctuary; keep first aid and Stabilize among universal actions.',
 turn:'Choose between Sacred Flame offense and paid healing. Mend costs 1 SP and requires a free hand: with mace and shield held, free the weapon hand before using it. Shield is a spell Reaction and competes with other responses. Healing does not restore the dead or erase scars.',
 utility:'Restoration II adds condition treatment; Sanctuary and protective magic support rescue. Studying Medicine alone grants no learned treatment; ordinary first aid still needs suitable supplies. The priced catalog lacks a medical-supplies entry, so arrange those with the DA rather than invent free stock.',
 tradeoff:'Armor is expensive for Shepherd: adding it costs 3 DP and learning light armor costs 1 more. That investment buys physical resistance 1, not medium/heavy armor. One DP is banked. Mend and Cure Wounds use the same reserve, so their overlap should be weighed when choosing the signature.',
 test:'Run two rescues before overnight recovery. Does choosing Mend feel meaningfully different from a spellbook heal, and does the player remember the free hand?'
},
druid:{
 concept:'A wandering keeper of living places, using plants, weather and bodily adaptation to solve problems.',
 verdict:'Strong nature caster; incomplete match for a player whose first expectation is turning into an animal.',
 favorites:'Entangle, Ray of Frost, Cure Wounds, Gentle Hand, Come Back; keep the broader nature utility in spellbooks.',
 turn:'Use Entangle to change the ground or Ray of Frost for offense. Sustaining Entangle occupies the Maneuver. Come Back is a rescue Reaction when an ally enters Dying, not extra healing or an animal transformation.',
 utility:'Goodberry, Speak with Plants, water creation, earth work and Gentle Hand make nature matter outside combat. Alter Self offers its printed adaptations or disguise; it does not provide a beast form or a new creature stat block.',
 tradeoff:'Ten DP produces fourteen spells plus animal handling and a rescue signature. The capability is broad, but the decision load is substantial. A nature-specific signature may feel better than a general Shepherd rescue; that is a design choice, not permission to rewrite Come Back.',
 test:'Present a narrow animal-sized scouting route and a negotiation with a frightened beast. The first reveals the Wild Shape gap; the second tests the available nature identity.'
},
fighter:{
 concept:'A disciplined weapon-and-shield veteran who controls the line and protects nearby companions.',
 verdict:'Strong martial specialist with a small, readable kit. Its reaction-centered loop differs from an Action Surge burst.',
 favorites:'Measured Cut, Measured Guard, Interpose, Sheltering Guard, universal Shield Block.',
 turn:'Measured Cut II supplies the main attack. Sheltering Guard can use the Maneuver to protect an adjacent ally against ranged attacks. Decide whether to spend the single Reaction on Measured Guard, Interpose, Shield Block or Opportunity Attack; these are alternatives, not a stack.',
 utility:'Ordinary physical tasks, Ingenuity and basic teamwork remain available. This build spends most DP on battle competence rather than on a separate exploration specialty.',
 tradeoff:'The hero wears trained light armor, not a cosmetically renamed heavy suit. Buying deeper armor training would displace attack or protection investment; heavy armor is level-3 gated. No selected feature creates a D&D-style extra turn of attacks or a renewable Second Wind heal.',
 test:'Make both the fighter and an adjacent ally vulnerable in the same round. Can the player choose a Reaction quickly, and does each option have a reason to exist?'
},
monk:{
 concept:'A lightly equipped staff adept who crosses gaps, keeps balance and turns defense into a counterstroke.',
 verdict:'Partial. A mobile staff fighter is playable; a full unarmed, supernatural monk is not established by this build.',
 favorites:'Measured Cut, Running Vault, Catch Your Balance, Measured Guard; keep basic unarmed attacks available without calling them learned staff techniques.',
 turn:'Use the staff for Measured Cut II, moving to satisfy Running Vault II’s lead-in before the Maneuver jump. Measured Guard can counterattack after a Strong defense, but competes with Catch Your Balance for the Reaction. It is not Flurry of Blows.',
 utility:'The jump and balance options support obstacle crossing. Universal climbing and other feasible tasks remain possible; no purchased climbing Boon is implied.',
 tradeoff:'Brawn drives the learned staff attack while Agility supports mobility and defense. The high-Agility concept therefore has a real split-stat cost. No unarmored-defense progression, Focus pool, extra unarmed strikes or Stunning Strike is granted. The latter is also beyond D&D level 2.',
 test:'Ask for a weaponless fight, then a broken bridge crossing. If the second feels right and the first does not, the missing piece is an unarmed play loop rather than more movement names.'
},
paladin:{
 concept:'An oath-bound champion who protects another person, heals by touch and blesses a weapon.',
 verdict:'The protector fantasy is strong; the familiar radiant burst-smite identity is only partially represented.',
 favorites:'Measured Cut, Step Between, Cure Wounds, Magic Weapon, Blade Ward; retain universal Shield Block.',
 turn:'Use Magic Weapon for its printed temporary blessing, then sustain with a Maneuver while attacking. Step Between redirects an eligible single-target attack by swapping with an adjacent willing ally; Blade Ward and Shield Block compete for that Reaction. Healing or blessing with hand requirements may require freeing the weapon hand.',
 utility:'Healing and Light give the warrior something practical to do away from combat. The Oath-Bound identity is consequential fiction, but its broad invocation traits still need the audit’s trigger clarification.',
 tradeoff:'Force costs this Protector 3 DP, plus 1 for Imbuement I. That is half the starting budget for the blessing route. Magic Weapon remains physical damage and is not Divine Smite. This build buys light armor; the heavy-armored ideal is deliberately delayed by the level-3 gate.',
 test:'Offer a choice between preserving a sustained blessing and a useful Maneuver. Check whether the player wants that ongoing commitment or instead expects a one-hit expenditure of holy power.'
},
ranger:{
 concept:'A forest archer and trail-reader whose small nature tricks solve practical travel problems.',
 verdict:'Strong archer/explorer match, with a deliberately more stationary combat focus than a roaming marked-target hunter.',
 favorites:'Measured Shot, Watchful Shot, Steady Aim, Read the Trail, Wild Harvest; keep water and earth magic in the book.',
 turn:'Aim at a visible enemy with the Maneuver, then attack with Measured Shot II. Remaining still preserves Steady Aim; movement ends it. Watchful Shot supplies the ranged Reaction only at its printed movement trigger, using the ready bow and ammunition.',
 utility:'Track physical evidence, forage in suitable terrain, create water or work loose earth. Those tasks have different time intervals and environmental requirements; magical utility does not automatically complete a tracking objective.',
 tradeoff:'No animal companion or Hunter’s Mark is assumed. Steady Aim improves attacks against the chosen target and ignores partial cover, but has a movement cost. The bow and ammunition are actual purchased inventory, and there is no unbought armor training.',
 test:'Make the best firing position become unsafe. The decision to move and lose aim should feel like a useful tactical choice rather than punishment for behaving like a ranger.'
},
rogue:{
 concept:'A small infiltrator who gets companions through unnoticed and strikes when a foe is distracted.',
 verdict:'Strong skill and opportunistic-striker match without requiring a separate damage rider on every weapon attack.',
 favorites:'Blade in the Back, Quiet Passage, Patient Hand, Read the Snare, Running Vault; keep Light Fingers and universal Hide/Disengage available.',
 turn:'When unnoticed or when the target is adjacent to an ally, use Blade in the Back as the Main Action. Its 3/4/6 damage and Bleeding outcomes replace the attack result; do not add a Basic Melee attack on top. Use positioning and the universal action rules to create the next opportunity.',
 utility:'Quiet Passage III extends its stealth Boon to one adjacent companion; Patient Hand works on nonmagical locks with the purchased lock tools. Read the Snare identifies danger before disarming. A learned entry does not bypass impossible locks or absent evidence.',
 tradeoff:'The build leans on its free signature for offense and spends nine DP on infiltration. Marksmanship is studied for future growth but grants no selected ranged technique, and the hero carries no bow. No light armor benefit is assumed.',
 test:'Run a two-person infiltration and an encounter where no ally begins beside the enemy. Can the rogue create its opening without the DA granting an automatic surprise attack?'
},
sorcerer:{
 concept:'A charismatic elemental prodigy whose magic bends around the battlefield rather than following a scholar’s practiced line.',
 verdict:'The innate spell-shaper is recognizable, but the class still shares a Knowledge-based resource foundation with the Wizard.',
 favorites:'Fire Bolt, Burning Hands, Feather Fall, Heroism; Bent Trajectory applies to eligible spell attacks rather than becoming another button.',
 turn:'Choose a legal alternate origin for a spell attack through Bent Trajectory, still measuring range from the caster and knowing the target’s location. Use the actual spell action and cost. This does not grant extra targets, extra actions or a universal Metamagic menu.',
 utility:'Boil Liquid, air manipulation and water creation solve environmental problems. Feather Fall is a situational response. Still Water’s concentration wording does not create a new sustain roll or waive the Maneuver.',
 tradeoff:'The build spends three DP on Soul Capacity I–II and one on Recovery I. Knowledge is only +1 while Guile is +2, preserving charisma at a cost to Knowledge-based spells and the Arcanist contribution. Learned spells use their own printed attributes; Guile does not replace them globally.',
 test:'Compare a direct fire attack with a creative alternate-origin attack. Does the signature provide enough expressive freedom to distinguish this hero from a Wizard with the same books?'
},
warlock:{
 concept:'A bearer of an unsettling bargain, accompanied by spirits and backed by a reliable supernatural attack.',
 verdict:'Occult flavor and utility are strong. The familiar Eldritch Blast improvement loop and renewable Pact Magic cadence are not reproduced.',
 favorites:'Arcane Bolt, Command, Borrowed Tongue, the chosen familiar spell; keep the rest of the occult utility in its books.',
 turn:'Arcane Bolt is the at-will attack, but it rolls Knowledge +0 here. Command and other occult workings use their printed attributes, including Reason −1 where specified. The large Guile-based SP reserve does not improve those rolls. Borrowed Tongue uses a Maneuver in combat and grants spoken comprehension, not reading.',
 utility:'Borrowed spoken languages, illusions, hand manipulation and familiar magic make the pact useful away from combat. Follow the familiar spell’s actual limits; no independent extra combat turn or free advanced companion is assumed.',
 tradeoff:'Odd charges 2 DP for every new discipline; Force costs two of the nine available DP. Recovery I restores only 1 SP once between safe overnight rests. Oath-Bound traits supply the bargain fiction but do not create unprinted spell invocations.',
 test:'Run a second encounter without overnight recovery and ask the player to negotiate in an unfamiliar language. Does the occult utility compensate for weaker attack attributes and a different resource rhythm?'
},
wizard:{
 concept:'A learned problem-solver who combines a reliable force attack with useful magical tools and an understanding of strange effects.',
 verdict:'Strong scholarly utility-mage match. The biggest difference is how the spell repertoire is acquired and maintained.',
 favorites:'Arcane Bolt, Magic Missile, Grease, Study the Pattern; keep rituals and object utility accessible in their books.',
 turn:'Use the chosen spell’s Main Action and SP cost, with Study the Pattern available as a Maneuver when its ongoing-effect target exists. If sustaining a spell, that Maneuver is already committed. Arcane Bolt supplies an unlimited fallback rather than consuming the reserve.',
 utility:'Mending, Unseen Servant, Mage Hand, Detect Magic and the lore technique give multiple concrete solutions. Study the Pattern gives information about an ongoing effect; it is not permission to learn every spell, identify every hidden object, or cast an unlearned solution.',
 tradeoff:'Knowledge +2 improves core spell rolls, DP and Arcanist SP. Eleven DP buys twelve spells, a lore technique and capacity/recovery. Fixed pairs sometimes give unwanted spells, but there is no additional daily preparation limit; the D&D spellbook and copying economy are not assumed.',
 test:'Present an unfamiliar magical obstacle after several paid casts. Test whether the player can select a useful known tool without scrolling through every spell or requesting an unlearned spell by analogy.'
},
artificer:{
 concept:'A curious workshop inventor who repairs equipment, makes useful supplies and lends magic to ordinary objects.',
 verdict:'Strong magical craftsperson, partial match for the persistent item-engine identity of an Artificer.',
 favorites:'Arcane Bolt, Spot the Leverage, Magic Weapon, Mend and Fit; keep recipes and object utility in their stores.',
 turn:'Spot the Leverage is a Maneuver that supplies information and a short-lived Boon for actions against its target. Pair it with a learned spell attack when appropriate. Sustaining Magic Weapon instead uses that Maneuver, so the two benefits are not free simultaneous upkeep.',
 utility:'The hero has Craft Tools, a Material Bundle, four actual recipe choices and repair training. Mending and mundane repair solve different kinds of damage. Ordinary recipes still require their materials, work intervals and output caps.',
 tradeoff:'Force costs 2 DP before any spellbook learning. Eight spells plus crafting create broad utility, but Magic Weapon is temporary and sustained. No permanent enchanted item, construct companion or arbitrary gadget is granted merely by the Craft/Force combination.',
 test:'Ask the player to prepare a useful item for an ally and then leave it working while doing something else. That distinguishes a genuine persistent-item subsystem from a spell with workshop flavor.'
}
};
const title=s=>s.replaceAll(/([a-z])([A-Z])/g,'$1 $2').replaceAll(/(^|[-_ ])([a-z])/g,(_,a,b)=>(a?' ':'')+b.toUpperCase());
const cell=v=>{
 if(v==null)return '—';
 if(Array.isArray(v))return v.length ? v.map(cell).join('; ') : '—';
 if(typeof v==='object')return Object.entries(v).map(([k,val])=>`${title(k)}: ${cell(val)}`).join('; ');
 return String(v).replaceAll('|','\\|').replaceAll('\n','<br>');
};
const signed=n=>n>=0?`+${n}`:String(n);
const bodyText=r=>(r?.rules?.body??[]).map(b=>b.text??'').filter(text=>text && !/^\*\*(Ancestry|Choice|Action|Duration|ID):|^\[Ancestry choices\]/.test(text)).join(' ');
for(const h of hol){
 const d=dnd.find(x=>x.id===h.id);if(!d)throw Error(`Missing D&D ${h.id}`);const n=notes[h.id];
 const rows=[
 ['Identity',`${d.species}; ${d.class??title(h.id)}, level 2`,`${h.ancestry.name}; ${h.class.name}, level 1`],
 ['Background',d.background,`${h.culture.name} → ${title(h.culture.discipline)}; ${h.background.name} → ${title(h.background.discipline)}; class → ${title(h.classDiscipline)}`],
 ['Attributes',Object.entries(d.abilityScores.final).map(([k,v])=>`${k.toUpperCase()} ${v} (${signed(Math.floor((v-10)/2))})`).join(', '), Object.entries(h.attributes).map(([k,v])=>`${title(k)} ${signed(v)}`).join(', ')],
 ['HP / defense',`${d.hp} HP; AC ${cell(d.ac)}`,`${h.limits.maxHp} HP; ${h.equipment.some(e=>e.worn&&e.id==='item-ordinary-light-armor')?'trained light armor: physical resistance 1':'no worn armor resistance'}; player-rolled defense`],
 ['Movement',`${d.speed} feet`,`${h.speed} squares; carried Bulk ${h.inventory.bulk}/${h.inventory.capacity}`],
 ['Creation benefits',[...d.originFeats,...(d.speciesFeatures??[])],h.ancestry.traits.map(t=>`${t.name}: ${bodyText(t.reference)}`)],
 ['Class choices',d.classChoices,`${h.class.signature.name} (free signature); exact effect below`],
 ['Skills and training',Object.entries(d.skills).map(([k,v])=>`${k} ${signed(v)}`).join(', '),h.learnedAbilities.map(a=>a.name)],
 ['Limited resources',d.resources,`${h.limits.maxSp} maximum SP; 1 lifetime Grit; ${h.development.current} DP saved`],
 ['Main attacks',d.attacks,'Use the actual learned technique or spell shown below; Weak / Standard / Strong outcomes are not hit/miss rolls.'],
 ['Spell selection',d.spells.cantrips.length || d.spells.prepared.length ? d.spells : 'No spellcasting in this build.', h.spells.length?`${h.spells.length} learned spells; ${h.spells.filter(s=>s.sp===0).length} cost 0 SP. All listed below.`:'No learned spells in this build.'],
 ['Equipment',d.equipment,h.equipment.map(e=>`${e.quantity} × ${e.description??e.name}${e.worn?' (worn)':e.held?' (held)':''}`)],
 ['Tools / languages / saves', {tools:d.tools,languages:d.languages,saves:d.saves},`Languages: ${h.creationSummary.languages.map(l=>l.name).join(', ')}. Rolls use the named HoL attribute and explicit Boons/Banes.`],
 ];
 let text=`# ${title(h.id)} — ${h.name}\n\n${n.concept}\n\n**D&D level 2 ↔ HoL level 1. ${n.verdict}**\n\n[Comparison method](README.md) · [Import this HoL character](builds/${h.id}.hol.json) · [All findings](findings.md)\n\n## Side-by-side build\n\n| Choice | D&D | Heroes of Legend |\n|---|---|---|\n${rows.map(row=>'| '+row.map(cell).join(' | ')+' |').join('\n')}\n\n`;
 text+=`## D&D play loop and limits\n\n${cell(d.playLoop).replaceAll('<br>','\n')}\n\n${d.limits.map(l=>'- '+l).join('\n')}\n\n**Construction check:** standard array ${cell(d.abilityScores.before)}; background increases ${cell(d.abilityScores.boosts)}. HP calculation: ${d.hpCalculation}. Proficiency bonus +${d.proficiencyBonus}; initiative ${signed(d.initiative)}.\n\n`;
 text+=`## HoL investment\n\nStarting DP: **8 + Guile (${signed(h.attributes.guile)}) + Knowledge (${signed(h.attributes.knowledge)}) + Reason (${signed(h.attributes.reason)}) = ${h.development.total}**. Spent **${h.development.spent}**, saved **${h.development.current}**. Starting coins **${h.inventory.startingCoins}**, spent **${h.inventory.spent}**, remaining **${h.inventory.remainingCoins}**; no coin override. The three starting disciplines above are grants. Additional disciplines below use the class’s actual entry price.\n\n| Learn in this order | DP | What it adds |\n|---|---:|---|\n`;
 text+=h.purchases.map(p=>`| ${p.name} | ${p.paidDp} | ${cell(p.effect??'Learn '+p.spellIds.map(id=>h.spells.find(s=>s.id===id)?.name??id).join(', '))} |`).join('\n');
 text+=`\n\nImprovements modify the same named ability. They do not create additional attacks or actions. Printed catalog level 0 means no milestone gate on these entries; this character is created once at level 1. Branch endpoints require level 3 and combined abilities level 7.\n\n### Signature: ${h.class.signature.name}\n\n${h.class.signature.effect}\n\n**Use limit:** ${h.class.signature.limits??'Use the printed timing and requirements.'}\n\n`;
 if(h.spells.length){text+='### Learned spells\n\nThese are HoL effects, not the D&D spells’ full rules despite familiar names. Costs shown are paid when cast; ongoing sustain uses a Maneuver and 0 SP.\n\n| Spell | SP | Timing / roll | Target / duration | Effect |\n|---|---:|---|---|---|\n';text+=h.spells.map(s=>`| ${cell(s.name)} | ${s.sp} | ${cell(s.actionText??s.action)}; ${cell(s.attribute)} | ${cell(s.target)}; ${cell(s.duration)} | ${cell(s.effect)} |`).join('\n')+'\n\n';}
 text+=`## At the table\n\n**Suggested favorites:** ${n.favorites}\n\n**Combat:** ${n.turn}\n\n**Away from combat:** ${n.utility}${h.id==='artificer'?' Selected recipes: Bound Torches, Twisted Cord, Travel Food and Wooden Brace.':''}\n\n**Tradeoffs:** ${n.tradeoff}\n\n**Test this:** ${n.test}\n\n### Gaps kept visible\n\n${h.gaps.map(g=>'- '+g).join('\n')}\n\n## Sources and verification\n\nD&D: ${d.sources.map(s=>`[${s.title}](${s.url})`).join(', ')}. Edition and any source limitation are recorded in [the D&D build data](dnd-builds.json). The chosen character’s stats and equipment arithmetic are construction choices, not claims of official sample-character status.\n\nHoL: [current catalog](../static/data/forge.json), [browser rule overlay](../src/rules/forge-playtest-catalog.mjs), [class-price decisions](../docs/workshop-learning-295.md), [derived build record](hol-builds.json). The portable character passes the current Workshop validator and ready export/import; see [reproduction instructions](README.md). Review caveats remain in the [trait](ancestry-trait-review.md) and [signature](class-signature-review.md) audits. No unresolved ruling has been silently converted into a new benefit.\n`;
 fs.writeFileSync(new URL(`${h.id}.md`,dir),text);
}
let readme=fs.readFileSync(new URL('README.md',dir),'utf8');
readme=readme.replace(/<!-- BUILD-INDEX -->[\s\S]*?(?=\n## Baselines)/, '<!-- BUILD-INDEX -->\n\n'+hol.map(h=>`- [${title(h.id)} — ${h.name}](${h.id}.md)`).join('\n')+'\n');
fs.writeFileSync(new URL('README.md',dir),readme);
console.log('Rendered thirteen side-by-side Build-Off documents.');
