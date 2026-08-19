import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS || false;
const isVercel = process.env.VERCEL || false;

let repo = '';
if (isGithubActions && !isVercel) {
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || '';
  if (repoName) {
    repo = `/${repoName}`;
  }
}

const nextConfig: NextConfig = {
  // Only static export for GitHub Pages — Vercel needs dynamic for API routes
  ...(isGithubActions && !isVercel ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
  },
  ...(repo ? { basePath: repo, assetPrefix: repo } : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: repo,
  },
};

export default nextConfig;
