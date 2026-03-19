/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  transpilePackages: ['@mavis/db', '@mavis/types', '@mavis/config']
}

export default nextConfig
