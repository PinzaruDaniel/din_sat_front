export function createAssistantActions(api) {
  return {
    chat: (message, previous, signal) =>
      api.chat({ message: message.trim(), previous }, signal),
    confirm: api.confirm,
  };
}
