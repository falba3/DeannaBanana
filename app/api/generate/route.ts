import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

import { NextRequest, NextResponse } from "next/server";
import { MySQLConnector, ClippingData } from "../../../lib/mysql";

import fs from "fs";

import path from "path";
import { uploadImageToS3 } from "../../../lib/upload-image";

const MODEL_NAME = "models/gemini-2.5-flash-image";

const API_KEY = process.env.GEMINI_API_KEY as string;

// Function to convert file to generative part
function fileToGenerativePart(filePath: string, mimeType: string) {
  const fullPath = path.join(process.cwd(), "public", filePath);
  // Ensure the file exists before trying to read it
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Local file not found: ${fullPath}`);
  }
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

async function fetchImageAsGenerativePart(imageUrl: string): Promise<any> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from URL: ${imageUrl}, status: ${response.status}`);
  }
  const contentType = response.headers.get("Content-Type");
  if (!contentType || !contentType.startsWith("image/")) {
    throw new Error(`Fetched URL does not provide an image: ${imageUrl}, Content-Type: ${contentType}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const base64Data = Buffer.from(arrayBuffer).toString("base64");
  return {
    inlineData: {
      data: base64Data,
      mimeType: contentType,
    },
  };
}


export async function POST(req: NextRequest) {
  const { cloth, person, book_id } = await req.json();

  if (!cloth || !person || !book_id) {
    return NextResponse.json(
      { error: "Missing cloth, person image, or book_id" },
      { status: 400 }
    );
  }

  try {
    if (!API_KEY) {
      console.error("GEMINI_API_KEY is not set.");
      return NextResponse.json(
        { error: "Server configuration error: GEMINI_API_KEY is missing." },
        { status: 500 }
      );
    }
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
      temperature: 0.3,
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

    const improvedPrompt = "Carefully composite the clothing item from the 'clothing image' onto the person from the 'person image'. Crucially, completely remove any existing clothing from the person's body before compositing, so that ONLY the new clothing item is visible. Maintain the person's original identity, facial features, body proportions, and lighting. Ensure the new clothing piece's style is preserved and that it fits realistically, adapting naturally to the person's body shape and pose. Produce a high-quality, photorealistic image.";

    let personPart;
    try {
      if (person.startsWith("data:")) {
        personPart = dataUrlToGenerativePart(person);
      } else if (person.startsWith("http://") || person.startsWith("https://")) {
        personPart = await fetchImageAsGenerativePart(person);
      } else {
        personPart = fileToGenerativePart(person, "image/jpeg"); // Default mime type for local files
      }
    } catch (error) {
      console.error("Error processing person image:", error);
      return NextResponse.json(
        { error: `Invalid person image data or URL provided: ${(error as Error).message}` },
        { status: 400 }
      );
    }

    let clothPart;
    try {
      if (cloth.startsWith("data:")) {
        clothPart = dataUrlToGenerativePart(cloth);
      } else if (cloth.startsWith("http://") || cloth.startsWith("https://")) {
        clothPart = await fetchImageAsGenerativePart(cloth);
      } else {
        clothPart = fileToGenerativePart(cloth, "image/jpeg"); // Default mime type for local files
      }
    } catch (error) {
      console.error("Error processing cloth image:", error);
      return NextResponse.json(
        { error: `Invalid cloth image data or URL provided: ${(error as Error).message}` },
        { status: 400 }
      );
    }
    
    const parts = [
      personPart,
      clothPart,
      { text: improvedPrompt },
    ];

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig,
      safetySettings,
    });

    if (!result.response.candidates || result.response.candidates.length === 0) {
      console.error("Gemini API returned no candidates:", JSON.stringify(result.response, null, 2));
      return NextResponse.json(
        { error: "No candidates returned from the model" },
        { status: 500 }
      );
    }

    const candidate = result.response.candidates[0];

    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      console.error("Gemini API returned a candidate without valid content or parts:", JSON.stringify(result.response, null, 2));
      return NextResponse.json(
        { error: "Gemini model failed to generate valid image content." },
        { status: 500 }
      );
    }

    const generatedImage = candidate.content.parts[0];

    let publicS3Url: string | undefined;
    if (generatedImage.inlineData?.data && generatedImage.inlineData?.mimeType) {
      const imageDataBuffer = Buffer.from(generatedImage.inlineData.data, 'base64');
      const filename = `try-on-${Date.now()}-${Math.random().toString(36).substring(7)}.${generatedImage.inlineData.mimeType.split('/')[1]}`;
      try {
        publicS3Url = await uploadImageToS3(`generated_images/clippings/${filename}`, imageDataBuffer, generatedImage.inlineData.mimeType);
      } catch (s3Error) {
        console.error("Failed to upload image to S3:", s3Error);
        // Continue without S3 URL if upload fails
      }
    }

    // Database interaction to create a clipping
    const db = new MySQLConnector();
    try {
      await db.connect();

      const now = new Date();
      const formattedDate = now.toISOString().slice(0, 19).replace('T', ' '); // Format to 'YYYY-MM-DD HH:MM:SS'

      const clippingData: ClippingData = {
        book_id: book_id,
        caption: `Virtual Try-On: ${person.split('/').pop()} with ${cloth.split('/').pop()}`,
        text: "Generated by DeannaBanana Virtual Try-On",
        thumbnail: publicS3Url || "",
        useThumbnail: 1,
        type: 1,
        url: publicS3Url || "",
        created: formattedDate,
        num: 1,
        migratedS3: 0,
        modified: formattedDate,
      };

      const newClippingId = await db.createClipping(clippingData);
      if (newClippingId) {
        console.log(`Clipping created with ID: ${newClippingId}`);
        await db.incrementBookNumClips(book_id);
      } else {
        console.error("Failed to create clipping: Clipping ID not returned.");
      }
    } catch (dbError) {
      console.error("Database operation failed:", dbError);
      // Decide if you want to return a 500 here or just log and continue.
      // For now, it will fall through to the main catch block if not re-thrown.
    } finally {
      await db.disconnect();
    }


    return NextResponse.json({ image: generatedImage });
  } catch (error) {
    console.error("Caught error in /api/generate:", error);
    return NextResponse.json(
      { error: "Failed to generate image", details: (error as Error).message },
      { status: 500 }
    );
  }
}
