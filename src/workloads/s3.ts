import { Bucket } from "@monolayer/sdk";

const BananaBucket = new Bucket("snaps2u");

export default BananaBucket;

// Client configuration

import { S3Client, PutObjectCommand, ObjectCannedACL } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
    region: process.env.AWS_REGION, // Explicitly set the region
    credentials: process.env.ML_BUCKET_ENDPOINT ? {
        accessKeyId: process.env.ML_ACCESS_KEY_ID as string || 'minioadmin',
        secretAccessKey: process.env.ML_SECRET_ACCESS_KEY as string || 'minioadmin',
    } : {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string || '',
    },
    endpoint: process.env.ML_BUCKET_ENDPOINT || undefined, // Use local endpoint if available
    forcePathStyle: !!process.env.ML_BUCKET_ENDPOINT, // Required for MinIO/LocalStack
});

// Function to upload image to S3
export async function uploadImageToS3(key: string, body: Buffer, contentType: string): Promise<string> {
  const region = await s3Client.config.region(); // Get region from client config
  if (!region) {
    throw new Error("AWS region is not defined in S3Client configuration.");
  }
  const bucketName = BananaBucket.name;

  const uploadParams = {
    Bucket: bucketName,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: 'public-read' as ObjectCannedACL, // Make the object publicly readable
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));
    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    console.log(`Image uploaded to S3: ${publicUrl}`);
    return publicUrl;
  } catch (error: unknown) {
    console.error("Error uploading image to S3:", error);
    throw error;
  }
}