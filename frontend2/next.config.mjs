/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        { source: '/api/health',  destination: 'http://localhost:8000/health' },
        { source: '/api/analyze', destination: 'http://localhost:8000/analyze' },
      ];
    }
    return [];
  },
};

export default nextConfig;
