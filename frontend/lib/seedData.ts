import { Event, Product } from "./api";

// Helper to get a future date
const getFutureDate = (daysToAdd: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString();
};

export const SEED_EVENTS: Event[] = [
  {
    id: 1001,
    promoter_id: 99,
    title: "Kappa Centennial Gala",
    description: "Join us for an evening of elegance and celebration as we honor 100 years of achievement. Black tie affair featuring live jazz, awards ceremony, and networking with brothers from across the nation.",
    event_date: getFutureDate(14),
    location: "Grand Hyatt Ballroom",
    city: "Chicago",
    state: "IL",
    image_url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop",
    sponsored_chapter_id: 1,
    event_type_id: 1,
    event_audience_type_id: 1,
    all_day: false,
    duration_minutes: 240,
    event_link: "https://example.com/gala",
    is_featured: true,
    featured_payment_status: "PAID",
    stripe_payment_intent_id: "pi_mock_123",
    ticket_price_cents: 7500,
    dress_codes: ["formal"], // Simplified for TS safety if enum is strict
    dress_code_notes: "Black Tie Strictly Enforced",
    status: "ACTIVE",
    promoter_name: "Chicago Alumni Chapter",
    chapter_name: "Chicago Alumni",
    event_audience_type_description: "Public",
  },
  {
    id: 1002,
    promoter_id: 99,
    title: "Community Charity 5K Run",
    description: "Annual charity run supporting local youth education programs. Participation open to all ages. Registration includes t-shirt and post-run refreshments.",
    event_date: getFutureDate(7),
    location: "Piedmont Park",
    city: "Atlanta",
    state: "GA",
    image_url: "https://images.unsplash.com/photo-1552674605-5d226a5be380?q=80&w=2120&auto=format&fit=crop",
    sponsored_chapter_id: 2,
    event_type_id: 3,
    event_audience_type_id: 1,
    all_day: false,
    duration_minutes: 180,
    event_link: null,
    is_featured: true,
    featured_payment_status: "PAID",
    stripe_payment_intent_id: "pi_mock_124",
    ticket_price_cents: 2500,
    dress_codes: ["athletic", "outdoor"],
    dress_code_notes: "Comfortable running shoes recommended",
    status: "ACTIVE",
    promoter_name: "Atlanta Alumni Chapter",
    chapter_name: "Atlanta Alumni",
    event_audience_type_description: "Public",
  },
  {
    id: 1003,
    promoter_id: 100,
    title: "Nupe Night Mixer",
    description: "A casual networking mixer for brothers and guests. Come enjoy great food, music, and brotherly vibes at The Lounge.",
    event_date: getFutureDate(3),
    location: "The Downtown Lounge",
    city: "Houston",
    state: "TX",
    image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=2070&auto=format&fit=crop",
    sponsored_chapter_id: 3,
    event_type_id: 2,
    event_audience_type_id: 1,
    all_day: false,
    duration_minutes: 240,
    event_link: null,
    is_featured: false,
    featured_payment_status: "UNPAID",
    stripe_payment_intent_id: null,
    ticket_price_cents: 0,
    dress_codes: ["business_casual", "kappa_casual"],
    dress_code_notes: "Smart casual",
    status: "ACTIVE",
    promoter_name: "Houston Alumni Chapter",
    chapter_name: "Houston Alumni",
    event_audience_type_description: "Public",
  },
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: 2001,
    seller_id: 101,
    name: "Classic Crimson Hoodie",
    description: "Premium quality cotton hoodie featuring embroidered fraternity crest. Perfect for chilly evenings on the yard or casual wear. Unisex fit, available in sizes S-XXL.",
    price_cents: 4500,
    image_url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1974&auto=format&fit=crop",
    category_id: 1,
    category_name: "Apparel",
    is_kappa_branded: true,
    seller_name: "Chapter Made",
    seller_business_name: "Brother Michael's Nupe Collection",
    seller_status: "APPROVED",
    is_fraternity_member: true,
    is_seller: true,
    attributes: [
      { 
        id: 1, product_id: 2001, attribute_definition_id: 1, 
        value_text: "Cotton", value_number: null, value_boolean: null, created_at: new Date().toISOString() 
      }
    ]
  },
  {
    id: 2002,
    seller_id: 101,
    name: "Diamond Knit Beanie",
    description: "Keep warm in style with this crimson and cream knit beanie. Features a subtle diamond pattern and cuffed brim. One size fits most.",
    price_cents: 2000,
    image_url: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab5?q=80&w=1974&auto=format&fit=crop",
    category_id: 1,
    category_name: "Accessories",
    is_kappa_branded: true,
    seller_name: "Chapter Made",
    seller_business_name: "Brother Michael's Nupe Collection",
    seller_status: "APPROVED",
    is_fraternity_member: true,
    is_seller: true,
  },
  {
    id: 2003,
    seller_id: 102,
    name: "Vintage 1911 Tee",
    description: "Celebrate history with this vintage-inspired 1911 graphic t-shirt. Soft tri-blend fabric ensures comfort and durability. A must-have for every wardrobe.",
    price_cents: 2500,
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2000&auto=format&fit=crop",
    category_id: 1,
    category_name: "Apparel",
    is_kappa_branded: true,
    seller_name: "Brother David",
    seller_business_name: "Legacy Fine Goods",
    seller_status: "APPROVED",
    is_fraternity_member: true,
    is_seller: true,
  },
  {
    id: 2004,
    seller_id: 103,
    name: "Executive Leather Portfolio",
    description: "Handcrafted leather portfolio with embossed insignia. Includes notepad holder, card slots, and pen loop. Ideal for meetings and conferences.",
    price_cents: 8500,
    image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1964&auto=format&fit=crop",
    category_id: 2,
    category_name: "Office",
    is_kappa_branded: false,
    seller_name: "Brother James",
    seller_business_name: "Nupe Outfitters",
    seller_status: "APPROVED",
    is_fraternity_member: true,
    is_seller: true,
  }
];

