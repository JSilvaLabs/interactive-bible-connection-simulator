/** @type {import('next').NextConfig} */
const repoName = 'interactive-bible-connection-simulator';
const isGithubActions = process.env.GITHUB_ACTIONS || false;

let assetPrefix = '/';
let basePath = '';

// This logic SHOULD be active for deployment
if (isGithubActions) {
  assetPrefix = `/${repoName}/`;
  basePath = `/${repoName}`;
} else {
  // Ensure these are set for manual deployment to subdirectory
  assetPrefix = `/${repoName}/`;
  basePath = `/${repoName}`;
}

const nextConfig = {
  output: 'export',
  basePath: basePath,     // Should be active and set
  assetPrefix: assetPrefix, // Should be active and set
  images: { unoptimized: true },
};

module.exports = nextConfig;