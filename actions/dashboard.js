"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";

// Initialize Groq Client (OpenAI compatible)
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

// AI Insight Generator using Groq
export const generateAIInsights = async (industry) => {

  const prompt = `
Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
{
  "salaryRanges": [
    { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
  ],
  "growthRate": number,
  "demandLevel": "High" | "Medium" | "Low",
  "topSkills": ["skill1", "skill2"],
  "marketOutlook": "Positive" | "Neutral" | "Negative",
  "keyTrends": ["trend1", "trend2"],
  "recommendedSkills": ["skill1", "skill2"]
}

IMPORTANT:
Return ONLY valid JSON.
Include at least 5 job roles.
Include at least 5 skills and trends.
Growth rate must be numeric (percentage).
Do not wrap result in backticks or markdown.
`;

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  });

  let text = completion.choices[0].message.content;

  // Cleanup in case AI returns markdown
  const cleanedText = text.replace(/```(?:json)?/g, "").trim();
  const insights = JSON.parse(cleanedText);

  return insights;
};


// Main Function
export async function getIndustryInsights() {

  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
    },
  });

  if (!user) throw new Error("User not found");

  // If not generated earlier, generate AI data
  if (!user.industryInsight) {

    const insights = await generateAIInsights(user.industry);

    const industryInsight = await db.industryInsight.create({
      data: {
        industry: user.industry,
        ...insights,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return industryInsight;
  }

  return user.industryInsight;
}
