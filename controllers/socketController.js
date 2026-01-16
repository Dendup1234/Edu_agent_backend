import Message from "../models/message.js";
import Conversation from "../models/conversation.js";

export const loadALLMessage = async(req, res) => {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId: id })
        .sort({ createdAt: 1 }); 
     res.json(messages);
}