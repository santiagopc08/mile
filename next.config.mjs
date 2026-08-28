import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  webpack: (config) => {
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      ...(config.resolve.modules || ['node_modules']),
    ];
    return config;
  },
  outputFileTracingExcludes: {
    '*': [
      './platform/**/*',
      './arcade-engine/**/*',
      './test-results/**/*',
    ],
  },
};

export default nextConfig;
