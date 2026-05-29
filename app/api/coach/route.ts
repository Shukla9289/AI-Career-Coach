import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// RESTful Web Services Router Endpoint for AI Roadmaps
export async function POST(request: Request) {
  let requestPayload = "";
  let targetUserEmail = "anonymous@test.com";
  
  try {
    const body = await request.json();
    requestPayload = JSON.stringify(body);
    
    const { email, targetRole, skills } = body;
    
    // Strict input verification & Secure coding validation
    if (!email || !targetRole) {
      return NextResponse.json(
        { error: "Bad Request: Email and targetRole are mandatory requirements." },
        { status: 400 }
      );
    }
    
    targetUserEmail = email;

    // Orchestrating Mock AI integration (Groq & Gemini APIs) for career roadmaps
    const generatedRoadmap = {
      title: `${targetRole.toUpperCase()} Mastery Roadmap`,
      targetRole: targetRole,
      steps: [
        { phase: "Foundation", topics: ["Data Structures & Algorithms", "Object-Oriented Programming (Java)"] },
        { phase: "Core Backend Development", topics: ["Spring Boot Web Services", "Relational Database Concepts (MySQL/MariaDB)"] },
        { phase: "Deployment & Scale", topics: ["Docker Containerization", "Kubernetes Orchestration & SSL Security configs"] }
      ]
    };

    // Database schema insert tracking
    const user = await prisma.user.upsert({
      where: { email: email },
      update: {},
      create: { email: email, name: email.split("@")[0] },
    });

    const roadmap = await prisma.roadmap.create({
      data: {
        title: generatedRoadmap.title,
        targetRole: generatedRoadmap.targetRole,
        stepsJson: JSON.stringify(generatedRoadmap.steps),
        userId: user.id,
      },
    });

    // Create debug log for auditing system stability benchmarks
    await prisma.debugLog.create({
      data: {
        endpoint: "/api/coach",
        payload: requestPayload,
        status: 200,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true, roadmap }, { status: 200 });

  } catch (error: any) {
    // Audit, debug, and troubleshoot product defects cleanly
    console.error("Troubleshoot failure: ", error.message);
    
    await prisma.debugLog.create({
      data: {
        endpoint: "/api/coach",
        payload: requestPayload,
        status: 500,
        error: error.message,
      },
    });

    return NextResponse.json(
      { error: "Internal Server Error: Failed to generate career coach recommendations." },
      { status: 500 }
    );
  }
}
