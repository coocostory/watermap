/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_ADMIN_MODE: process.env.ADMIN_MODE || "false",
    NEXT_PUBLIC_MAP_CENTER_LAT: process.env.MAP_CENTER_LAT || "29.5647",
    NEXT_PUBLIC_MAP_CENTER_LNG: process.env.MAP_CENTER_LNG || "106.5885",
    NEXT_PUBLIC_MAP_DEFAULT_ZOOM: process.env.MAP_DEFAULT_ZOOM || "12",
  },
};

module.exports = nextConfig;
