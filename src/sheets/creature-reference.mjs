import { renderMarkdown } from "../rules/authored-markdown.mjs";

export function creatureModifierLabel(modifier) {
  return (
    [
      [modifier.boons, "Boon"],
      [modifier.banes, "Bane"],
    ]
      .filter(([value]) => value > 0)
      .map(([value, label]) => `${value} ${label}${value === 1 ? "" : "s"}`)
      .join(" and ") || "None"
  );
}

export function creatureReferenceHtml(system) {
  const actions = system?.actions ?? {};
  const details = system?.details ?? {};
  const actionGroups = [
    ["Main Actions", actions.mainMarkdown],
    ["Maneuvers", actions.maneuverMarkdown],
    ["Reactions", actions.reactionMarkdown],
  ];
  const hasActions =
    actions.introductionMarkdown ||
    actionGroups.some(([, markdown]) => markdown);
  const detailBlocks = [
    details.specialtyMarkdown,
    details.generalMarkdown,
    details.designNotesMarkdown,
  ];
  const hasDetails = detailBlocks.some(Boolean);

  return [
    renderMarkdown(details.flavorMarkdown),
    hasActions ? "<h2>Actions</h2>" : "",
    renderMarkdown(actions.introductionMarkdown),
    ...actionGroups.flatMap(([heading, markdown]) =>
      markdown
        ? [`<h3>${heading}</h3>`, renderMarkdown(markdown)]
        : [],
    ),
    hasDetails ? "<h2>Details</h2>" : "",
    ...detailBlocks.map(renderMarkdown),
  ].join("");
}
