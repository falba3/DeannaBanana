// Client configuration

import { S3Client } from "@aws-sdk/client-s3";

// Ensure environment variables are loaded if not in a Next.js environment already
// For Next.js, process.env is usually populated automatically
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!region) {
  throw new Error("AWS_REGION environment variable is not set.");
}
if (!accessKeyId) {
  throw new Error("AWS_ACCESS_KEY_ID environment variable is not set.");
}
if (!secretAccessKey) {
  throw new Error("AWS_SECRET_ACCESS_KEY environment variable is not set.");
}

export const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});
