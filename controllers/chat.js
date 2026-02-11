import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export const chatbotStream = async (req, res) => {
  const startedAt = Date.now();
  let ping;

  try {
    const { message, mode } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // helps on nginx
    if (res.flushHeaders) res.flushHeaders();

    // Send immediate status so client shows activity
    res.write(
      `data: ${JSON.stringify({ type: "status", text: "Thinking..." })}\n\n`,
    );

    // Keep-alive pings
    ping = setInterval(() => res.write(`: ping\n\n`), 15000);

    const model =
      mode === "reasoning"
        ? "deepseek/deepseek-r1-0528:free"
        : "deepseek/deepseek-chat"; // faster for Q&A

    const stream = await openrouter.chat.send({
      chatGenerationParams: {
        model,
        messages: [{ role: "user", content: message }],
        stream: true,
        // Optional knobs (if supported by your model/provider):
        // max_tokens: 300,
        // temperature: 0.7,
      },
    });

    let firstTokenAt = null;

    for await (const chunk of stream) {
      const token = chunk?.choices?.[0]?.delta?.content;
      if (!token) continue;

      if (!firstTokenAt) {
        firstTokenAt = Date.now();
        console.log("TTFT(ms):", firstTokenAt - startedAt, "model:", model);
      }

      res.write(`data: ${JSON.stringify({ type: "token", text: token })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  } catch (err) {
    console.error(err);

    if (res.headersSent) {
      res.write(
        `data: ${JSON.stringify({ type: "error", text: err.message || "failed" })}\n\n`,
      );
      return res.end();
    }

    return res.status(err?.status || 500).json({
      error: err?.message || "OpenRouter request failed",
    });
  } finally {
    if (ping) clearInterval(ping);
  }
};
