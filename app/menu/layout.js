export const metadata = {
  title: 'Menu | Buenos Mexican Restaurant Pattaya',
  description: 'Explore the full menu of Buenos Mexican Restaurant in Pattaya. We serve authentic Mexican cuisine, including street tacos, burritos, and signature platillos.',
  alternates: {
    canonical: '/menu',
  },
  openGraph: {
    type: 'website',
    siteName: 'Buenos Mexican Cuisine',
    url: 'https://buenosmexicanrestaurant.com/menu',
    title: 'Menu | Buenos Mexican Restaurant Pattaya',
    description: 'Explore the full menu of Buenos Mexican Restaurant in Pattaya — street tacos, burritos, and signature platillos.',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'The menu at Buenos Mexican Cuisine, Pattaya',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Menu | Buenos Mexican Restaurant Pattaya',
    description: 'Explore the full menu — street tacos, burritos, and signature platillos.',
    images: ['/og-image.jpg'],
  },
};

export default function MenuLayout({ children }) {
  return <>{children}</>;
}
