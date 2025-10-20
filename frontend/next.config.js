/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    productionBrowserSourceMaps: false,
    images: {
        unoptimized: true,
    },
    transpilePackages: ['@monaco-editor/react'],

    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.alias = {
                ...config.resolve.alias,
                'monaco-editor': 'monaco-editor/esm/vs/editor/editor.api'
            };
        }

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
