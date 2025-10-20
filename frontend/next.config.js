/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Optimize for production build
    swcMinify: true,
    // Optimize images
    images: {
        unoptimized: true,
    },
    transpilePackages: ['monaco-editor', '@monaco-editor/react'],
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
}

module.exports = nextConfig
