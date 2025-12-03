"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

async function groqCompletion(prompt) {
  const r = await groq.chat.completions.create({
    model:"llama-3.3-70b-versatile",

    messages: [{ role: "user", content: prompt }],
  });
  return r.choices[0].message.content;
}

export async function generateCoverLetter(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const prompt = `
Write a professional cover letter for ${data.jobTitle} at ${data.companyName}.

Industry: ${user.industry}
Experience: ${user.experience}
Skills: ${user.skills?.join(", ")}
Bio: ${user.bio}

Job description:
${data.jobDescription}

Requirements:
- Professional tone
- Max 400 words
- Markdown format
`;

  const content = await groqCompletion(prompt);

  return await db.coverLetter.create({
    data: {
      content,
      companyName: data.companyName,
      jobTitle: data.jobTitle,
      jobDescription: data.jobDescription,
      userId: user.id,
      status: "completed"
    }
  });
}

export async function getCoverLetters() {
  const { userId } = await auth();
  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  return await db.coverLetter.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });
}

export async function getCoverLetter(id) {
  const { userId } = await auth();
  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  return await db.coverLetter.findUnique({ where: { id, userId: user.id } });
}

export async function deleteCoverLetter(id) {
  const { userId } = await auth();
  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  return await db.coverLetter.delete({ where: { id, userId: user.id } });
}
