// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        port: '',
        pathname: '/maps/api/place/photo',
      },
      {
        protocol: 'https',
        hostname: 'your-other-image-source.com',
        port: '',
        pathname: '/path-to-images/*',
      },
    ],
  },
}

export default nextConfig;
