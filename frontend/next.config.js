/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Optimize build and reduce upload size
    swcMinify: true,
    productionBrowserSourceMaps: false,

    // Prevent image optimization issues on Vercel
    images: {
        unoptimized: true,
    },

    // Transpile Monaco packages
    transpilePackages: ['monaco-editor', '@monaco-editor/react'],

    // Improve Vercel serverless tracing
    outputFileTracing: true,

    webpack: (config, { isServer }) => {
        // Prevent Monaco from being bundled into serverless functions
        if (isServer) {
            config.externals.push('monaco-editor');
        }

        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
        };

        // Optimize Monaco Editor for client-side
        if (!isServer) {
            config.resolve.alias = {
                ...config.resolve.alias,
                'monaco-editor': 'monaco-editor/esm/vs/editor/editor.api',
            };
        }

        return config;
    },
};

module.exports = nextConfig;
