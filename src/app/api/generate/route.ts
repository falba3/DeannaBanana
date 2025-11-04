import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

import { NextRequest, NextResponse } from "next/server";
import { MySQLConnector, ClippingData } from "@/lib/mysql";
import { uploadImageToS3 } from "@/workloads/s3";

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

    let publicS3Url: string | undefined;
    if (generatedImage.inlineData?.data && generatedImage.inlineData?.mimeType) {
      const imageDataBuffer = Buffer.from(generatedImage.inlineData.data, 'base64');
      const filename = `try-on-${Date.now()}-${Math.random().toString(36).substring(7)}.${generatedImage.inlineData.mimeType.split('/')[1]}`;
      try {
        publicS3Url = await uploadImageToS3(filename, imageDataBuffer, generatedImage.inlineData.mimeType);
      } catch (s3Error) {
        console.error("Failed to upload image to S3:", s3Error);
        // Continue without S3 URL if upload fails
      }
    }

    // Database interaction to create a clipping
    const db = new MySQLConnector();
    await db.connect();

    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 19).replace('T', ' '); // Format to 'YYYY-MM-DD HH:MM:SS'

    // Find or create a book for the clippings
    const userId = 221; // Default user ID, can be made dynamic later
    const bookName = "DeannaBanana Virtual Try-On";
    const bookDescription = "Virtual Try-On generated images";
    const coverImage = publicS3Url || "https://www.deanna2u.com/img/Logo_H_blanco.png";
    const thumbnailImage = publicS3Url || "https://www.deanna2u.com/img/Logo_H_blanco.png";
    const userLanguage = "es-ES";

    const bookId = await db.findOrCreateBook(userId, bookName, bookDescription, coverImage, thumbnailImage, userLanguage);

    if (bookId === null) {
      console.error("Failed to find or create book.");
      await db.disconnect();
      return NextResponse.json(
        { error: "Failed to process clipping: could not find or create book" },
        { status: 500 }
      );
    }

    const clippingData: ClippingData = {
      book_id: bookId,
      caption: `Virtual Try-On: ${person.split('/').pop()} with ${cloth.split('/').pop()}`,
      text: "Generated by DeannaBanana Virtual Try-On",
      thumbnail: publicS3Url || "https://www.gstatic.com/lamda/images/gemini_aurora_thumbnail_4g_e74822ff0ca4259beb718.png",
      useThumbnail: 1,
      type: 1,
      url: publicS3Url || "https://www.gstatic.com/lamda/images/gemini_aurora_thumbnail_4g_e74822ff0ca4259beb718.png",
      created: formattedDate,
      num: 1,
      migratedS3: 0,
      modified: formattedDate,
    };

    const newClippingId = await db.createClipping(clippingData);
    if (newClippingId) {
      console.log(`Clipping created with ID: ${newClippingId}`);
      await db.incrementBookNumClips(bookId);
    } else {
      console.error("Failed to create clipping.");
    }

    await db.disconnect();

    return NextResponse.json({ image: generatedImage });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}