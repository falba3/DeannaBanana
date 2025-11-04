import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' }); // Load environment variables from .env.local

function hasCode(error: unknown): error is { Code: string } {
  return typeof error === 'object' && error !== null && 'Code' in error && typeof (error as { Code: string }).Code === 'string';
}

async function verifyAwsCredentials() {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    console.error("Error: AWS_REGION, AWS_ACCESS_KEY_ID, or AWS_SECRET_ACCESS_KEY environment variables are not set.");
    console.error("Please ensure your .env.local file contains these values.");
    return;
  }

  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  try {
    console.log("Attempting to list S3 buckets to verify credentials...");
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);

    if (response.Buckets) {
      console.log("AWS credentials are VALID! Successfully listed S3 buckets.");
      console.log("Buckets found:", response.Buckets.map(b => b.Name));
    } else {
      console.log("AWS credentials seem VALID, but no buckets were returned.");
    }
  } catch (error: unknown) {
    console.error("AWS credentials VERIFICATION FAILED.");
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      if (hasCode(error)) {
        if (error.Code === 'InvalidAccessKeyId') {
          console.error("This usually means your AWS_ACCESS_KEY_ID is incorrect or inactive.");
        } else if (error.Code === 'SignatureDoesNotMatch') {
          console.error("This usually means your AWS_SECRET_ACCESS_KEY is incorrect.");
        } else if (error.Code === 'AccessDenied') {
          console.error("Your credentials are valid, but they don't have permission to list buckets.");
          console.error("Please check your IAM user's S3 permissions.");
        }
      }
    } else {
      console.error("An unknown error occurred during AWS credentials verification.", error);
    }
  }
}

verifyAwsCredentials();
