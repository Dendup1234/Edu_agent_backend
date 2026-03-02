import { embedText } from "./embed.js";
import { index } from "./pinecone.js";

export const retrieveContext = async (query) => {
  const queryEmbedding = await embedText(query);

  const result = await index.query({
    topK: 3,
    vector: queryEmbedding,
    includeMetadata: true,
  });

  return result.matches.map((m) => m.metadata.text).join("\n\n---\n\n");
};
