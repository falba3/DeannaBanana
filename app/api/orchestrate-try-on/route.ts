// app/api/orchestrate-try-on/route.ts
import { Buffer } from "node:buffer";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { MySQLConnector, BookData, ClippingData } from "../../../lib/mysql";
import { uploadImageToS3 } from "../../../lib/upload-image";

import fs from "fs";
import path from "path";

// --- Constants and Utility Functions (Copied/Adapted from existing routes) ---
const MODEL_NAME = "gemini-2.5-flash-image";

const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!key) {
    throw new Error("Set GEMINI_API_KEY or GOOGLE_API_KEY in your environment.");
  }
  return key;
};

// Function to convert file to generative part (for local files, adapted)
function fileToGenerativePart(filePath: string, mimeType: string) {
  const fullPath = path.join(process.cwd(), "public", filePath);
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

// Utility to convert data URL to generative part
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

// Utility to fetch image from URL and convert to generative part
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

const SCENES = [
  {
    id: "subway",
    title: "Subway sprint",
    text:
      "Generate a photorealistic image of the person. Crucially, perfectly retain the clothing items visible in the base image on the person, including its style, fit, design, and any details. Do NOT alter or remove the clothing. Maintain the person's identity, facial features, body proportions, and lighting. "
      + "Same person, same outfit, running towards the subway, realistic lifestyle photo.",
  },
  {
    id: "cafe",
    title: "Coffee break",
    text:
      "Generate a photorealistic image of the person. Crucially, perfectly retain the clothing item visible in the base image on the person, including its style, fit, design, and any details. Do NOT alter or remove the clothing. Maintain the person's identity, facial features, body proportions, and lighting. "
      + "Same person, same outfit, sitting in a cafeteria, sipping coffee. The personhas a relaxed posture, showing comfort, showing how the outfit fits when seated, soft shadows, warm tones, realistic lifestyle photo.",
  },
  {
    id: "gym",
    title: "Gym floor",
    text:
      "Generate a photorealistic image of the person. Crucially, perfectly retain the clothing item visible in the base image on the person, including its style, fit, design, and any details. Do NOT alter or remove the clothing. Maintain the person's identity, facial features, body proportions, and lighting. "
      + "Same person, same outfit, laying down in the gym, lifting weights. The person has an athletic posture, showing effort, showing how the outfit fits when laying on the floor, soft shadows, warm tones, realistic lifestyle photo.",
  },
];

export const runtime = "nodejs";
export const maxDuration = 90; // Max duration for Vercel Serverless Function

export async function POST(req: NextRequest) {
  let db: MySQLConnector | null = null; // Declare db outside try block for finally access
  try {
    const {
      clothImageUrl,
      personImageUrl,
      userId = 221, // Default userId
      generateSituations = true,
      situationDescription,
      situationCount = 3,
    } = await req.json();

    if (!clothImageUrl || !personImageUrl) {
      return NextResponse.json(
        { error: "Missing clothImageUrl or personImageUrl in request body." },
        { status: 400 }
      );
    }

    db = new MySQLConnector();
    await db.connect();

    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');

    // --- Step 1: Create Book (Adapted from app/api/create-book/route.ts) ---
    const bookName = `DeannaBanana Virtual Try-On`;
    const bookDescription = `Virtual Try-On generated images for User ${userId}`;

    const newBookData: BookData = {
      user_id: userId,
      name: bookName,
      slug: `deannabanana-virtual-try-on-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${now.toTimeString().slice(0, 8).replace(/:/g, '')}-${userId}`,
      rendered: 0,
      version: 1,
      category_id: 19,
      modified: formattedDate,
      addEnd: 1,
      coverImage: "",
      sharing: 0,
      coverColor: 2,
      dollarsGiven: 0,
      privacy: 0,
      type: 0,
      created: formattedDate,
      coverHexColor: "#336699",
      numLikers: 0,
      description: bookDescription,
      tags: "",
      thumbnailImage: "",
      numClips: 0,
      numViews: 0,
      userLanguage: "es-ES",
      embed_code: null,
      thumbnailImageSmall: "",
      humanModified: formattedDate,
      coverV3: 1,
      typeFilters: "a:0:{}"
    };

    const bookId = await db.createBook(newBookData);
    if (!bookId) {
      throw new Error("Failed to create book in database.");
    }
    const bookSlug = newBookData.slug

    // --- Step 2: Generate Virtual Try-On Image (Adapted from app/api/generate/route.ts) ---
    if (!getApiKey()) {
      throw new Error("Server configuration error: GEMINI_API_KEY is missing.");
    }
    const genAI = new GoogleGenerativeAI(getApiKey());
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

    const tryOnPrompt = "Carefully composite the clothing item from the 'clothing image' onto the person from the 'person image'. Crucially, completely remove any existing clothing from the person's body before compositing, so that ONLY the new clothing item is visible. Maintain the person's original identity, facial features, body proportions, and lighting. Ensure the new clothing piece's style is preserved and that it fits realistically, adapting naturally to the person's body shape and pose. Produce a high-quality, photorealistic image.";

    let personPart;
    let clothPart;

    try {
      if (personImageUrl.startsWith("data:")) {
        personPart = dataUrlToGenerativePart(personImageUrl);
      } else if (personImageUrl.startsWith("http://") || personImageUrl.startsWith("https://")) {
        personPart = await fetchImageAsGenerativePart(personImageUrl);
      } else {
        personPart = fileToGenerativePart(personImageUrl, "image/jpeg");
      }
    } catch (error) {
      throw new Error(`Invalid person image data or URL provided: ${(error as Error).message}`);
    }

    try {
      if (clothImageUrl.startsWith("data:")) {
        clothPart = dataUrlToGenerativePart(clothImageUrl);
      } else if (clothImageUrl.startsWith("http://") || clothImageUrl.startsWith("https://")) {
        clothPart = await fetchImageAsGenerativePart(clothImageUrl);
      } else {
        clothPart = fileToGenerativePart(clothImageUrl, "image/jpeg");
      }
    } catch (error) {
      throw new Error(`Invalid cloth image data or URL provided: ${(error as Error).message}`);
    }

    const tryOnParts = [
      personPart,
      clothPart,
      { text: tryOnPrompt },
    ];

    const tryOnResult = await model.generateContent({
      contents: [{ role: "user", parts: tryOnParts }],
      generationConfig,
      safetySettings,
    });

    if (!tryOnResult.response.candidates || tryOnResult.response.candidates.length === 0) {
      throw new Error("No candidates returned from the Gemini model for try-on image generation.");
    }

    const tryOnCandidate = tryOnResult.response.candidates[0];
    const generatedTryOnImagePart = tryOnCandidate.content?.parts?.[0];

    if (!generatedTryOnImagePart?.inlineData?.data || !generatedTryOnImagePart.inlineData?.mimeType) {
      throw new Error("Gemini model failed to generate valid content for try-on image.");
    }

    const tryOnImageDataBuffer = Buffer.from(generatedTryOnImagePart.inlineData.data, 'base64');
    const tryOnFilename = `generated_images/try-on-${bookId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${generatedTryOnImagePart.inlineData.mimeType.split('/')[1]}`;
    const tryOnImageUrl = await uploadImageToS3(tryOnFilename, tryOnImageDataBuffer, generatedTryOnImagePart.inlineData.mimeType);

    if (!tryOnImageUrl) {
      throw new Error("Failed to upload try-on image to S3.");
    }
    console.log(`Try-on image uploaded to S3: ${tryOnImageUrl}`);

    const tryOnClippingData: ClippingData = {
      book_id: bookId,
      caption: `Virtual Try-On: ${personImageUrl.split('/').pop()} with ${clothImageUrl.split('/').pop()}`,
      text: "Generated by DeannaBanana Virtual Try-On",
      thumbnail: tryOnImageUrl,
      useThumbnail: 1,
      type: 1,
      url: tryOnImageUrl,
      created: formattedDate,
      num: 1,
      migratedS3: 0,
      modified: formattedDate,
    };
    const newTryOnClippingId = await db.createClipping(tryOnClippingData);
    if (newTryOnClippingId) {
      console.log(`Try-on Clipping created with ID: ${newTryOnClippingId}`);
      await db.incrementBookNumClips(bookId);
    } else {
      console.error("Failed to create try-on clipping: Clipping ID not returned.");
    }

    // --- Step 3 (Conditional): Generate Situations (Adapted from app/api/generate-situations/route.ts) ---
    const situationImageUrls: string[] = [];
    if (generateSituations) {
      console.log("Generating situations...");

      // Fetch the generated try-on image from S3 to use as base for situations
      // Since fetchImageAsGenerativePart can handle URLs, we can use tryOnImageUrl directly
      const baseImageForSituationsPart = await fetchImageAsGenerativePart(tryOnImageUrl);

      let scenesToGenerate = [];
      if (situationDescription) {
        // If a custom description is provided, use it for a single situation
        scenesToGenerate.push({
          id: "custom",
          title: "Custom Situation",
          text: situationDescription,
        });
      } else {
        // Otherwise, use a subset of predefined scenes
        scenesToGenerate = SCENES.slice(0, Math.min(situationCount, SCENES.length));
      }

      for (const scene of scenesToGenerate) {
        console.log(`Generating for scene: ${scene.title}`);
        try {
          const situationPrompt = scene.text;
          const situationResult = await model.generateContent({
            contents: [
              {
                role: "user",
                parts: [baseImageForSituationsPart, { text: situationPrompt }],
              },
            ],
            generationConfig,
            safetySettings,
          });

          const situationCandidate = situationResult.response.candidates?.[0];
          const generatedSituationImagePart = situationCandidate?.content?.parts?.[0];

          if (!generatedSituationImagePart?.inlineData?.data || !generatedSituationImagePart.inlineData?.mimeType) {
            console.warn(`No valid image data returned for situation scene '${scene.title}'. Skipping.`);
            continue; // Skip to the next scene
          }

          const situationImageDataBuffer = Buffer.from(generatedSituationImagePart.inlineData.data, 'base64');
          const situationFilename = `generated_images/situations/${bookId}/${newTryOnClippingId}/${scene.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${generatedSituationImagePart.inlineData.mimeType.split('/')[1]}`;
          const situationS3Url = await uploadImageToS3(situationFilename, situationImageDataBuffer, generatedSituationImagePart.inlineData.mimeType);

          if (situationS3Url) {
            situationImageUrls.push(situationS3Url);
            console.log(`Situation image uploaded to S3: ${situationS3Url}`);

            const situationClippingData: ClippingData = {
              book_id: bookId,
              caption: `Situation: ${scene.title} for Try-On #${newTryOnClippingId}`,
              text: `Generated by DeannaBanana Situations for try-on clipping ID: ${newTryOnClippingId}`,
              thumbnail: situationS3Url,
              useThumbnail: 1,
              type: 2,
              url: situationS3Url,
              created: formattedDate,
              num: 1,
              migratedS3: 0,
              modified: formattedDate,
            };
            const newSituationClippingId = await db.createClipping(situationClippingData);
            if (newSituationClippingId) {
              console.log(`Situation Clipping created with ID: ${newSituationClippingId}`);
              await db.incrementBookNumClips(bookId);
            } else {
              console.error(`Failed to create situation clipping for scene: ${scene.title}`);
            }
          }
        } catch (situationError) {
          console.error(`Error generating or uploading situation for scene '${scene.title}':`, situationError);
          // Continue to next scene even if one fails
        }
      }
    }

    return NextResponse.json({
      bookId,
      bookSlug,
      tryOnImageUrl,
      ...(generateSituations && { situationImageUrls }),
    }, { status: 200 });

  } catch (error) {
    console.error("Orchestration API error:", error);
    return NextResponse.json(
      { error: "Failed to complete virtual try-on orchestration", details: (error as Error).message },
      { status: 500 }
    );
  } finally {
    if (db) {
      await db.disconnect();
    }
  }
}
