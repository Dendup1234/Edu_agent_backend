import { embedText } from "./embed.js";
import { index } from "./pinecone.js";

export const retrieveContext = async (query, topK = 3) => {
  const queryEmbedding = await embedText(query);

  const result = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });

  return result.matches.map((match) => ({
    id: match.id,
    score: match.score,
    text: match.metadata?.text || "",
    source: match.metadata?.source || "unknown",
    chunkIndex: match.metadata?.chunkIndex ?? -1,
  }));
};
