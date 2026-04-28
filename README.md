Hello use this doc here:




Install the Google GenAI SDK
Python
JavaScript
Go
Java
C#
Apps Script
Using Node.js v18+, install the Google Gen AI SDK for TypeScript and JavaScript using the following npm command:


npm install @google/genai
Make your first request
Here is an example that uses the generateContent method to send a request to the Gemini API using the Gemini 2.5 Flash model.

If you set your API key as the environment variable GEMINI_API_KEY, it will be picked up automatically by the client when using the Gemini API libraries. Otherwise you will need to pass your API key as an argument when initializing the client.

Note that all code samples in the Gemini API docs assume that you have set the environment variable GEMINI_API_KEY.

Python
JavaScript
Go
Java
C#
Apps Script
REST

import { GoogleGenAI } from "@google/genai";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Explain how AI works in a few words",
  });
  console.log(response.text);
}

main();