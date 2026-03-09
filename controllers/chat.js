import { OpenRouter } from "@openrouter/sdk";
import { retrieveContext } from "./retrieve.js";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const chatbotStream = async (req, res) => {
  const startedAt = Date.now();
  let ping;

  try {
    const { message, mode } = req.body;
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (res.flushHeaders) res.flushHeaders();

    res.write(
      `data: ${JSON.stringify({ type: "status", text: "Searching knowledge base..." })}\n\n`,
    );

    ping = setInterval(() => res.write(`: ping\n\n`), 15000);

    const retrievedChunks = await retrieveContext(message, 3);

    const contextText = retrievedChunks.length
      ? retrievedChunks
          .map(
            (chunk, i) =>
              `[Source ${i + 1} | ${chunk.source} | chunk ${chunk.chunkIndex}]\n${chunk.text}`,
          )
          .join("\n\n---\n\n")
      : "No relevant context found.";

    const model =
      mode === "reasoning"
        ? "deepseek/deepseek-r1-0528:free"
        : "deepseek/deepseek-chat";

    const systemPrompt = `
You are a helpful assistant for EduAgent.
Answer the user using the retrieved context when relevant.
If the answer is not in the context, say you are not fully sure and answer cautiously.
Do not invent facts.
`;

    const userPrompt = `
Retrieved context:
${contextText}

User question:
${message}
`;

    res.write(
      `data: ${JSON.stringify({ type: "status", text: "Generating answer..." })}\n\n`,
    );

    const stream = await openrouter.chat.send({
      chatGenerationParams: {
        model,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
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

    res.write(
      `data: ${JSON.stringify({
        type: "sources",
        data: retrievedChunks.map((c) => ({
          source: c.source,
          chunkIndex: c.chunkIndex,
          score: c.score,
        })),
      })}\n\n`,
    );

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
