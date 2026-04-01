import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["@knowledgeview/kg-core"],
};

export default nextConfig;
