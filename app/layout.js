import './globals.css';
import DynamicBackground from '@/components/DynamicBackground';
import ClientEffects from '@/components/ClientEffects';
import MotionProvider from '@/components/MotionProvider';
import { Alfa_Slab_One, Bree_Serif, Montserrat } from 'next/font/google';

const alfaSlabOne = Alfa_Slab_One({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-alfa'
});

const breeSerif = Bree_Serif({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bree'
});

const montserrat = Montserrat({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-montserrat'
});


export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata = {
  title: 'Buenos Mexican Restaurant | Best Mexican Food in Pattaya',
  description: 'The best Buenos Mexican Restaurant in Pattaya, serving authentic Mexican cuisine. Enjoy delicious tacos, burritos, and margaritas in the heart of Chon Buri.',
  metadataBase: new URL('https://buenosmexicanrestaurant.com'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    siteName: 'Buenos Mexican Cuisine',
    url: 'https://buenosmexicanrestaurant.com',
    title: 'Buenos Mexican Restaurant | Best Mexican Food in Pattaya',
    description: 'The best Buenos Mexican Restaurant in Pattaya, serving authentic Mexican cuisine. Enjoy delicious tacos, burritos, and margaritas in the heart of Chon Buri.',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'A traditional Mexican platter at Buenos Mexican Cuisine, Pattaya',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buenos Mexican Restaurant | Best Mexican Food in Pattaya',
    description: 'Authentic Mexican cuisine in Pattaya — tacos, burritos, margaritas & more.',
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    'name': 'Buenos Mexican Cuisine',
    'image': 'https://buenosmexicanrestaurant.com/images/platillos.webp',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': 'Jomtien Complex, 413/9-10 Thappraya Rd',
      'addressLocality': 'Pattaya City',
      'addressRegion': 'Chon Buri',
      'postalCode': '20150',
      'addressCountry': 'TH'
    },
    'url': 'https://buenosmexicanrestaurant.com',
    'telephone': '065 236 2316',
    'openingHoursSpecification': [
      {
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        'opens': '17:00',
        'closes': '00:30'
      }
    ],
    'menu': 'https://buenosmexicanrestaurant.com/menu',
    'servesCuisine': 'Mexican'
  };

  return (
    <html lang="en" suppressHydrationWarning className={`${alfaSlabOne.variable} ${breeSerif.variable} ${montserrat.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ClientEffects />
        <DynamicBackground />
        <MotionProvider>
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
