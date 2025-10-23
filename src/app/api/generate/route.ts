
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

import { NextRequest, NextResponse } from "next/server";

import fs from "fs";

import path from "path";



const MODEL_NAME = "gemini-pro-vision";

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



    const parts = [

      fileToGenerativePart(cloth, "image/jpeg"),

      fileToGenerativePart(person, "image/jpeg"),

      { text: "Composite the person to be wearing the provided clothing item. Keep identity, facial features, body proportions, and lighting consistent. Produce a photorealistic image." },

    ];



    const result = await model.generateContent({ 

        contents: [{ role: "user", parts }],

        generationConfig,

        safetySettings,

    });



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

