/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Optimize for production build
    swcMinify: true,
    // Reduce build output
    output: 'standalone',
    // Optimize images
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

        // Optimize Monaco Editor
        if (!isServer) {
            config.resolve.alias = {
                ...config.resolve.alias,
                'monaco-editor': 'monaco-editor/esm/vs/editor/editor.api',
            };
        }

        return config;
    },
    // Increase build timeout for Vercel
    experimental: {
        outputFileTracingExcludes: {
            '*': [
                'node_modules/@swc/core-linux-x64-gnu',
                'node_modules/@swc/core-linux-x64-musl',
                'node_modules/@esbuild/linux-x64',
            ],
        },
    },
}

module.exports = nextConfig
