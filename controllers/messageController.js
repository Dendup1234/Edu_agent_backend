import Message from "../models/message.js";

/**
 * @param {string} conversationId
 * @param {Object} options
 * @param {string|null} options.cursorCreatedAt ISO string
 * @param {string|null} options.cursorId Mongo ObjectId string
 * @param {number} options.limit
 */
export const loadMessagesCursor = async (
  conversationId,
  {
    cursorCreatedAt = null,
    cursorId = null,
    limit = 50
  } = {}
) => {
  limit = Number(limit);
  if (limit < 1) throw new Error("Invalid limit");

  const query = { conversationId };

  // Cursor condition (fetch older messages)
  if (cursorCreatedAt && cursorId) {
    query.$or = [
      { createdAt: { $lt: new Date(cursorCreatedAt) } },
      {
        createdAt: new Date(cursorCreatedAt),
        _id: { $lt: cursorId }
      }
    ];
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1, _id: -1 }) 
    .limit(limit + 1) 
    .populate("sender", "name email")
    .populate("receiver", "name email")
    .lean();

  const hasNextPage = messages.length > limit;
  if (hasNextPage) messages.pop();

  const lastMessage = messages[messages.length - 1];

  return {
    messages: messages.reverse(), // oldest → newest for UI
    nextCursor: hasNextPage
      ? {
          cursorCreatedAt: lastMessage.createdAt,
          cursorId: lastMessage._id
        }
      : null,
    hasNextPage
  };
};