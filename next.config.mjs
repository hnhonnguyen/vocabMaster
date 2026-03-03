/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use standalone output only for Docker deployments
  // For Vercel, remove 'standalone' as it uses serverless functions
  ...(process.env.DEPLOYMENT_TARGET === 'docker' ? { output: 'standalone' } : {}),
  
  // Exclude native modules from webpack bundling
  webpack: (config, { isServer }) => {
    if (isServer) {
      // For Vercel/Supabase: only need pg
      // SQLite and MySQL not needed for cloud deployment
      config.externals = [...(config.externals || []), 'better-sqlite3', 'pg', 'mysql2'];
    }
    return config;
  },

  // Vercel-specific optimizations
  experimental: {
    // Optimize serverless function cold starts
    serverComponentsExternalPackages: ['pg'],
  },
}

export default nextConfig