export const SEED_STEWARDS: any[] = [
  {
    id: 3001,
    steward_id: 10,
    name: "Vintage Kappa Cane (1990s)",
    description: "Beautifully preserved vintage cane from the 90s. Hand-carved handle with intricate diamond detailing. A true collector's piece for any Nupe's den.",
    image_url: "https://images.unsplash.com/photo-1629215082875-c5332c020d82?q=80&w=1964&auto=format&fit=crop", // Placeholder cane/stick image
    shipping_cost_cents: 1500,
    chapter_donation_cents: 5000,
    sponsoring_chapter_id: 1,
    category_id: 1, // Apparel/Accessories
    status: "ACTIVE",
    steward: {
      id: 10,
      fraternity_member_id: 101,
      sponsoring_chapter_id: 1,
      status: "APPROVED",
      member: {
        id: 101,
        name: "Brother Michael",
        email: "michael@example.com"
      }
    },
    chapter: {
      id: 1,
      name: "Chicago Alumni"
    },
    can_claim: true
  },
  {
    id: 3002,
    steward_id: 11,
    name: "Centennial Celebration Pin",
    description: "Authentic pin from the 2011 Centennial Conclave. Mint condition in original packaging. Rare find.",
    image_url: "https://images.unsplash.com/photo-1615655114865-4cc1bda5901e?q=80&w=2664&auto=format&fit=crop", // Placeholder pin/jewelry image
    shipping_cost_cents: 500,
    chapter_donation_cents: 2000,
    sponsoring_chapter_id: 1,
    category_id: 1,
    status: "ACTIVE",
    steward: {
      id: 11,
      fraternity_member_id: 102,
      sponsoring_chapter_id: 1,
      status: "APPROVED",
      member: {
        id: 102,
        name: "Brother David",
        email: "david@example.com"
      }
    },
    chapter: {
      id: 1,
      name: "Chicago Alumni"
    },
    can_claim: true
  },
  {
    id: 3003,
    steward_id: 12,
    name: "Custom Crimson Blazer (42R)",
    description: "Gently worn custom blazer with embroidered crest. Perfect for chapter meetings and events. Freshly dry cleaned.",
    image_url: "https://images.unsplash.com/photo-1593032465175-d8120147676d?q=80&w=2070&auto=format&fit=crop", // Placeholder blazer/suit image
    shipping_cost_cents: 1200,
    chapter_donation_cents: 7500,
    sponsoring_chapter_id: 2,
    category_id: 1,
    status: "ACTIVE",
    steward: {
      id: 12,
      fraternity_member_id: 103,
      sponsoring_chapter_id: 2,
      status: "APPROVED",
      member: {
        id: 103,
        name: "Brother James",
        email: "james@example.com"
      }
    },
    chapter: {
      id: 2,
      name: "Atlanta Alumni"
    },
    can_claim: true
  }
];

export const SEED_FEATURED_BROTHERS: any[] = [
  {
    id: 101,
    name: "Brother Michael",
    business_name: "Brother Michael's Nupe Collection",
    headshot_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop",
    sponsoring_chapter_id: 1,
    chapter_name: "Chicago Alumni",
    social_links: {},
    website: null,
    product_count: 5,
    is_member: true,
    is_seller: true,
    is_promoter: false,
    is_steward: false,
    fraternity_member_id: 101,
    initiated_chapter_id: 1,
    initiated_season: "Spring",
    initiated_year: 1990
  },
  {
    id: 102,
    name: "Brother David",
    business_name: "Legacy Fine Goods",
    headshot_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1974&auto=format&fit=crop",
    sponsoring_chapter_id: 1,
    chapter_name: "Chicago Alumni",
    social_links: {},
    website: null,
    product_count: 3,
    is_member: true,
    is_seller: true,
    fraternity_member_id: 102,
    initiated_chapter_id: 1,
    initiated_season: "Fall",
    initiated_year: 2005
  },
  {
    id: 103,
    name: "Brother James",
    business_name: "Nupe Outfitters",
    headshot_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1976&auto=format&fit=crop",
    sponsoring_chapter_id: 2,
    chapter_name: "Atlanta Alumni",
    social_links: {},
    website: null,
    product_count: 8,
    is_member: true,
    is_seller: true,
    fraternity_member_id: 103,
    initiated_chapter_id: 2,
    initiated_season: "Spring",
    initiated_year: 2010
  }
];
