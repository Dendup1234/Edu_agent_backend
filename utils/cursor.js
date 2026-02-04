import Message from "../models/message.js";
import Notification from "../models/notification.js";
import mongoose from "mongoose";

// for the message cursor
export const loadMessagesCursor = async (
  conversationId,
  { cursorCreatedAt = null, cursorId = null, limit = 50 } = {},
) => {
  limit = Number(limit);
  if (limit < 1) throw new Error("Invalid limit");

  const query = { conversationId };

  if (cursorCreatedAt && cursorId) {
    query.$or = [
      { createdAt: { $lt: new Date(cursorCreatedAt) } },
      {
        createdAt: new Date(cursorCreatedAt),
        _id: { $lt: cursorId },
      },
    ];
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasNextPage = messages.length > limit;
  if (hasNextPage) messages.pop();

  const lastMessage = messages[messages.length - 1];

  return {
    messages: messages.reverse(),
    nextCursor: hasNextPage
      ? {
          cursorCreatedAt: lastMessage.createdAt,
          cursorId: lastMessage._id,
        }
      : null,
    hasNextPage,
  };
};

// for the notifcation cursor
export const loadNotificationsCursor = async (
  receiverId,
  receiverType,
  { cursorCreatedAt = null, cursorId = null, limit = 50 } = {},
) => {
  limit = Number(limit);
  if (!Number.isFinite(limit) || limit < 1 || limit > 200) {
    throw new Error("Invalid limit");
  }

  if (!mongoose.Types.ObjectId.isValid(receiverId)) {
    throw new Error("Invalid receiverId");
  }

  const query = {
    receiverId,
    receiverType,
  };

  // Cursor: load older than cursor
  if (cursorCreatedAt && cursorId) {
    query.$or = [
      { createdAt: { $lt: new Date(cursorCreatedAt) } },
      {
        createdAt: new Date(cursorCreatedAt),
        _id: { $lt: cursorId },
      },
    ];
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1) // fetch 1 extra to detect next page
    .lean();

  const hasNextPage = notifications.length > limit;
  if (hasNextPage) notifications.pop();

  const last = notifications[notifications.length - 1];

  return {
    notifications: notifications.reverse(), // oldest -> newest for UI
    nextCursor: hasNextPage
      ? { cursorCreatedAt: last.createdAt, cursorId: last._id }
      : null,
    hasNextPage,
  };
};
