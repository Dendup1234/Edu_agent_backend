import { OpenRouter } from "@openrouter/sdk";
import { retrieveContext } from "../rag/retrieve.js";

const openrouter = new OpenRouter({
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export const chatbotStream = async (req, res) => {
  let ping;

  try {
    const { message, mode } = req.body;

    if (!message) return res.status(400).json({ error: "Message is required" });

    // RAG STEP — Retrieve context from Pinecone
    const context = await retrieveContext(message);

    const systemPrompt = `
You are EduAgent AI. 
Use ONLY the context below when relevant. 
If context is missing, answer normally.
    
CONTEXT:
${context}
    `;

    // Setup headers for SSE streaming
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    if (res.flushHeaders) res.flushHeaders();

    res.write(
      `data: ${JSON.stringify({ type: "status", text: "Thinking..." })}\n\n`,
    );

    ping = setInterval(() => res.write(`: ping\n\n`), 15000);

    // Select DeepSeek model
    const model =
      mode === "reasoning"
        ? "deepseek/deepseek-r1-0528:free"
        : "deepseek/deepseek-chat";

    const stream = await openrouter.chat.send({
      chatGenerationParams: {
        model,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      },
    });

    for await (const chunk of stream) {
      const token = chunk?.choices?.[0]?.delta?.content;
      if (!token) continue;
      res.write(`data: ${JSON.stringify({ type: "token", text: token })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Chat error:", err);

    if (!res.headersSent) {
      return res.status(500).json({ error: "Chatbot failed" });
    }

    res.write(
      `data: ${JSON.stringify({ type: "error", text: err.message })}\n\n`,
    );
    res.end();
  } finally {
    if (ping) clearInterval(ping);
  }
};
