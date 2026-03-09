// rag/vector.js
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

dotenv.config();

const pineconeApiKey = process.env.PINECONE_API_KEY;
const indexName = process.env.PINECONE_INDEX || "edudocs";

if (!pineconeApiKey) {
  throw new Error("PINECONE_API_KEY is missing in .env");
}

const pc = new Pinecone({
  apiKey: pineconeApiKey,
});

export const index = pc.index(indexName);

export const initCollection = async () => {
  try {
    console.log("Initializing Pinecone index:", indexName);

    // simple connectivity check
    const stats = await index.describeIndexStats();
    console.log("Pinecone connected successfully");
    console.log("Index stats:", stats);

    return index;
  } catch (error) {
    console.error("Failed to initialize Pinecone index:", error.message);
    throw error;
  }
};
