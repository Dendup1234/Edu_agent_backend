// loading the text in the pinecone db
import fs from "fs";
import { embedText } from "./embed.js";
import { index } from "./pinecone.js";
const pdfParse = (await import("pdf-parse")).default;

const loadDoc = async () => {
  const file = fs.readFileSync("./docs/test-doc.txt", "utf8");

  const embedding = await embedText(file);

  await index.upsert([
    {
      id: "doc1",
      values: embedding,
      metadata: {
        text: file,
      },
    },
  ]);

  console.log("Uploaded to Pinecone!");
};

loadDoc();
