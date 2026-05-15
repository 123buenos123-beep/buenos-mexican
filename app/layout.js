import './globals.css';
import DynamicBackground from '@/components/DynamicBackground';



export const metadata = {
  title: 'Buenos Mexican Restaurant | Best Mexican Food in Pattaya',
  description: 'The best Buenos Mexican Restaurant in Pattaya, serving authentic Mexican cuisine. Enjoy delicious tacos, burritos, and margaritas in the heart of Chon Buri.',
  metadataBase: new URL('https://buenosmexican.com'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    'name': 'Buenos Mexican Cuisine',
    'image': 'https://buenosmexican.com/images/platillos.webp',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': 'Jomtien Complex, 413/9-10 Thappraya Rd',
      'addressLocality': 'Pattaya City',
      'addressRegion': 'Chon Buri',
      'postalCode': '20150',
      'addressCountry': 'TH'
    },
    'url': 'https://buenosmexican.com',
    'telephone': '065 236 2316',
    'openingHoursSpecification': [
      {
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        'opens': '17:00',
        'closes': '00:30'
      }
    ],
    'menu': 'https://buenosmexican.com/menu',
    'servesCuisine': 'Mexican'
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <DynamicBackground />
        {children}
      </body>
    </html>
  );
}
