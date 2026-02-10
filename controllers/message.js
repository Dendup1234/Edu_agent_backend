import { loadMessagesCursor } from "../utils/cursor.js";

export const getConversationMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const {
      cursorCreatedAt = null,
      cursorId = null,
      limit = 5
    } = req.query;

    const result = await loadMessagesCursor(conversationId, {
      cursorCreatedAt,
      cursorId,
      limit
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

