/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
      forceSwcTransforms: false
    },
    images: {
      domains: ['example.com'], // Add your image domains here
    }
  }
  
  export default nextConfig