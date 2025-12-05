// Client configuration

import { S3Client } from "@aws-sdk/client-s3";
import { bucketLocalConfiguration } from "@monolayer/sdk";

export const s3Client = new S3Client({
  ...bucketLocalConfiguration(),
});
