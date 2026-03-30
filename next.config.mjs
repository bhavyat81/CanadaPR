/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Required for Capacitor: makes all asset paths relative so they resolve
  // correctly under the capacitor://localhost scheme on iOS/Android.
  assetPrefix: './',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
