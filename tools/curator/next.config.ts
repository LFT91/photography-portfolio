import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dir, "../..");
const src = path.join(repoRoot, "src");

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
  agentRules: false,
  turbopack: {
    root: repoRoot,
    resolveAlias: {
      "@": src,
    },
  },
};

export default nextConfig;
