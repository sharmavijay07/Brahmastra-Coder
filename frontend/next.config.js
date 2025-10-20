/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    productionBrowserSourceMaps: false,
    images: {
        unoptimized: true,
    },
    trailingSlash: true,
    webpack: (config, { isServer }) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
        };

        return config;
    },
    // Use static export to deploy as a purely static site on Vercel
    output: 'export',
};

module.exports = nextConfig;
