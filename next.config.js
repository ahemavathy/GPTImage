/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.openai.azure.com',
      },
      {
        protocol: 'https',
        hostname: '*.blob.core.windows.net',
      },
    ],
  },
}

module.exports = nextConfig
