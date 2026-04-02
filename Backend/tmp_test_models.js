import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import dotenv from "dotenv";
dotenv.config();

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

async function testNetwork(name) {
  try {
    console.log(`\nNetwork test for: ${name}...`);
    const { text } = await generateText({
      model: google(name),
      prompt: "say hi",
    });
    console.log(`✅ ${name} works! Output: ${text}`);
    return true;
  } catch (err) {
    console.error(`❌ ${name} failed:`, err.message);
    return false;
  }
}

const modelsToTest = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-pro"
];

(async () => {
  for (const m of modelsToTest) {
    if (await testNetwork(m)) {
        console.log(`\nFound working model: ${m}`);
        process.exit(0);
    }
  }
  process.exit(1);
})();
