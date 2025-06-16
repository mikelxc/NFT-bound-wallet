/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Ignore optional dependencies that aren't needed in browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'pino-pretty': false,
    };
    
    // Add externals for optional pino dependencies
    config.externals = config.externals || [];
    config.externals.push({
      'pino-pretty': 'commonjs pino-pretty',
    });
    
    return config;
  },
}

export default nextConfig