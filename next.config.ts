import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS || false;

let repo = '';
if (isGithubActions) {
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || '';
  if (repoName) {
    repo = `/${repoName}`;
  }
}

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  ...(repo ? { basePath: repo, assetPrefix: repo } : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: repo,
  },
};

export default nextConfig;
