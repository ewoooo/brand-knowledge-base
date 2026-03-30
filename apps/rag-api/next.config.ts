import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@knowledgeview/kg-core",
    "@knowledgeview/graph-rag",
  ],
};

export default nextConfig;
