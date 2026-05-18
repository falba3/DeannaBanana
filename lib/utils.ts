import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// S3 → CloudFront URL Helper
export function getSecureImageUrl(dbUrl: string | null | undefined): string {
  if (!dbUrl) return '';

  const s3DomainConfig = process.env.NEXT_PUBLIC_S3_DOMAIN;
  const s3DomainLegacyConfig = process.env.NEXT_PUBLIC_S3_DOMAIN_LEGACY;
  const cfDomain = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;

  if (!cfDomain) return dbUrl;

  const targetBuckets = [
    s3DomainConfig?.split('.')[0],
    s3DomainLegacyConfig?.split('.')[0]
  ].filter(Boolean) as string[];

  let secureUrl = dbUrl;

  for (const bucket of targetBuckets) {
    // 1. Virtual-hosted style: bucket.s3.region.amazonaws.com
    const virtualHostPattern = new RegExp(`${bucket}\\.s3[.-][a-z0-9-]+\\.amazonaws\\.com`, 'i');
    const virtualHostGeneric = new RegExp(`${bucket}\\.s3\\.amazonaws\\.com`, 'i');
    
    // 2. Path-style: s3.amazonaws.com/bucket
    const pathStylePattern = new RegExp(`s3[.-][a-z0-9-]+\\.amazonaws\\.com/${bucket}`, 'i');
    const pathStyleGeneric = new RegExp(`s3\\.amazonaws\\.com/${bucket}`, 'i');

    if (virtualHostPattern.test(secureUrl)) {
      secureUrl = secureUrl.replace(virtualHostPattern, cfDomain);
    } else if (virtualHostGeneric.test(secureUrl)) {
      secureUrl = secureUrl.replace(virtualHostGeneric, cfDomain);
    } else if (pathStylePattern.test(secureUrl)) {
      secureUrl = secureUrl.replace(pathStylePattern, cfDomain);
    } else if (pathStyleGeneric.test(secureUrl)) {
      secureUrl = secureUrl.replace(pathStyleGeneric, cfDomain);
    }
  }

  return secureUrl;
}
