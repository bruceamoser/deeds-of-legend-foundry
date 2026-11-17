/** Managed gameplay requests explicitly share one designated GM socket and queue. */
const ID = "heroes-of-legend";
let queue = Promise.resolve(), activeWork = null;
const setting = key => game.settings.get(ID, key);

export function registerAuthority() {
  game.settings.register(ID, "actionRelay", {scope:"world",config:false,type:Object,default:{}});
  Hooks.once("ready", bindActionRelay);
  Hooks.on("userConnected", () => bindActionRelay());
  game.socket?.on?.("connect", () => bindActionRelay());
}
export async function bindActionRelay() {
  if (!game.user.isGM || !game.users.activeGM?.isSelf) return;
  await game.settings.set(ID, "actionRelay", { userId: game.user.id, clientId: game.socket.id });
}
export async function ensureAuthorityReady({ shared = false, coordinated = false } = {}) {
  if (!shared || (game.user.isGM && !coordinated)) return;
  if (!game.users.activeGM) throw new Error("A GM must be connected to update the shared encounter or another character.");
  const relay = setting("actionRelay");
  if (relay?.userId !== game.users.activeGM.id || !relay.clientId)
    throw new Error("The GM is still connecting. Retry this shared action in a moment.");
}
/** Explicitly mark where a request executes; other clients never process owner actions. */
export async function createActionMessage(data, { shared = false, coordinated = false } = {}) {
  await ensureAuthorityReady({ shared, coordinated });
  const relayed = shared && (!game.user.isGM || coordinated);
  const executor = relayed ? setting("actionRelay") : {userId:game.user.id,clientId:game.socket.id};
  const flags = { ...data.flags, [ID]: { ...data.flags?.[ID],
    actionExecution: { userId: game.user.id, clientId: game.socket.id, shared: relayed,
      executorUserId: executor.userId, executorClientId: executor.clientId },
  } };
  return ChatMessage.create({ ...data, flags });
}
export function shouldProcessRequest(message) {
  const execution = message?.getFlag(ID, "actionExecution");
  if (!execution || execution.userId !== message.author?.id) return false;
  if (!execution.shared) return execution.userId === game.user.id && execution.clientId === game.socket.id;
  // A new GM tab may become the relay for future requests, but it must never
  // also execute an action already dispatched to a different client.
  return Boolean(game.user.isGM && execution.executorUserId === game.user.id &&
    execution.executorClientId === game.socket.id);
}
export function isCreationAuthority() {
  return Boolean(activeWork || (game.user.isGM && game.users.activeGM?.isSelf));
}
export const writeCharacterActor = (...args) => writeAuthorityDocument(...args);
export async function writeAuthorityDocument(document, changes, options = {}) {
  if (!activeWork) throw new Error("No action is being applied.");
  const unresolved=Object.values(document.getFlag?.(ID,'nativeWorkshopOperations')??{}).find(saved=>saved.kind==='gameplay'&&saved.status==='applying');
  const action=activeWork.requestId?game.messages.get(activeWork.requestId)?.getFlag(ID,'nativeWorkshopRequest'):null;
  if(unresolved&&unresolved.id!==activeWork.requestId&&!(action?.kind==='gameplay'&&action.payload?.operationId===unresolved.operationId))
    throw new Error('A managed gameplay action needs reconciliation before another resource change.');
  if (!game.user.isGM && !document.testUserPermission(game.user, "OWNER"))
    throw new Error("You do not have permission to change this document.");
  return document.update(changes, options);
}
export function enqueueCharacterOperation(operation, { requestId = null, targetUuid = null } = {}) {
  const job = queue.then(async () => {
    const message = requestId ? game.messages.get(requestId) : null;
    // Old saved requests require a deliberate GM retry; they are not replayed on login.
    if (message?.getFlag(ID, "actionExecution")) {
      if (!shouldProcessRequest(message)) return { status: "not-authority" };
    } else if (!game.user.isGM) return { status: "not-authority" };
    activeWork = { requestId, targetUuid };
    try { return await operation(); }
    finally { activeWork = null; }
  });
  queue = job.catch(() => {});
  return job;
}
export async function releaseAuthority() { return { status: "released" }; }
