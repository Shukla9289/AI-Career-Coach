import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyDB6hILqzwx1WMxdZey8UcBgwRzKuDbFG8");

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Say hello");
    console.log("✅ SUCCESS:", result.response.text());
  } catch (error) {
    console.error("❌ ERROR:", error.message);
  }
}

test();
test();