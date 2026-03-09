// loading the text in the pinecone db
import fs from "fs";
import { embedText } from "./embed.js";
import { index } from "./pinecone.js";
import { chunkText } from "./chunk.js";

const loadDoc = async () => {
  const file = fs.readFileSync("./docs/test-doc.txt", "utf8");
  const chunks = chunkText(file);

  const vectors = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await embedText(chunk);

    vectors.push({
      id: `doc1-${i}`,
      values: embedding,
      metadata: {
        text: chunk,
        documentId: "doc1",
        chunkIndex: i,
        source: "test-doc.txt",
      },
    });
  }

  await index.upsert(vectors);

  console.log(`Uploaded ${vectors.length} chunks to Pinecone!`);
};

loadDoc().catch(console.error);
