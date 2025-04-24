/** @type {import('next').NextConfig} */
const repoName = 'interactive-bible-connection-simulator'; // Define your repo name here
const isGithubActions = process.env.GITHUB_ACTIONS || false;

let assetPrefix = '/';
let basePath = '';

// If deploying via Github Actions to the subdirectory, configure basePath and assetPrefix
if (isGithubActions) {
  // trim off `<owner>/`
  // const repo = process.env.GITHUB_REPOSITORY.replace(/.*?\//, ''); // Not needed if using repoName variable
  assetPrefix = `/${repoName}/`;
  basePath = `/${repoName}`;
} else {
   // If deploying manually AND to a subdirectory, uncomment and set these:
   // assetPrefix = `/${repoName}/`;
   // basePath = `/${repoName}`;
   // NOTE: If deploying manually to the root (username.github.io), keep these commented out or empty.
   // FOR MANUAL DEPLOYMENT TO SUBDIRECTORY (like this case), set them:
   assetPrefix = `/${repoName}/`;
   basePath = `/${repoName}`;
}

const nextConfig = {
  output: 'export',
  basePath: `/${repoName}`,     // Should be /interactive-bible-connection-simulator
  assetPrefix: `/${repoName}/`, // Should be /interactive-bible-connection-simulator
  images: { unoptimized: true, },
};

module.exports = nextConfig;