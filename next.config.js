/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'avatars.githubusercontent.com', 'pbs.twimg.com'],
  },
  // Ensure assets are served correctly on network
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  // Exclude reference-globe directory from build
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/reference-globe/**', '**/node_modules/**'],
    }
    return config
  },
}

module.exports = nextConfig

