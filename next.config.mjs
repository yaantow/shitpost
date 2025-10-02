/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ishitpost.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ishitpost.s3.us-east-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
      unoptimized: true,
  },
}

export default nextConfig
