// conversationUtils — PREPARATION ONLY. Not wired into ChatPanel or any storage yet.
//
// The working chat UI (src/features/chat/ChatPanel.jsx) keeps its own local `messages`
// state exactly as before — unchanged and unaffected by this file. This module exists so
// that when conversation persistence is added later (a `conversationService.js`, most
// likely backed by `services/db.js` the same way notifications/documents are), the shape
// is already defined and consistent with the rest of the app's typed data.
//
// Expected future usage (not implemented):
//   const conversation = createConversation(userId);
//   // ...append messages as the user chats...
//   const snapshot = touchConversation(conversation, messages);
//   // await conversationService.saveConversation(snapshot);

/**
 * @returns {string}
 */
import { createId } from "../../utils/id.js";

export function generateConversationId() {
  return `conv_${createId()}`;
}

/**
 * Creates a new, empty conversation shell.
 * @param {string} userId
 * @returns {import("../../types/index.js").Conversation}
 */
export function createConversation(userId) {
  const now = new Date().toISOString();
  return {
    conversationId: generateConversationId(),
    userId,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Returns a new conversation object with `messages` and `updatedAt` refreshed.
 * Pure function — does not mutate the input or persist anything.
 * @param {import("../../types/index.js").Conversation} conversation
 * @param {import("../../types/index.js").ChatMessage[]} messages
 * @returns {import("../../types/index.js").Conversation}
 */
export function touchConversation(conversation, messages) {
  return { ...conversation, messages, updatedAt: new Date().toISOString() };
}
