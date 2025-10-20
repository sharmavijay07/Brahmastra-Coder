/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    productionBrowserSourceMaps: false,
    images: {
        unoptimized: true,
    },
    webpack: (config, { isServer }) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
        };

        return config;
    },

    // ✅ Ensures Next.js generates correct .vercel/output
    output: 'standalone',
    experimental: {
        outputFileTracingIncludes: {
            '*': ['./public/**/*'],
        },
    },
};

module.exports = nextConfig;
