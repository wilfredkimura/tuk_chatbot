import { GoogleGenerativeAI } from "@google/generative-ai";

async function testKey() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    console.log("SUCCESS: Key is valid. Response:", result.response.text());
  } catch (e: any) {
    console.log("FAILED: Key is invalid or restricted. Error:", e.message);
  }
}

testKey();
