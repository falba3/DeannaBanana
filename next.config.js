/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'deanna-banana-main-bananabucketdev.s3.us-east-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'poloselcapote.com',
      },
      {
        protocol: 'https',
        hostname: 'www.deanna2u.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          // { key: "Access-Control-Allow-Credentials", value: "true" }, // Removed as it conflicts with Access-Control-Allow-Origin: "*"
          { key: "Access-Control-Allow-Origin", value: "*" }, // Adjust this to specific domains in production
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  }
};

export default nextConfig