// app/api/generate-situations/route.ts
import { Buffer } from "node:buffer";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { uploadImageToS3 } from "../../../lib/upload-image"; // Reusing our S3 upload utility
import { MySQLConnector, ClippingData } from "../../../lib/mysql"; // For potential database updates

const MODEL_NAME = "gemini-2.5-flash-image";

const SCENES = [
  {
    id: "subway",
    title: "Subway sprint",
    text:
      "Generate a photorealistic image of the person. Maintain the person's identity, facial features, body proportions, and lighting. "
      + "Same young man, same outfit, running towards the subway. He holds a white bag in his right hand, with a worrying posture that shows how the hoodie fits when in motion, soft shadows, warm tones, realistic lifestyle photo.",
  },
  {
    id: "cafe",
    title: "Coffee break",
    text:
      "Generate a photorealistic image of the person. Maintain the person's identity, facial features, body proportions, and lighting. "
      + "Same young man, same outfit, sitting in a cafeteria, sipping coffee. He has a relaxed posture, showing comfort, showing how the hoodie fits when seated, soft shadows, warm tones, realistic lifestyle photo.",
  },
  {
    id: "gym",
    title: "Gym floor",
    text:
      "Generate a photorealistic image of the person. Maintain the person's identity, facial features, body proportions, and lighting. "
      + "Same young man, same outfit, laying down in the gym, lifting weights. He has an athletic posture, showing effort, showing how the hoodie fits when laying on the floor, soft shadows, warm tones, realistic lifestyle photo.",
  },
];

export const runtime = "nodejs";
export const maxDuration = 60; // Max duration for Vercel Serverless Function

function getApiKey() {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!key) {
    throw new Error("Set GEMINI_API_KEY or GOOGLE_API_KEY in your environment.");
  }
  return key;
}

// Utility to convert data URL to generative part, adapted from app/api/generate/route.ts
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
  try {
    const { baseImage, book_id, clothing_id } = await req.json(); // baseImage will be a data URL

    if (!baseImage) {
      return NextResponse.json(
        { error: "Base image (data URL) is required." },
        { status: 400 }
      );
    }
    if (!book_id) {
        return NextResponse.json(
            { error: "Book ID is required to associate situations." },
            { status: 400 }
        );
    }

    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generatedSituationImages: { id: string; title: string; s3Url: string; }[] = [];

    const baseImagePart = dataUrlToGenerativePart(baseImage);

    const db = new MySQLConnector();
    await db.connect();

    try {
        for (const scene of SCENES) {
            const result = await model.generateContent({
                contents: [
                    {
                        role: "user",
                        parts: [baseImagePart, { text: scene.text }],
                    },
                ],
            });

            const part =
                result.response.candidates?.[0]?.content?.parts?.find(
                    (p) => p.inlineData?.data
                ) ?? null;
            const inlineData = part?.inlineData;

            if (!inlineData?.data || !inlineData?.mimeType) {
                console.error(`No valid image data returned for scene '${scene.id}'.`);
                continue; // Skip this scene if no image is returned
            }

            const imageDataBuffer = Buffer.from(inlineData.data, 'base64');
            const filename = `situations/${book_id}/${clothing_id}/${scene.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${inlineData.mimeType.split('/')[1]}`;
            
            let s3Url: string | undefined;
            try {
                s3Url = await uploadImageToS3(filename, imageDataBuffer, inlineData.mimeType);
            } catch (s3Error) {
                console.error(`Failed to upload generated situation image for scene ${scene.id} to S3:`, s3Error);
                // Continue without S3 URL if upload fails for one scene
            }

            if (s3Url) {
                generatedSituationImages.push({
                    id: scene.id,
                    title: scene.title,
                    s3Url: s3Url,
                });

                const now = new Date();
                const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');

                const clippingData: ClippingData = {
                    book_id: book_id,
                    caption: `Situation: ${scene.title} with Try-On (${clothing_id || 'unknown'})`,
                    text: `Generated by DeannaBanana Situations for try-on ID: ${clothing_id || 'unknown'}`,
                    thumbnail: s3Url,
                    useThumbnail: 1,
                    type: 2, // Assuming type '2' for situation clippings, adjust if needed
                    url: s3Url,
                    created: formattedDate,
                    num: 1,
                    migratedS3: 0,
                    modified: formattedDate,
                };
                const newClippingId = await db.createClipping(clippingData);
                if (newClippingId) {
                    console.log(`Situation clipping created with ID: ${newClippingId}`);
                    await db.incrementBookNumClips(book_id);
                } else {
                    console.error("Failed to create situation clipping.");
                }
            }
        }
    } finally {
        await db.disconnect();
    }

    if (generatedSituationImages.length === 0) {
        return NextResponse.json(
            { error: "No situation images could be generated or uploaded." },
            { status: 500 }
        );
    }

    return NextResponse.json({ images: generatedSituationImages });
  } catch (error) {
    console.error("[generate-situations] error", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
