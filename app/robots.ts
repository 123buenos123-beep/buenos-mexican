export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/private/',
    },
    sitemap: 'https://buenosmexicanrestaurant.com/sitemap.xml',
  }
}
