import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  domains: ['images.unsplash.com', 'res.cloudinary.com'],
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
};

export default nextConfig;
