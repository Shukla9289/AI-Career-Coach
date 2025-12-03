"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

async function groqCompletion(prompt) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile"
,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  });

  return completion.choices[0].message.content;
}

export async function generateQuiz() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { industry: true, skills: true },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
Generate 10 technical interview questions for a ${user.industry} professional
${user.skills?.length ? `with expertise in ${user.skills.join(", ")}` : ""}.

Each question must be MCQ with 4 options.

Return ONLY JSON in below format:
{
  "questions": [
    {
      "question": "string",
      "options": ["A","B","C","D"],
      "correctAnswer":"string",
      "explanation":"string"
    }
  ]
}
`;

  const text = await groqCompletion(prompt);
  const cleaned = text.replace(/```(?:json)?/g, "").trim();
  const quiz = JSON.parse(cleaned);

  return quiz.questions;
}

export async function saveQuizResult(questions, answers, score) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const questionResults = questions.map((q, i) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[i],
    isCorrect: q.correctAnswer === answers[i],
    explanation: q.explanation
  }));

  const wrong = questionResults.filter(q => !q.isCorrect);

  let improvementTip = null;

  if (wrong.length > 0) {
    const wrongText = wrong.map(q =>
      `Question: ${q.question}\nCorrect: ${q.answer}\nUser: ${q.userAnswer}`
    ).join("\n\n");

    const prompt = `
User got these ${user.industry} questions wrong:

${wrongText}

Give ONE improvement advice under 2 sentences.
`;

    improvementTip = await groqCompletion(prompt);
  }

  return await db.assessment.create({
    data: {
      userId: user.id,
      quizScore: score,
      questions: questionResults,
      category: "Technical",
      improvementTip,
    }
  });
}

export async function getAssessments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  return await db.assessment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" }
  });
}
