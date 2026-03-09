import fs from "fs";
import { embedText } from "./embed.js";
import { index } from "./vector.js";

const chunkText = (text, chunkSize = 800, overlap = 150) => {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();

    if (chunk) chunks.push(chunk);

    start += chunkSize - overlap;
  }

  return chunks;
};

const loadDoc = async () => {
  const file = fs.readFileSync("./docs/test-doc.txt", "utf8");

  console.log("File length:", file.length);

  const chunks = chunkText(file);
  console.log("Chunks created:", chunks.length);

  const vectors = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`Embedding chunk ${i + 1}/${chunks.length}`);

    const embedding = await embedText(chunks[i]);

    console.log("Embedding length:", embedding?.length);

    vectors.push({
      id: `doc1-${i}`,
      values: embedding,
      metadata: {
        text: chunks[i],
        source: "test-doc.txt",
        chunkIndex: i,
      },
    });
  }

  console.log("Vectors prepared:", vectors.length);

  if (vectors.length === 0) {
    throw new Error("No vectors created. Check chunking or embedding.");
  }

  await index.upsert({
    records: vectors,
  });

  console.log("Uploaded to Pinecone!");
};

loadDoc().catch(console.error);
