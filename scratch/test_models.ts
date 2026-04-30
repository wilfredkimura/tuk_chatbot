import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const modelList = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // dummy to get access
  
  // Actually, the SDK has a listModels method on the client
  // But wait, the standard way in JS SDK is:
  // No, the JS SDK doesn't have a direct listModels in the same way as Python.
  
  // I'll just try the 3 most common ones:
  const models = ["text-embedding-004", "embedding-001", "models/embedding-001", "models/text-embedding-004"];
  
  for (const m of models) {
    try {
      console.log(`Testing model: ${m}`);
      const model = genAI.getGenerativeModel({ model: m });
      await model.embedContent("test");
      console.log(`SUCCESS: ${m} works!`);
      return;
    } catch (e: any) {
      console.log(`FAILED: ${m} - ${e.message}`);
    }
  }
}

listModels();
