import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

import { NextRequest, NextResponse } from "next/server";

import fs from "fs";

import path from "path";



const MODEL_NAME = "models/gemini-2.5-flash-image";

const API_KEY = process.env.GEMINI_API_KEY as string;



// Function to convert file to generative part

function fileToGenerativePart(filePath: string, mimeType: string) {
  const fullPath = path.join(process.cwd(), "public", filePath);
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(fullPath)).toString("base64"),
      mimeType,
    },
  };
}

function dataUrlToGenerativePart(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid data URL");
  }
  const mimeType = match[1];
  const data = match[2];
  return {
    inlineData: {
      data,
      mimeType,
    },
  };
}

export async function POST(req: NextRequest) {
  const { cloth, person } = await req.json();

  if (!cloth || !person) {
    return NextResponse.json(
      { error: "Missing cloth or person image" },
      { status: 400 }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
      temperature: 0.4,
      topK: 32,
      topP: 1,
      maxOutputTokens: 4096,
    };

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    const improvedPrompt = "Composite the first image's person to be wearing the second image's provided clothing item. Crucially, remove any existing clothing from the person's body before compositing, so that ONLY the new clothing item is visible. Keep the first person's identity, facial features, body proportions, and lighting consistent. Make sure to keep the clothing piece's style and fit it to the new person well. Produce a photorealistic image.";

    const personPart = person.startsWith("data:")
      ? dataUrlToGenerativePart(person)
      : fileToGenerativePart(person, "image/jpeg");

    const parts = [
      personPart,
      fileToGenerativePart(cloth, "image/jpeg"),
      { text: improvedPrompt },
    ];

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig,
      safetySettings,
    });

    if (!result.response.candidates || result.response.candidates.length === 0) {
      return NextResponse.json(
        { error: "No candidates returned from the model" },
        { status: 500 }
      );
    }

    const generatedImage = result.response.candidates[0].content.parts[0];

    return NextResponse.json({ image: generatedImage });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}