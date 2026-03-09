import { embedText } from "./embed.js";
import { index } from "./vector.js";

export const retrieveContext = async (query, topK = 5) => {
  const queryEmbedding = await embedText(query);

  const result = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });

  return (result.matches || []).map((m) => ({
    score: m.score,
    text: m.metadata?.text || "",
    source: m.metadata?.source || "unknown",
    chunkIndex: m.metadata?.chunkIndex ?? -1,
  }));
};
