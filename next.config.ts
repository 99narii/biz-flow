import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  sassOptions: {
    silenceDeprecations: ["legacy-js-api"],
  },
};

export default nextConfig;
