import { OpenRouter } from "@openrouter/sdk";

//openrouter api
const openrouter = new OpenRouter({
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export const chatbotStream = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    // Set SSE headers for streaming
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    // (Optional but helps) flush headers immediately
    if (res.flushHeaders) res.flushHeaders();

    const stream = await openrouter.chat.send({
      chatGenerationParams: {
        model: "deepseek/deepseek-r1-0528:free",
        messages: [{ role: "user", content: message }],
        stream: true,
      },
    });

    for await (const chunk of stream) {
      const token = chunk?.choices?.[0]?.delta?.content;
      if (token) {
        // SSE format: "data: <text>\n\n"
        res.write(`data: ${JSON.stringify(token)}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error(err);

    // If headers already sent, stream an error event
    if (res.headersSent) {
      res.write(
        `data: ${JSON.stringify("[ERROR] " + (err.message || "failed"))}\n\n`,
      );
      return res.end();
    }

    return res.status(err?.status || 500).json({
      error: err?.message || "OpenRouter request failed",
    });
  }
};
