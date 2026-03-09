import { OpenRouter } from "@openrouter/sdk";
import dotenv from "dotenv";

dotenv.config();

console.log("DEEPSEEK_API_KEY loaded:", !!process.env.DEEPSEEK_API_KEY);
console.log(
  "DEEPSEEK_API_KEY preview:",
  process.env.DEEPSEEK_API_KEY
    ? process.env.DEEPSEEK_API_KEY.slice(0, 12) + "..."
    : "MISSING",
);

const openrouter = new OpenRouter({
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export const embedText = async (text) => {
  const res = await openrouter.embeddings.generate({
    requestBody: {
      model: "openai/text-embedding-3-small",
      input: text,
    },
  });

  return res.data[0].embedding;
};
