import { OpenRouter } from "@openrouter/sdk";
import { retrieveContext } from "../rag/retrive.js";

const openrouter = new OpenRouter({
  apiKey: process.env.DEEPSEEK_API_KEY,
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

    const retrievedChunks = await retrieveContext(message, 5);

    console.log("Retrieved chunks:", JSON.stringify(retrievedChunks, null, 2));

    // Optional score filter - tune this based on your results
    const filteredChunks = retrievedChunks.filter((chunk) =>
      typeof chunk.score === "number" ? chunk.score >= 0.45 : true,
    );

    const contextText = filteredChunks.length
      ? filteredChunks
          .map(
            (chunk, i) =>
              `[Source ${i + 1} | ${chunk.source || "unknown"} | chunk ${chunk.chunkIndex} | score ${chunk.score ?? "n/a"}]\n${chunk.text}`,
          )
          .join("\n\n---\n\n")
      : "";

    const model =
      mode === "reasoning"
        ? "deepseek/deepseek-r1-0528:free"
        : "deepseek/deepseek-chat";

    const systemPrompt = `
You are an assistant for EduBridge.

Rules:
- Answer only from the provided context.
- If the answer is not explicitly stated in the context, reply exactly:
I could not find that in the provided document.
- Do not use outside knowledge.
- Do not invent fields, JSON examples, timestamps, schemas, or explanations.
- Keep answers short and directly quote the document meaning when possible.
`;

    const userPrompt = contextText
      ? `Context:
${contextText}

Question:
${message}`
      : `No relevant context was retrieved.

Question:
${message}`;

    res.write(
      `data: ${JSON.stringify({ type: "status", text: "Generating answer..." })}\n\n`,
    );

    const stream = await openrouter.chat.send({
      chatGenerationParams: {
        model,
        stream: true,
        temperature: 0,
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
        data: filteredChunks.map((c) => ({
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
