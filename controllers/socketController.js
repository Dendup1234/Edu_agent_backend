import Message from "../models/message.js";

export const loadALLMessage = async (
  conversationId, 
  page = 1, 
  limit = 50
) => {
  try {
    const skip = (page - 1) * limit;
    
    const messages = await Message.find({ conversationId: conversationId })
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .sort({ createdAt: 1 });
    
    const totalMessages = await Message.countDocuments({ 
      conversationId: conversationId 
    });
    
    return {
      messages,
      currentPage: page,
      totalPages: Math.ceil(totalMessages / limit),
      totalMessages,
      hasNextPage: page * limit < totalMessages,
      hasPreviousPage: page > 1
    };
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};