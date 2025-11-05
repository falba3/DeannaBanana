import { PutObjectCommand, type ObjectCannedACL } from "@aws-sdk/client-s3";
import BananaBucket from "../../workloads/s3";
import { s3Client } from "./s3-client";

// Function to upload image to S3
export async function uploadImageToS3(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
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
    ACL: "public-read" as ObjectCannedACL, // Make the object publicly readable
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));
    const publicUrl = `https://${bucketName}.s3.us-east-1.amazonaws.com/${key}`;
    console.log(`Image uploaded to S3: ${publicUrl}`);
    return publicUrl;
  } catch (error: unknown) {
    console.error("Error uploading image to S3:", error);
    throw error;
  }
}
