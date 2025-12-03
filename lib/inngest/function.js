import { db } from "@/lib/prisma";
import { inngest } from "./client";
import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

export const generateIndustryInsights = inngest.createFunction(
  { name: "Generate Industry Insights" },
  { cron: "0 0 * * 0" },
  async ({ step }) => {

    const industries = await step.run("Fetch industries", () =>
      db.industryInsight.findMany({ select: { industry: true } })
    );

    for (const { industry } of industries) {

      const prompt = `
Return JSON ONLY:
{
  "salaryRanges":[{"role":"","min":0,"max":0,"median":0,"location":""}],
  "growthRate":0,
  "demandLevel":"High|Medium|Low",
  "topSkills":[],
  "marketOutlook":"Positive|Neutral|Negative",
  "keyTrends":[],
  "recommendedSkills":[]
}

Industry: ${industry}
`;

      const res = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }]
      });

      const text = res.choices[0].message.content.replace(/```json|```/g, "");
      const insights = JSON.parse(text);

      await step.run(`Update ${industry}`, () =>
        db.industryInsight.update({
          where: { industry },
          data: {
            ...insights,
            lastUpdated: new Date(),
            nextUpdate: new Date(Date.now() + 7 * 86400000)
          }
        })
      );
    }
  }
);

