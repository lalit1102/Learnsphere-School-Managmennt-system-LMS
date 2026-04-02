import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import dotenv from "dotenv";
dotenv.config();

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

async function verifyGeneration() {
  try {
    console.log(`\nVerifying Gemini 2.5 Flash-Lite integration...`);
    const { text } = await generateText({
      model: google("gemini-2.5-flash-lite", { thinking: true }),
      prompt: "Generate a sample academic period json: { subject: 'Math', time: '10:00' }",
    });
    console.log(`✅ Generation Successful! AI Response: ${text}`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Generation Failed:`, err.message);
    process.exit(1);
  }
}

verifyGeneration();
