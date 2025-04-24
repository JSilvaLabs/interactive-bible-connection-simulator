// next.config.js (Temporary Dev Fix)

/** @type {import('next').NextConfig} */
const repoName = 'interactive-bible-connection-simulator';
const isGithubActions = process.env.GITHUB_ACTIONS || false;

let assetPrefix = '/';
let basePath = ''; // Temporarily disable for dev

// Commenting out the basePath logic for local dev server

if (isGithubActions) {
  assetPrefix = `/${repoName}/`;
  basePath = `/${repoName}`;
} else {
  assetPrefix = `/${repoName}/`;
  basePath = `/${repoName}`;
}


const nextConfig = {
  output: 'export',
  basePath: basePath,     // Temporarily disabled
  assetPrefix: assetPrefix, // Temporarily disabled (assetPrefix usually matters less for dev)
  images: { unoptimized: true },
};

module.exports = nextConfig;