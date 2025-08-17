/** @type {import('next').NextConfig} */
const nextConfig = {
  // Other config options...
  
  async redirects() {
    return [
      // Example: if you need to redirect old slugs to new ones
      // {
      //   source: '/design/old-slug-name',
      //   destination: '/design/new-slug-name',
      //   permanent: true, // 301 redirect for SEO
      // },
    ]
  },
}

module.exports = nextConfig