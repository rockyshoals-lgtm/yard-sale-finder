import type { Sale } from '../types';

// Generates fake sales around a given center point for demo/testing
function randomOffset(range: number): number {
  return (Math.random() - 0.5) * range * 2;
}

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSubset<T>(arr: T[], min: number, max: number): T[] {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const SALE_TITLES = [
  'Huge Moving Sale — Everything Must Go!',
  'Multi-Family Yard Sale',
  'Estate Sale — Vintage & Antiques',
  'Spring Cleaning Blowout',
  'Kids Outgrown Everything Sale',
  'Downsizing Sale — 40 Years of Stuff',
  'Garage Cleanout — Tools & More',
  'Neighborhood Block Sale (5 Houses!)',
  'College Student Moving Out Sale',
  'Retired Couple — Quality Items',
  'Vinyl, Books & Vintage Finds',
  'Furniture & Home Decor Sale',
  'Sports Equipment & Outdoor Gear',
  'Electronics & Gadgets Clearout',
  'Art, Crafts & Collectibles Sale',
  'Kitchen Renovation — All Appliances Go!',
  'Back-to-School Clearance',
  'Mid-Century Modern Collection',
  'Baby & Toddler Mega Sale',
  'Workshop Liquidation — Power Tools',
];

const DESCRIPTIONS = [
  'Tons of quality items priced to sell. No early birds please!',
  'Everything from furniture to clothes to kitchenware. Cash only.',
  'Decades of treasures — come find something special!',
  'All items in great condition. Prices negotiable after 10am.',
  'Rain or shine — garage sale under cover. Plenty of parking.',
  'Something for everyone! Bring your truck for the big stuff.',
  'Priced to sell fast. Come early for best picks!',
  'Quality over quantity. Mostly like-new or gently used items.',
  'Free lemonade while you browse! Family friendly.',
  'Accepting cash, Venmo, and Zelle. No checks.',
];

const ADDRESSES = [
  { address: '1234 Oak Street', city: 'Portland', state: 'OR', zip: '97201' },
  { address: '567 Maple Avenue', city: 'Portland', state: 'OR', zip: '97214' },
  { address: '890 Pine Road', city: 'Seattle', state: 'WA', zip: '98101' },
  { address: '2345 Elm Drive', city: 'Austin', state: 'TX', zip: '78701' },
  { address: '678 Cedar Lane', city: 'Denver', state: 'CO', zip: '80202' },
  { address: '910 Birch Court', city: 'Nashville', state: 'TN', zip: '37201' },
  { address: '1122 Walnut Blvd', city: 'Boise', state: 'ID', zip: '83702' },
  { address: '3344 Spruce Way', city: 'Phoenix', state: 'AZ', zip: '85001' },
  { address: '5566 Cherry Circle', city: 'Raleigh', state: 'NC', zip: '27601' },
  { address: '7788 Aspen Place', city: 'Minneapolis', state: 'MN', zip: '55401' },
];

const CATEGORIES_POOL = [
  'furniture', 'tools', 'kids', 'electronics', 'clothing',
  'collectibles', 'books', 'sports', 'garden', 'kitchen',
  'vintage', 'art', 'auto', 'music', 'other',
] as const;

const TAGS_POOL = [
  'vinyl records', 'power tools', 'mid-century', 'baby clothes',
  'designer bags', 'fishing gear', 'camping', 'comic books',
  'antique furniture', 'crystal', 'cast iron', 'christmas decorations',
  'board games', 'bikes', 'legos', 'pottery', 'jewelry',
  'guitar', 'sewing machine', 'records', 'art prints',
];

const PHOTO_URLS = [
  'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1531685250784-7569952593d2?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=300&fit=crop',
];

export function generateFakeSales(centerLat: number, centerLng: number, count: number = 30): Sale[] {
  const now = new Date();
  const sales: Sale[] = [];

  for (let i = 0; i < count; i++) {
    const addr = randomFromArray(ADDRESSES);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 7)); // next 7 days
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (Math.random() > 0.5 ? 1 : 0)); // 1-2 days

    const isFeatured = Math.random() < 0.15; // 15% featured

    sales.push({
      id: `sale_${i + 1}_${Date.now()}`,
      sellerId: `user_${Math.floor(Math.random() * 100)}`,
      title: randomFromArray(SALE_TITLES),
      description: randomFromArray(DESCRIPTIONS),
      location: {
        latitude: centerLat + randomOffset(0.05), // ~3-5 mile radius
        longitude: centerLng + randomOffset(0.07),
      },
      address: addr.address,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zip,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      startTime: randomFromArray(['07:00', '08:00', '09:00']),
      endTime: randomFromArray(['13:00', '14:00', '15:00', '16:00']),
      categories: randomSubset([...CATEGORIES_POOL], 1, 4) as any,
      tags: randomSubset(TAGS_POOL, 2, 6),
      photos: randomSubset(PHOTO_URLS, 1, 4),
      isFeatured,
      isActive: true,
      viewCount: Math.floor(Math.random() * 200),
      saveCount: Math.floor(Math.random() * 50),
      visitCount: Math.floor(Math.random() * 30),
      rating: Math.round((3 + Math.random() * 2) * 10) / 10,
      ratingCount: Math.floor(Math.random() * 20),
      createdAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  return sales.sort((a, b) => {
    // Featured first, then by distance (approximated by creation order)
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return 0;
  });
}

// Pre-generated demo data centered on Portland, OR
export const FAKE_SALES = generateFakeSales(45.5152, -122.6784, 30);
