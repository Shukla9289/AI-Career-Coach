"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

async function groqCompletion(prompt) {
  const r = await groq.chat.completions.create({
  model: "llama-3.3-70b-versatile",

    messages: [{ role: "user", content: prompt }],
  });
  return r.choices[0].message.content;
}

export async function saveResume(content) {
  const { userId } = await auth();
  const user = await db.user.findUnique({ where: { clerkUserId: userId } });

  const resume = await db.resume.upsert({
    where: { userId: user.id },
    update: { content },
    create: { content, userId: user.id }
  });

  revalidatePath("/resume");
  return resume;
}

export async function getResume() {
  const { userId } = await auth();
  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  return await db.resume.findUnique({ where: { userId: user.id } });
}

export async function improveWithAI({ current, type }) {
  const { userId } = await auth();
  const user = await db.user.findUnique({
    where: { clerkUserId: userId }
  });

  const prompt = `
Improve this ${type} for ${user.industry} role:
"${current}"

Rules:
- Quantifiable
- Professional
- Achievement focused
`;

  return await groqCompletion(prompt);
}
