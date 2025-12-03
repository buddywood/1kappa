import pool from "./connection";
import {
  createPromoter,
  createProduct,
  createSeller,
  getAllChapters,
  createEvent,
  getAllProductCategories,
  createSteward,
  updateStewardStatus,
  createUser,
} from "./queries-sequelize";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env.local") });

// Helper function to generate S3 URL
function getS3ImageUrl(key: string): string {
  const bucket = process.env.AWS_S3_BUCKET_NAME || "1kappa-uploads";
  const region = process.env.AWS_REGION || "us-east-1";
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

// Sample product data with category mappings - using real S3 images
const sampleProducts = [
  {
    name: "Kappa Alpha Psi Embroidered Polo",
    description:
      "Premium cotton polo shirt with embroidered Kappa Alpha Psi logo. Perfect for chapter events and casual wear. Available in multiple colors.",
    price_cents: 4500, // $45.00
    image_url: getS3ImageUrl(
      "products/4df62c41-fb96-45f1-bd10-58bfc2993d1a-kappashirt1a.png"
    ),
    category: "Apparel",
  },
  {
    name: "Founders' Day Commemorative Pin",
    description:
      "Limited edition commemorative pin celebrating the founding of Kappa Alpha Psi. Gold-plated with intricate detailing.",
    price_cents: 2500, // $25.00
    image_url: getS3ImageUrl(
      "products/415f672f-be3e-49c3-9bae-1213f1e2a7ab-sample_merch1.png"
    ),
    category: "Accessories",
  },
  {
    name: "Kappa Alpha Psi Custom Hoodie",
    description:
      "Comfortable fleece hoodie with screen-printed Kappa Alpha Psi design. Perfect for chilly chapter meetings and casual outings.",
    price_cents: 5500, // $55.00
    image_url: getS3ImageUrl(
      "products/2adf45a0-1908-4558-b1a9-876859099084-sample_merch2.png"
    ),
    category: "Outerwear",
  },
  {
    name: "Brotherhood T-Shirt Collection",
    description:
      "Set of 3 premium cotton t-shirts featuring different Kappa Alpha Psi designs. Great for everyday wear and chapter events.",
    price_cents: 3500, // $35.00
    image_url: getS3ImageUrl(
      "products/bc23755b-3c89-43a8-a679-299d6f2cb17f-kappashirt1b.png"
    ),
    category: "Apparel",
  },
  {
    name: "Kappa Alpha Psi Leather Wallet",
    description:
      "Genuine leather wallet with embossed Kappa Alpha Psi letters. Features multiple card slots and cash compartment.",
    price_cents: 4500, // $45.00
    image_url: getS3ImageUrl(
      "products/364752d7-3cf6-413c-a1c3-83c3feb960c2-sample_merch3.png"
    ),
    category: "Accessories",
  },
  {
    name: "Chapter Custom Coffee Mug",
    description:
      "Ceramic coffee mug with custom chapter name and Kappa Alpha Psi logo. Microwave and dishwasher safe.",
    price_cents: 1800, // $18.00
    image_url: getS3ImageUrl(
      "products/21fc876b-3112-4053-b797-c25b1be0ed0b-sample_merch4.png"
    ),
    category: "Home Goods",
  },
  {
    name: "Kappa Alpha Psi Baseball Cap",
    description:
      "Adjustable snapback cap with embroidered Kappa Alpha Psi logo. One size fits all. Perfect for outdoor events.",
    price_cents: 2800, // $28.00
    image_url: getS3ImageUrl(
      "products/778772a1-9394-442c-b699-743b171a2341-sample_merch5.png"
    ),
    category: "Accessories",
  },
  {
    name: "Founders' Day Tie",
    description:
      "Elegant silk tie featuring Kappa Alpha Psi colors and subtle pattern. Perfect for formal chapter events and banquets.",
    price_cents: 3800, // $38.00
    image_url: getS3ImageUrl(
      "products/8d9c7579-f998-416c-b843-1c3b3b3a211d-kappa-cigar1b.png"
    ),
    category: "Apparel",
  },
  {
    name: "Kappa Alpha Psi Tote Bag",
    description:
      "Durable canvas tote bag with screen-printed Kappa Alpha Psi design. Perfect for carrying books, gym gear, or groceries.",
    price_cents: 2200, // $22.00
    image_url: getS3ImageUrl(
      "products/d1c87439-5397-46bd-bf6a-b26916d91fc1-kappa-cigar1a.png"
    ),
    category: "Accessories",
  },
  {
    name: "Chapter Custom Water Bottle",
    description:
      "Stainless steel insulated water bottle with custom chapter engraving. Keeps drinks cold for 24 hours or hot for 12 hours.",
    price_cents: 3200, // $32.00
    image_url: getS3ImageUrl(
      "products/5dfb4bfb-8fbf-4be4-a478-88e4d3a85af6-sample_merch1.png"
    ),
    category: "Accessories",
  },
  {
    name: "Kappa Alpha Psi Keychain",
    description:
      "Brass keychain with engraved Kappa Alpha Psi letters. Makes a great gift for brothers or pledges.",
    price_cents: 1200, // $12.00
    image_url: getS3ImageUrl(
      "products/740f56e0-146e-4025-975e-6fa596bc5fd7-sample_merch3.png"
    ),
    category: "Accessories",
  },
  {
    name: "Brotherhood Custom Stickers Pack",
    description:
      "Set of 20 vinyl stickers featuring various Kappa Alpha Psi designs. Waterproof and weather-resistant.",
    price_cents: 1500, // $15.00
    image_url: getS3ImageUrl(
      "products/84ede5d7-4eb6-4857-8513-b4503793b107-sample_merch4.png"
    ),
    category: "Accessories",
  },
  {
    name: "Kappa Alpha Psi Phone Case",
    description:
      "Protective phone case with Kappa Alpha Psi logo. Compatible with iPhone and Samsung models. Available in multiple colors.",
    price_cents: 2500, // $25.00
    image_url: getS3ImageUrl(
      "products/98884723-d334-436d-9cc1-6922f1503d73-sample_merch4.png"
    ),
    category: "Electronics",
  },
  {
    name: "Chapter Custom Notebook",
    description:
      "Premium leather-bound notebook with custom chapter name embossed on the cover. Perfect for taking notes at meetings.",
    price_cents: 2800, // $28.00
    image_url: getS3ImageUrl(
      "products/9a4e76ef-b57e-4f60-9a20-ac134f826db4-sample_merch2.png"
    ),
    category: "Books & Media",
  },
  {
    name: "Kappa Alpha Psi Laptop Sleeve",
    description:
      "Protective laptop sleeve with Kappa Alpha Psi design. Fits 13-15 inch laptops. Padded interior for extra protection.",
    price_cents: 4200, // $42.00
    image_url: getS3ImageUrl(
      "products/a97a52c2-eade-4454-8b1f-3ea000d48fbc-sample_merch1.png"
    ),
    category: "Electronics",
  },
  {
    name: "Founders' Day Commemorative Book",
    description:
      "Hardcover book chronicling the history of Kappa Alpha Psi. Includes photos, stories, and important milestones.",
    price_cents: 3500, // $35.00
    image_url: getS3ImageUrl(
      "products/ad290749-27e2-4cef-ac34-07ff090ce00e-sample_merch5.png"
    ),
    category: "Books & Media",
  },
  // Additional products for non-member sellers (non-kappa branded)
  {
    name: "Crimson & Cream Tote Bag",
    description:
      "Stylish canvas tote bag featuring Kappa Alpha Psi colors. Perfect for everyday use.",
    price_cents: 2800, // $28.00
    image_url: getS3ImageUrl(
      "products/c31ee9e9-9a55-4eb4-a9ec-35c1b68d6cbc-sample_merch3.png"
    ),
    category: "Accessories",
    seller_email: "buddy+seller2@ebilly.com", // Assign to non-member seller
    is_kappa_branded: false, // Not explicitly branded
  },
  {
    name: "Vintage Kappa Pin Collection",
    description:
      "Set of 5 vintage-style Kappa Alpha Psi pins. Collectible items perfect for display.",
    price_cents: 3200, // $32.00
    image_url: getS3ImageUrl(
      "products/c758379d-5ade-456c-bc6f-16d2c25fe3af-sample_merch5.png"
    ),
    category: "Accessories",
    seller_email: "buddy+seller2@ebilly.com",
    is_kappa_branded: true, // Has "Kappa" in name, so branded
  },
  {
    name: "Heritage Coffee Table Book",
    description:
      "Beautiful hardcover coffee table book showcasing Kappa Alpha Psi history and achievements.",
    price_cents: 4500, // $45.00
    image_url: getS3ImageUrl(
      "products/d090f4dd-36d8-425c-b4ba-ff47f244450c-sample_merch2.png"
    ),
    category: "Books & Media",
    seller_email: "buddy+seller2@ebilly.com", // Assign to non-member seller
    is_kappa_branded: true, // Mentions Kappa Alpha Psi
  },
  {
    name: "Custom Engraved Watch",
    description:
      "Elegant timepiece with custom Kappa Alpha Psi engraving. Perfect gift for special occasions.",
    price_cents: 8500, // $85.00
    image_url: getS3ImageUrl(
      "products/d1a90fcc-02ae-42ac-9d0e-ede81e745677-sample_merch1.png"
    ),
    category: "Accessories",
    seller_email: "buddy+seller2@ebilly.com",
  },
];

// Test users - using buddy+ email addresses only
const testUsers = {
  seller: {
    name: "Buddy Seller",
    email: "buddy+seller@ebilly.com",
    membership_number: "KAP-TEST-SELLER",
    business_name: "Kappa Gear Co.",
    kappa_vendor_id: "VL-TEST-SELLER",
    is_member: true,
  },
  sellerNonMember: {
    name: "Buddy Seller Non-Member",
    email: "buddy+seller2@ebilly.com",
    membership_number: null,
    business_name: "Crimson Threads",
    kappa_vendor_id: "VL-TEST-SELLER2",
    is_member: false,
  },
  promoter: {
    name: "Buddy Promoter",
    email: "buddy+promoter@ebilly.com",
    membership_number: "KAP-TEST-PROMOTER",
  },
  steward: {
    name: "Buddy Steward",
    email: "buddy+steward@ebilly.com",
    membership_number: "KAP-TEST-STEWARD",
  },
  member: {
    name: "Buddy Member",
    email: "buddy+member@ebilly.com",
    membership_number: "KAP-TEST-MEMBER",
  },
  guest: {
    name: "Buddy Guest",
    email: "buddy+guest@ebilly.com",
    membership_number: null, // Not a member
  },
};

// Sample sellers data - using buddy+ users
const sampleSellers = [
  {
    name: testUsers.seller.name,
    email: testUsers.seller.email,
    membership_number: testUsers.seller.membership_number,
    business_name: testUsers.seller.business_name,
    kappa_vendor_id: testUsers.seller.kappa_vendor_id,
    is_member: true,
    headshot_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    website: "https://kappagearco.example.com",
    social_links: {
      instagram: "@kappagearco",
      twitter: "@kappagearco",
      linkedin: "buddy-seller-kappa",
      website: "https://kappagearco.example.com",
    },
  },
  {
    name: testUsers.sellerNonMember.name,
    email: testUsers.sellerNonMember.email,
    membership_number: testUsers.sellerNonMember.membership_number,
    business_name: testUsers.sellerNonMember.business_name,
    kappa_vendor_id: testUsers.sellerNonMember.kappa_vendor_id,
    is_member: false,
    headshot_url:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    website: "https://crimsonthreads.example.com",
    social_links: {
      instagram: "@crimsonthreads",
      twitter: "@crimsonthreads",
      linkedin: "buddy-seller-nonmember",
      website: "https://crimsonthreads.example.com",
    },
  },
];

// Test promoters - using buddy+ users
const testPromoters = [
  {
    email: testUsers.promoter.email,
    name: testUsers.promoter.name,
    membership_number: testUsers.promoter.membership_number,
    initiated_season: "Fall",
    initiated_year: 2018,
    social_links: {
      instagram: "@buddypromoter",
      twitter: "@buddypromoter",
    },
    status: "APPROVED" as const,
  },
];

// Sample events data - using future dates
function getFutureDate(daysFromNow: number, hours: number = 18): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hours, 0, 0, 0);
  return date;
}

interface SampleEventData {
  title: string;
  description: string;
  event_date: Date;
  location: string;
  city: string | null;
  state: string | null;
  image_url: string | null;
  ticket_price_cents: number;
  event_type:
    | "social"
    | "philanthropy"
    | "professional"
    | "formal"
    | "sports"
    | "educational"
    | "community_service"
    | "alumni"
    | "other";
  event_audience_type: "all_members" | "chapter_specific" | "public";
  all_day?: boolean;
  duration_minutes?: number;
  event_link?: string | null;
  dress_codes?: Array<
    | "business"
    | "business_casual"
    | "formal"
    | "semi_formal"
    | "kappa_casual"
    | "greek_encouraged"
    | "greek_required"
    | "outdoor"
    | "athletic"
    | "comfortable"
    | "all_white"
  >;
  dress_code_notes?: string | null;
}

const sampleEvents: SampleEventData[] = [
  {
    title: "Founders' Day Banquet",
    description:
      "Join us for an elegant evening celebrating the founding of Kappa Alpha Psi. This formal event features dinner, guest speakers, and recognition of outstanding brothers. Black tie optional.",
    event_date: getFutureDate(15, 19),
    location: "Minneapolis Convention Center",
    city: "Minneapolis",
    state: "MN",
    image_url: getS3ImageUrl(
      "events/108e9cbe-981d-479e-a917-bd47a9749dcc-kevDaBarber.png"
    ),
    ticket_price_cents: 7500, // $75.00
    event_type: "social",
    event_audience_type: "all_members",
    all_day: false,
    duration_minutes: 240, // 4 hours
    dress_codes: ["formal", "semi_formal"],
    dress_code_notes: "Black tie optional. Tuxedos or formal suits preferred.",
  },
  {
    title: "Spring Brotherhood Mixer",
    description:
      "A casual networking event for brothers to connect, share experiences, and build stronger bonds. Light refreshments and music provided. All chapters welcome!",
    event_date: getFutureDate(30, 18),
    location: "St. Paul Event Center",
    city: "St. Paul",
    state: "MN",
    image_url: getS3ImageUrl(
      "events/108e9cbe-981d-479e-a917-bd47a9749dcc-kevDaBarber.png"
    ),
    ticket_price_cents: 2500, // $25.00
    event_type: "professional",
    event_audience_type: "all_members",
    all_day: false,
    duration_minutes: 180, // 3 hours
    dress_codes: ["business_casual", "kappa_casual"],
    dress_code_notes: "Kappa apparel encouraged but not required.",
  },
  {
    title: "Community Service Drive",
    description:
      "Join us for a day of giving back to our community. We'll be collecting donations, organizing food drives, and volunteering at local shelters. All brothers and friends welcome to participate.",
    event_date: getFutureDate(45, 10),
    location: "University of Minnesota Campus",
    city: "Minneapolis",
    state: "MN",
    image_url: getS3ImageUrl(
      "events/108e9cbe-981d-479e-a917-bd47a9749dcc-kevDaBarber.png"
    ),
    ticket_price_cents: 0, // Free event
    event_type: "community_service",
    event_audience_type: "public",
    all_day: true,
    duration_minutes: 480, // 8 hours
    dress_codes: ["comfortable", "outdoor"],
    dress_code_notes:
      "Wear comfortable clothing suitable for outdoor activities and volunteering.",
  },
  {
    title: "Kappa Leadership Summit",
    description:
      "A comprehensive leadership development workshop featuring keynote speakers, breakout sessions, and networking opportunities. Designed for current and aspiring chapter leaders.",
    event_date: getFutureDate(60, 9),
    location: "Hilton Downtown",
    city: "Minneapolis",
    state: "MN",
    image_url: getS3ImageUrl(
      "events/108e9cbe-981d-479e-a917-bd47a9749dcc-kevDaBarber.png"
    ),
    ticket_price_cents: 5000, // $50.00
    event_type: "educational",
    event_audience_type: "all_members",
    all_day: false,
    duration_minutes: 360, // 6 hours
    dress_codes: ["business", "business_casual"],
    dress_code_notes: "Professional attire required for all sessions.",
  },
  {
    title: "Alumni Chapter Golf Tournament",
    description:
      "Annual golf tournament bringing together brothers from across the region. Includes 18 holes, lunch, awards ceremony, and networking reception. All skill levels welcome!",
    event_date: getFutureDate(75, 8),
    location: "Prestige Golf Club",
    city: "Bloomington",
    state: "MN",
    image_url: getS3ImageUrl(
      "events/108e9cbe-981d-479e-a917-bd47a9749dcc-kevDaBarber.png"
    ),
    ticket_price_cents: 10000, // $100.00
    event_type: "sports",
    event_audience_type: "all_members",
    all_day: false,
    duration_minutes: 420, // 7 hours (includes lunch and reception)
    dress_codes: ["athletic", "outdoor"],
    dress_code_notes:
      "Golf attire required on the course. Collared shirts and appropriate golf pants/shorts.",
  },
  {
    title: "Holiday Celebration & Toy Drive",
    description:
      "Celebrate the holiday season with your brothers while giving back to the community. Bring an unwrapped toy for our annual toy drive. Food, music, and fellowship included.",
    event_date: getFutureDate(90, 17),
    location: "Community Center",
    city: "St. Paul",
    state: "MN",
    image_url: getS3ImageUrl(
      "events/108e9cbe-981d-479e-a917-bd47a9749dcc-kevDaBarber.png"
    ),
    ticket_price_cents: 2000, // $20.00
    event_type: "social",
    event_audience_type: "public",
    all_day: false,
    duration_minutes: 180, // 3 hours
    dress_codes: ["business_casual", "comfortable"],
    dress_code_notes: "Holiday-themed attire welcome!",
  },
  {
    title: "Virtual Chapter Meeting",
    description:
      "Monthly chapter meeting held virtually. All active members are expected to attend. Agenda includes chapter business, upcoming events, and brotherhood updates.",
    event_date: getFutureDate(7, 19),
    location: "Online",
    city: null,
    state: null,
    image_url: getS3ImageUrl(
      "events/108e9cbe-981d-479e-a917-bd47a9749dcc-kevDaBarber.png"
    ),
    ticket_price_cents: 0,
    event_type: "other",
    event_audience_type: "chapter_specific",
    all_day: false,
    duration_minutes: 90, // 1.5 hours
    event_link: "https://zoom.us/j/123456789",
    dress_codes: ["comfortable"],
    dress_code_notes: "Business casual recommended for video calls.",
  },
  {
    title: "Fundraising Gala",
    description:
      "Elegant fundraising gala to support our scholarship fund. Features dinner, live entertainment, silent auction, and recognition of scholarship recipients. All proceeds go to supporting student members.",
    event_date: getFutureDate(120, 18),
    location: "Grand Ballroom, Marriott",
    city: "Minneapolis",
    state: "MN",
    image_url: getS3ImageUrl(
      "events/108e9cbe-981d-479e-a917-bd47a9749dcc-kevDaBarber.png"
    ),
    ticket_price_cents: 15000, // $150.00
    event_type: "philanthropy",
    event_audience_type: "public",
    all_day: false,
    duration_minutes: 300, // 5 hours
    dress_codes: ["formal", "semi_formal"],
    dress_code_notes: "Black tie preferred. Formal evening wear required.",
  },
];

// Sample steward sellers data - using buddy+ users
const stewardSellers = [
  {
    name: testUsers.steward.name,
    email: testUsers.steward.email,
    membership_number: testUsers.steward.membership_number,
    business_name: "Steward Heritage Goods",
    kappa_vendor_id: "VL-TEST-STEWARD",
  },
];

// Sample products for steward sellers
const stewardProducts = [
  {
    name: "Vintage Kappa Letterman Jacket",
    description:
      "Authentic vintage letterman jacket from the 1980s. Features original Kappa Alpha Psi embroidery. Excellent condition with minor wear.",
    price_cents: 12500, // $125.00
    image_url:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop",
    category: "Heritage / Legacy Item",
    seller_email: testUsers.steward.email,
    is_kappa_branded: true,
  },
  {
    name: "Founders' Day Commemorative Plaque",
    description:
      "Handcrafted wooden plaque commemorating the founding of Kappa Alpha Psi. Features brass engraving and custom frame.",
    price_cents: 8500, // $85.00
    image_url:
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500&h=500&fit=crop",
    category: "Heritage / Legacy Item",
    seller_email: testUsers.steward.email,
    is_kappa_branded: true,
  },
];

async function seedStewardSellers(): Promise<void> {
  console.log("🛡️  Seeding steward sellers...");

  try {
    // Get all chapters to use for initiated/sponsoring chapters
    const chapters = await getAllChapters();
    const collegiateChapters = chapters.filter(
      (c: any) => c.type === "Collegiate" && c.status === "Active"
    );

    if (collegiateChapters.length === 0) {
      console.warn(
        "⚠️  No active collegiate chapters found. Using any available chapters..."
      );
    }

    const availableChapters =
      collegiateChapters.length > 0 ? collegiateChapters : chapters;

    if (availableChapters.length === 0) {
      console.error(
        "❌ No chapters found. Please seed chapters first using: npm run seed:chapters"
      );
      return;
    }

    // Get product categories
    const categories = await getAllProductCategories();
    const categoryMap = new Map(
      categories.map((cat: any) => [cat.name, cat.id])
    );

    // Get or create steward sellers
    const stewardSellersList = [];
    let stewardIndex = 0; // Track which steward this is (0-indexed)
    for (const stewardData of stewardSellers) {
      try {
        // Check if member already exists
        const existingMember = await pool.query(
          "SELECT id FROM fraternity_members WHERE email = $1",
          [stewardData.email]
        );

        let memberId: number | undefined;
        if (existingMember.rows.length > 0) {
          memberId = existingMember.rows[0].id;
          // Update member with initiated chapter if not set
          const initiatedChapter =
            availableChapters[
              Math.floor(Math.random() * availableChapters.length)
            ];
          await pool.query(
            "UPDATE fraternity_members SET initiated_chapter_id = COALESCE(initiated_chapter_id, $1) WHERE id = $2",
            [initiatedChapter.id, memberId]
          );
        } else {
          // Create new member
          const initiatedChapter =
            availableChapters[
              Math.floor(Math.random() * availableChapters.length)
            ];
          // Generate random initiation season and year
          const seasons = ["Fall", "Spring"];
          const season = seasons[Math.floor(Math.random() * seasons.length)];
          const year = 2015 + Math.floor(Math.random() * 10); // Random year between 2015-2024

          const memberResult = await pool.query(
            `INSERT INTO fraternity_members (
              email, name, membership_number, registration_status, 
              initiated_chapter_id, initiated_season, initiated_year, verification_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'VERIFIED')
            RETURNING id`,
            [
              stewardData.email,
              stewardData.name,
              stewardData.membership_number,
              "COMPLETE",
              initiatedChapter.id,
              season,
              year,
            ]
          );
          if (!memberResult.rows[0] || !memberResult.rows[0].id) {
            throw new Error(
              `Failed to create fraternity_member for steward ${stewardData.email} - INSERT did not return an id`
            );
          }
          memberId = memberResult.rows[0].id;
        }

        // Ensure memberId is defined before proceeding
        if (!memberId || typeof memberId !== "number") {
          throw new Error(
            `Failed to get or create fraternity_member for steward ${stewardData.email} - memberId is ${memberId}`
          );
        }

        // Check if steward already exists via users table
        const existingSteward = await pool.query(
          `SELECT st.id FROM stewards st
           JOIN users u ON u.steward_id = st.id
           JOIN fraternity_members m ON (u.email = m.email OR u.cognito_sub = m.cognito_sub)
           WHERE m.id = $1`,
          [memberId]
        );

        let stewardId: number;
        if (existingSteward.rows.length > 0) {
          stewardId = existingSteward.rows[0].id;
          // Approve first two stewards with verification status and date
          if (stewardIndex < 2) {
            await updateStewardStatus(stewardId, "APPROVED");
            // Set verification_status to VERIFIED and verification_date for approved stewards
            await pool.query(
              "UPDATE stewards SET verification_status = 'VERIFIED', verification_date = CURRENT_TIMESTAMP WHERE id = $1",
              [stewardId]
            );
          } else {
            await updateStewardStatus(stewardId, "APPROVED");
          }
        } else {
          // Create new steward
          const sponsoringChapter =
            availableChapters[
              Math.floor(Math.random() * availableChapters.length)
            ];
          const steward = await createSteward({
            sponsoring_chapter_id: sponsoringChapter.id,
          });
          stewardId = steward.id;
          // Approve first two stewards with verification status and date
          if (stewardIndex < 2) {
            await updateStewardStatus(stewardId, "APPROVED");
            // Set verification_status to VERIFIED and verification_date for approved stewards
            await pool.query(
              "UPDATE stewards SET verification_status = 'VERIFIED', verification_date = CURRENT_TIMESTAMP WHERE id = $1",
              [stewardId]
            );
          } else {
            await updateStewardStatus(stewardId, "APPROVED");
          }
        }

        stewardIndex++; // Increment for next iteration

        // Check if seller already exists
        const existingSeller = await pool.query(
          "SELECT id FROM sellers WHERE email = $1",
          [stewardData.email]
        );

        let sellerId: number;
        if (existingSeller.rows.length > 0) {
          sellerId = existingSeller.rows[0].id;
          // Update seller to ensure it's linked to the member and has Stripe account
          const existingStripeCheck = await pool.query(
            "SELECT stripe_account_id FROM sellers WHERE id = $1",
            [sellerId]
          );
          const hasStripeAccount =
            existingStripeCheck.rows[0]?.stripe_account_id;
          if (!hasStripeAccount) {
            const testStripeAccountId = `acct_test_${sellerId
              .toString()
              .padStart(10, "0")}`;
            await pool.query(
              "UPDATE sellers SET status = $1, stripe_account_id = $2 WHERE id = $3",
              ["APPROVED", testStripeAccountId, sellerId]
            );
          } else {
            await pool.query(
              "UPDATE sellers SET status = $1 WHERE id = $2",
              ["APPROVED", sellerId]
            );
          }
        } else {
          // Create new seller
          const sponsoringChapter =
            availableChapters[
              Math.floor(Math.random() * availableChapters.length)
            ];
          const seller = await createSeller({
            email: stewardData.email,
            name: stewardData.name,
            sponsoring_chapter_id: sponsoringChapter.id,
            business_name: stewardData.business_name,
            kappa_vendor_id: stewardData.kappa_vendor_id,
            social_links: {
              instagram: `@${stewardData.name.toLowerCase().replace(" ", "")}`,
            },
          });
          sellerId = seller.id;
          // Approve the seller, set verification_status to VERIFIED, and add test Stripe account ID
          const testStripeAccountId = `acct_test_${sellerId
            .toString()
            .padStart(10, "0")}`;
          await pool.query(
            "UPDATE sellers SET status = $1, verification_status = $2, stripe_account_id = $3 WHERE id = $4",
            ["APPROVED", "VERIFIED", testStripeAccountId, sellerId]
          );
        }

        const memberResult = await pool.query(
          "SELECT initiated_chapter_id FROM fraternity_members WHERE id = $1",
          [memberId]
        );
        const chapterId = memberResult.rows[0]?.initiated_chapter_id;
        const chapterResult = await pool.query(
          "SELECT name FROM chapters WHERE id = $1",
          [chapterId]
        );
        const chapterName = chapterResult.rows[0]?.name || "Unknown";

        console.log(
          `  ✓ Created/updated steward seller: ${stewardData.name} (steward ID: ${stewardId}, seller ID: ${sellerId}, initiated at ${chapterName})`
        );

        stewardSellersList.push({
          stewardId,
          sellerId,
          email: stewardData.email,
        });
      } catch (error) {
        console.error(
          `  ❌ Error seeding steward seller ${stewardData.email}:`,
          error
        );
      }
    }

    // Create products for steward sellers
    let inserted = 0;
    let skipped = 0;

    for (const productData of stewardProducts) {
      try {
        // Check if product already exists
        const existing = await pool.query(
          "SELECT id FROM products WHERE name = $1",
          [productData.name]
        );

        if (existing.rows.length > 0) {
          skipped++;
          continue;
        }

        // Find seller by email
        const seller = stewardSellersList.find(
          (s) => s.email === productData.seller_email
        );
        if (!seller) {
          console.warn(
            `  ⚠️  Seller not found for product ${productData.name}, skipping...`
          );
          skipped++;
          continue;
        }

        // Get category ID from category name
        const categoryId = productData.category
          ? categoryMap.get(productData.category) || null
          : null;

        // Determine if product is Kappa branded - use explicit value if provided, otherwise check name/description
        const productDataWithBranding = productData as typeof productData & {
          is_kappa_branded?: boolean;
        };
        const isKappaBranded =
          productDataWithBranding.is_kappa_branded !== undefined
            ? productDataWithBranding.is_kappa_branded
            : productData.name.toLowerCase().includes("kappa alpha psi") ||
              productData.name.toLowerCase().includes("founders' day") ||
              productData.name.toLowerCase().includes("kappa");

        await createProduct({
          seller_id: seller.sellerId,
          name: productData.name,
          description: productData.description,
          price_cents: productData.price_cents,
          image_url: productData.image_url,
          category_id: categoryId || undefined,
          is_kappa_branded: isKappaBranded,
        });

        inserted++;
      } catch (error) {
        console.error(
          `  ❌ Error inserting steward product ${productData.name}:`,
          error
        );
      }
    }

    console.log(
      `  ✓ Inserted ${inserted} steward products (${skipped} skipped)`
    );
    console.log(
      `  ✓ Created/updated ${stewardSellersList.length} steward sellers\n`
    );
  } catch (error) {
    console.error("❌ Error seeding steward sellers:", error);
    throw error;
  }
}

async function seedProducts(): Promise<void> {
  console.log("📦 Seeding products...");

  try {
    // Get product categories
    const categories = await getAllProductCategories();
    const categoryMap = new Map(
      categories.map((cat: any) => [cat.name, cat.id])
    );

    // Get existing sellers (should already exist from seedTestUsers)
    // Query for the buddy+ seller emails
    const sellerEmails = [
      testUsers.seller.email,
      testUsers.sellerNonMember.email,
    ];

    const sellersResult = await pool.query(
      `SELECT id, email, status, verification_status FROM sellers WHERE email = ANY($1::text[])`,
      [sellerEmails]
    );

    let sellers = sellersResult.rows.map((row) => {
      // Ensure email is set for matching
      (row as any).email = row.email;
      return row;
    });

    if (sellers.length === 0) {
      console.error("  ❌ No sellers found in database!");
      console.error("  ⚠️  Sellers should be created by seedTestUsers first.");
      console.error(`  ⚠️  Looking for sellers: ${sellerEmails.join(", ")}`);
      console.error("  ⚠️  Make sure seedTestUsers runs before seedProducts.");
      return;
    }

    // Ensure all sellers are approved
    for (const seller of sellers) {
      if (seller.status !== "APPROVED") {
        await pool.query("UPDATE sellers SET status = $1 WHERE id = $2", [
          "APPROVED",
          seller.id,
        ]);
        seller.status = "APPROVED";
        console.log(`  ✓ Approved seller: ${seller.email}`);
      }
      if (seller.verification_status !== "VERIFIED") {
        await pool.query(
          "UPDATE sellers SET verification_status = $1 WHERE id = $2",
          ["VERIFIED", seller.id]
        );
      }
    }

    console.log(
      `  ✓ Found ${sellers.length} seller(s) for products: ${sellers
        .map((s: any) => s.email)
        .join(", ")}\n`
    );
    console.log(
      `  📦 Ready to create ${sampleProducts.length} products using ${sellers.length} seller(s)\n`
    );

    // Create products
    let inserted = 0;
    let skipped = 0;
    let updated = 0;

    for (const productData of sampleProducts) {
      try {
        // Check if product already exists
        const existing = await pool.query(
          "SELECT id, category_id FROM products WHERE name = $1",
          [productData.name]
        );

        if (existing.rows.length > 0) {
          // Update existing product with category if it doesn't have one
          const existingProduct = existing.rows[0];
          const categoryId = productData.category
            ? categoryMap.get(productData.category) || null
            : null;

          if (!existingProduct.category_id && categoryId) {
            await pool.query(
              "UPDATE products SET category_id = $1 WHERE id = $2",
              [categoryId, existingProduct.id]
            );
            updated++;
            console.log(
              `  ✓ Updated category for existing product: ${productData.name}`
            );
          } else {
            skipped++;
          }
          continue;
        }

        // Assign seller - use specified seller_email if provided, otherwise random
        let seller;
        if ((productData as any).seller_email) {
          // Find seller by email
          seller = sellers.find(
            (s: any) => s.email === (productData as any).seller_email
          );

          // If not found in array, query database
          if (!seller) {
            const sellerResult = await pool.query(
              "SELECT id, email, status FROM sellers WHERE email = $1",
              [(productData as any).seller_email]
            );
            if (sellerResult.rows.length > 0) {
              seller = sellerResult.rows[0];
              (seller as any).email = seller.email;
              // Ensure seller is approved
              if (seller.status !== "APPROVED") {
                await pool.query(
                  "UPDATE sellers SET status = $1 WHERE id = $2",
                  ["APPROVED", seller.id]
                );
                seller.status = "APPROVED";
              }
              sellers.push(seller);
            }
          }

          // Fallback to random seller if still not found
          if (!seller && sellers.length > 0) {
            console.warn(
              `  ⚠️  Seller ${
                (productData as any).seller_email
              } not found, using random seller`
            );
            seller = sellers[Math.floor(Math.random() * sellers.length)];
          }
        } else {
          // Use random seller from available sellers
          if (sellers.length > 0) {
            seller = sellers[Math.floor(Math.random() * sellers.length)];
          }
        }

        if (!seller || !seller.id) {
          console.error(
            `  ❌ Could not assign seller to product: ${productData.name}`
          );
          console.error(
            `  ❌ No sellers available. Make sure seedTestUsers runs before seedProducts.`
          );
          continue;
        }

        // Get category ID from category name
        const categoryId = productData.category
          ? categoryMap.get(productData.category) || null
          : null;

        // Determine if product is Kappa branded
        const productDataWithBranding = productData as typeof productData & {
          is_kappa_branded?: boolean;
        };
        const isKappaBranded =
          productDataWithBranding.is_kappa_branded !== undefined
            ? productDataWithBranding.is_kappa_branded
            : productData.name.toLowerCase().includes("kappa alpha psi") ||
              productData.name.toLowerCase().includes("founders' day") ||
              productData.name.toLowerCase().includes("kappa");

        await createProduct({
          seller_id: seller.id,
          name: productData.name,
          description: productData.description,
          price_cents: productData.price_cents,
          image_url: productData.image_url,
          category_id: categoryId || undefined,
          is_kappa_branded: isKappaBranded,
        });

        inserted++;
      } catch (error) {
        console.error(
          `  ❌ Error inserting product ${productData.name}:`,
          error
        );
      }
    }

    console.log(
      `  ✓ Inserted ${inserted} products, updated ${updated} existing products (${skipped} skipped)`
    );
    console.log(`  ✓ Used ${sellers.length} sellers\n`);

    // Verify sellers are approved and products are queryable
    const verificationResult = await pool.query(
      `SELECT COUNT(*) as product_count 
       FROM products p 
       JOIN sellers s ON p.seller_id = s.id 
       WHERE s.status = 'APPROVED'`
    );
    const approvedProductCount = parseInt(
      verificationResult.rows[0]?.product_count || "0"
    );
    console.log(
      `  ✓ Verification: ${approvedProductCount} products with APPROVED sellers are queryable\n`
    );

    if (approvedProductCount === 0 && inserted > 0) {
      console.warn(
        "  ⚠️  WARNING: Products were created but none are queryable with APPROVED sellers!"
      );
      console.warn("  ⚠️  This may indicate a seller approval issue.\n");
    }
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    throw error;
  }
}

async function seedPromoters(): Promise<void> {
  console.log("🎤 Seeding promoters...");

  // Get all chapters
  const chapters = await getAllChapters();
  if (chapters.length === 0) {
    console.warn(
      "⚠️  No chapters found. Please seed chapters first using: npm run seed:chapters"
    );
    return;
  }

  const collegiateChapters = chapters.filter(
    (c: any) => c.type === "Collegiate" && c.status === "Active"
  );
  if (collegiateChapters.length === 0) {
    console.warn(
      "⚠️  No active collegiate chapters found. Using any available chapters..."
    );
  }

  const availableChapters =
    collegiateChapters.length > 0 ? collegiateChapters : chapters;

  let inserted = 0;
  let skipped = 0;

  for (const promoterData of testPromoters) {
    try {
      // Check if promoter already exists
      const existing = await pool.query(
        "SELECT id FROM promoters WHERE email = $1",
        [promoterData.email]
      );

      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }

      // Get random chapter
      const randomChapter =
        availableChapters[Math.floor(Math.random() * availableChapters.length)];

      // Create or get fraternity member for promoter (required)
      const existingMember = await pool.query(
        "SELECT id FROM fraternity_members WHERE email = $1",
        [promoterData.email]
      );

      let memberId: number;
      if (existingMember.rows.length > 0) {
        memberId = existingMember.rows[0].id;
      } else {
        // Create new member for promoter
        const initiatedChapter =
          availableChapters[
            Math.floor(Math.random() * availableChapters.length)
          ];
        const memberResult = await pool.query(
          `INSERT INTO fraternity_members (
            email, name, membership_number, registration_status, 
            initiated_chapter_id, initiated_season, initiated_year, verification_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'VERIFIED')
          RETURNING id`,
          [
            promoterData.email,
            promoterData.name,
            promoterData.membership_number,
            "COMPLETE",
            initiatedChapter.id,
            promoterData.initiated_season || "Fall",
            promoterData.initiated_year || 2018,
          ]
        );
        memberId = memberResult.rows[0].id;
      }

      // Create promoter (fraternity_member relationship via email matching)
      const promoter = await createPromoter({
        email: promoterData.email,
        name: promoterData.name,
        sponsoring_chapter_id: randomChapter.id,
        headshot_url: undefined,
        social_links: Object.fromEntries(
          Object.entries(promoterData.social_links || {}).filter(
            ([_, v]) => v !== undefined
          )
        ) as Record<string, string>,
      });

      // Update status if provided and not PENDING
      if (
        promoterData.status &&
        (promoterData.status as string) !== "PENDING"
      ) {
        await pool.query("UPDATE promoters SET status = $1 WHERE id = $2", [
          promoterData.status,
          promoter.id,
        ]);
      }

      inserted++;
      console.log(
        `  ✓ Created promoter: ${promoterData.name} (${
          promoterData.status || "PENDING"
        })`
      );
    } catch (error) {
      console.error(
        `  ❌ Error seeding promoter ${promoterData.email}:`,
        error
      );
    }
  }

  console.log(`  ✓ Inserted ${inserted} promoters (${skipped} skipped)\n`);
}

async function seedEvents(): Promise<void> {
  console.log("📅 Seeding events...");

  // Get all chapters for sponsored chapter assignment
  const chapters = await getAllChapters();
  const availableChapters = chapters.length > 0 ? chapters : [];

  // Get all event types and audience types for lookup
  const eventTypesResult = await pool.query(
    "SELECT id, enum FROM event_types WHERE is_active = true"
  );
  const eventAudienceTypesResult = await pool.query(
    "SELECT id, enum FROM event_audience_types WHERE is_active = true"
  );

  if (eventTypesResult.rows.length === 0) {
    console.warn("  ⚠️  No event types found. Please seed event types first.");
    return;
  }

  if (eventAudienceTypesResult.rows.length === 0) {
    console.warn(
      "  ⚠️  No event audience types found. Please seed event audience types first."
    );
    return;
  }

  // Create lookup maps
  const eventTypeMap = new Map(
    eventTypesResult.rows.map((row) => [row.enum, row.id])
  );
  const eventAudienceTypeMap = new Map(
    eventAudienceTypesResult.rows.map((row) => [row.enum, row.id])
  );

  // Get approved promoters (buddy+ users)
  const promotersResult = await pool.query(
    "SELECT id FROM promoters WHERE status = 'APPROVED' AND email LIKE 'buddy+%@ebilly.com'"
  );
  const promoters = promotersResult.rows;

  if (promoters.length === 0) {
    console.warn(
      "  ⚠️  No approved promoters found. Please seed promoters first."
    );
    return;
  }

  let inserted = 0;
  let skipped = 0;

  for (const eventData of sampleEvents) {
    try {
      // Check if event already exists
      const existing = await pool.query(
        "SELECT id FROM events WHERE title = $1 AND event_date = $2",
        [eventData.title, eventData.event_date]
      );

      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }

      // Assign to random approved promoter
      const promoter = promoters[Math.floor(Math.random() * promoters.length)];

      // Randomly assign sponsored chapter (50% chance)
      const sponsoredChapter =
        availableChapters.length > 0 && Math.random() > 0.5
          ? availableChapters[
              Math.floor(Math.random() * availableChapters.length)
            ].id
          : availableChapters.length > 0
          ? availableChapters[0].id
          : null;

      if (!sponsoredChapter) {
        console.log(
          `  ⚠ Skipping event: ${eventData.title} (no chapters available)`
        );
        continue;
      }

      // Look up event type and audience type IDs
      const eventTypeId = eventData.event_type
        ? eventTypeMap.get(eventData.event_type)
        : eventTypesResult.rows[0].id;
      const eventAudienceTypeId = eventData.event_audience_type
        ? eventAudienceTypeMap.get(eventData.event_audience_type)
        : eventAudienceTypesResult.rows[0].id;

      if (!eventTypeId) {
        console.warn(
          `  ⚠ Skipping event: ${eventData.title} (invalid event_type: ${eventData.event_type})`
        );
        continue;
      }

      if (!eventAudienceTypeId) {
        console.warn(
          `  ⚠ Skipping event: ${eventData.title} (invalid event_audience_type: ${eventData.event_audience_type})`
        );
        continue;
      }

      await createEvent({
        promoter_id: promoter.id,
        title: eventData.title,
        description: eventData.description,
        event_date: eventData.event_date,
        location: eventData.location,
        city: eventData.city || undefined,
        state: eventData.state || undefined,
        image_url: eventData.image_url || undefined,
        sponsored_chapter_id: sponsoredChapter,
        event_type_id: eventTypeId,
        event_audience_type_id: eventAudienceTypeId,
        all_day: eventData.all_day ?? false,
        duration_minutes: eventData.duration_minutes || undefined,
        event_link: eventData.event_link || undefined,
        dress_codes: (eventData.dress_codes || ["business_casual"]) as Array<
          | "business"
          | "business_casual"
          | "formal"
          | "semi_formal"
          | "kappa_casual"
          | "greek_encouraged"
          | "greek_required"
          | "outdoor"
          | "athletic"
          | "comfortable"
          | "all_white"
        >,
        dress_code_notes: eventData.dress_code_notes || undefined,
        ticket_price_cents: eventData.ticket_price_cents || 0,
      });

      inserted++;
      console.log(`  ✓ Created event: ${eventData.title}`);
    } catch (error) {
      console.error(`  ❌ Error seeding event ${eventData.title}:`, error);
    }
  }

  console.log(`  ✓ Inserted ${inserted} events (${skipped} skipped)\n`);
}

async function seedOrders(): Promise<void> {
  console.log("💰 Seeding orders for impact banner...");

  try {
    // Get some products with their sellers to create orders
    const productsResult = await pool.query(
      `SELECT p.id, p.price_cents, s.sponsoring_chapter_id 
       FROM products p 
       JOIN sellers s ON p.seller_id = s.id 
       LIMIT 10`
    );
    const products = productsResult.rows;

    const chaptersResult = await pool.query("SELECT id FROM chapters LIMIT 5");
    const chapters = chaptersResult.rows;

    if (products.length === 0) {
      console.log("  ⚠️  No products found. Skipping order seeding.");
      return;
    }

    if (chapters.length === 0) {
      console.log("  ⚠️  No chapters found. Skipping order seeding.");
      return;
    }

    // Create some paid orders with various amounts
    const orderAmounts = [
      4500, // $45.00
      5500, // $55.00
      3500, // $35.00
      2800, // $28.00
      1800, // $18.00
      2500, // $25.00
      4500, // $45.00
      5500, // $55.00
      3500, // $35.00
      2800, // $28.00
      1800, // $18.00
      4500, // $45.00
      5500, // $55.00
      3500, // $35.00
      2800, // $28.00
    ];

    let inserted = 0;
    for (let i = 0; i < Math.min(orderAmounts.length, products.length); i++) {
      const product = products[i % products.length];
      const chapter = chapters[i % chapters.length];
      const amount = orderAmounts[i];

      // Use seller's sponsoring_chapter_id if available, otherwise use random chapter
      const chapterId = product.sponsoring_chapter_id || chapter.id;

      try {
        // Check if order already exists
        const existing = await pool.query(
          "SELECT id FROM orders WHERE stripe_session_id = $1",
          [`test_session_${i}`]
        );

        if (existing.rows.length > 0) {
          continue; // Skip if already exists
        }

        // Get a random test user to assign the order to
        // Use buddy+guest@ebilly.com or buddy+member@ebilly.com (but member doesn't have user account)
        // So use buddy+guest@ebilly.com or one of the other test users
        const testUserEmails = [
          testUsers.guest.email,
          testUsers.seller.email,
          testUsers.sellerNonMember.email,
        ];
        const buyerEmail = testUserEmails[i % testUserEmails.length];

        // Get user_id from email
        const userResult = await pool.query(
          "SELECT id FROM users WHERE email = $1",
          [buyerEmail]
        );

        if (userResult.rows.length === 0) {
          console.warn(
            `  ⚠️  Skipping order ${i + 1}: User ${buyerEmail} not found`
          );
          continue;
        }

        const userId = userResult.rows[0].id;

        await pool.query(
          `INSERT INTO orders (product_id, user_id, amount_cents, stripe_session_id, chapter_id, status, created_at)
           VALUES ($1, $2, $3, $4, $5, 'PAID', NOW() - INTERVAL '${Math.floor(
             Math.random() * 90
           )} days')`,
          [product.id, userId, amount, `test_session_${i}`, chapterId]
        );
        inserted++;
      } catch (error: any) {
        console.error(`  Error inserting order ${i + 1}:`, error.message);
      }
    }

    console.log(`  ✓ Inserted ${inserted} paid orders\n`);
  } catch (error) {
    console.error("  ❌ Error seeding orders:", error);
    throw error;
  }
}

async function clearOldTestData() {
  console.log("🧹 Clearing old test data (@example.com users)...\n");

  // Delete in reverse order of dependencies
  await pool.query(
    "DELETE FROM events WHERE promoter_id IN (SELECT id FROM promoters WHERE email LIKE '%@example.com')"
  );
  await pool.query("DELETE FROM promoters WHERE email LIKE '%@example.com'");
  await pool.query(
    "DELETE FROM orders WHERE stripe_session_id LIKE 'test_session_%'"
  );
  await pool.query(
    "DELETE FROM products WHERE seller_id IN (SELECT id FROM sellers WHERE email LIKE '%@example.com')"
  );
  await pool.query("DELETE FROM sellers WHERE email LIKE '%@example.com'");
  await pool.query("DELETE FROM users WHERE email LIKE '%@example.com'");
  await pool.query(
    "DELETE FROM fraternity_members WHERE email LIKE '%@example.com'"
  );
  // Delete stewards via users table -> email/cognito_sub -> fraternity_members
  await pool.query(
    `DELETE FROM stewards WHERE id IN (
      SELECT st.id FROM stewards st
      JOIN users u ON u.steward_id = st.id
      JOIN fraternity_members m ON (u.email = m.email OR u.cognito_sub = m.cognito_sub)
      WHERE m.email LIKE '%@example.com'
    )`
  );

  console.log("✓ Old test data cleared\n");
}

async function seedTestUsers(): Promise<void> {
  console.log("👤 Seeding test users (buddy+ users only, no Cognito)...\n");

  try {
    // Get chapters for assigning to users
    const chapters = await getAllChapters();
    const collegiateChapters = chapters.filter(
      (c: any) => c.type === "Collegiate" && c.status === "Active"
    );
    const availableChapters =
      collegiateChapters.length > 0 ? collegiateChapters : chapters;

    if (availableChapters.length === 0) {
      console.warn("⚠️  No chapters found. Please seed chapters first.");
      return;
    }

    // Helper to generate placeholder cognito_sub for test users (no Cognito creation)
    const generateCognitoSub = (email: string): string => {
      return `test-${email.replace(/[@+]/g, "-")}-${Date.now()}`;
    };

    // Process each test user
    for (const [key, testUser] of Object.entries(testUsers)) {
      try {
        console.log(
          `\n📝 Processing ${key}: ${testUser.name} (${testUser.email})`
        );

        const cognitoSub = generateCognitoSub(testUser.email);

        // Get or create fraternity member (needed for member, steward, promoter, and member sellers)
        let memberId: number | null = null;
        if (
          key === "member" ||
          key === "steward" ||
          key === "promoter" ||
          (key === "seller" && testUser.membership_number)
        ) {
          // Members must have a membership_number
          if (!testUser.membership_number) {
            throw new Error(
              `${testUser.name} (${key}) must have a membership_number to be a fraternity member`
            );
          }

          // Check if member already exists
          const existingMember = await pool.query(
            "SELECT id FROM fraternity_members WHERE email = $1",
            [testUser.email]
          );

          if (existingMember.rows.length > 0) {
            memberId = existingMember.rows[0].id;
            console.log(`  ✓ Member already exists: ${testUser.name}`);
          } else {
            // Create new member
            const initiatedChapter =
              availableChapters[
                Math.floor(Math.random() * availableChapters.length)
              ];
            const seasons = ["Fall", "Spring"];
            const season = seasons[Math.floor(Math.random() * seasons.length)];
            const year = 2015 + Math.floor(Math.random() * 10);

            const memberResult = await pool.query(
              `INSERT INTO fraternity_members (
                email, name, membership_number, registration_status, 
                initiated_chapter_id, initiated_season, initiated_year, verification_status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'VERIFIED')
              RETURNING id`,
              [
                testUser.email,
                testUser.name,
                testUser.membership_number, // Required for all members
                "COMPLETE",
                initiatedChapter.id,
                season,
                year,
              ]
            );
            memberId = memberResult.rows[0].id;
            console.log(
              `  ✓ Created member: ${testUser.name} (membership: ${testUser.membership_number}, initiated at ${initiatedChapter.name}, ${season} ${year})`
            );
          }
        }

        // Create role-specific records
        let sellerId: number | null = null;
        let promoterId: number | null = null;
        let stewardId: number | null = null;

        if (key === "seller" || key === "sellerNonMember") {
          // Check if seller already exists
          const existingSeller = await pool.query(
            "SELECT id FROM sellers WHERE email = $1",
            [testUser.email]
          );

          if (existingSeller.rows.length > 0) {
            sellerId = existingSeller.rows[0].id;
            console.log(`  ✓ Seller already exists: ${testUser.name}`);
          } else {
            const sponsoringChapter =
              availableChapters[
                Math.floor(Math.random() * availableChapters.length)
              ];
            const seller = await createSeller({
              email: testUser.email,
              name: testUser.name,
              sponsoring_chapter_id: sponsoringChapter.id,
              business_name: (testUser as any).business_name || null,
              kappa_vendor_id: (testUser as any).kappa_vendor_id || "VL-TEST",
            });
            sellerId = seller.id;

            // Approve the seller and add test Stripe account ID
            // Using a test Stripe Connect account ID format (acct_xxxxx)
            // In production, this would be set up through the seller onboarding flow
            if (!sellerId) throw new Error("Seller ID is required");
            const testStripeAccountId = `acct_test_${sellerId
              .toString()
              .padStart(10, "0")}`;
            await pool.query(
              "UPDATE sellers SET status = $1, verification_status = $2, stripe_account_id = $3 WHERE id = $4",
              ["APPROVED", "VERIFIED", testStripeAccountId, sellerId]
            );
            console.log(
              `  ✓ Created and approved seller: ${testUser.name} (Stripe: ${testStripeAccountId})`
            );
          }
        }

        if (key === "promoter") {
          if (!memberId) {
            throw new Error(
              `Promoter ${testUser.name} must be a fraternity member`
            );
          }

          // Check if promoter already exists
          const existingPromoter = await pool.query(
            "SELECT id FROM promoters WHERE email = $1",
            [testUser.email]
          );

          if (existingPromoter.rows.length > 0) {
            promoterId = existingPromoter.rows[0].id;
            console.log(`  ✓ Promoter already exists: ${testUser.name}`);
          } else {
            const sponsoringChapter =
              availableChapters[
                Math.floor(Math.random() * availableChapters.length)
              ];
            const promoter = await createPromoter({
              email: testUser.email,
              name: testUser.name,
              sponsoring_chapter_id: sponsoringChapter.id,
              headshot_url: undefined,
              social_links: {},
            });
            promoterId = promoter.id;

            // Approve the promoter
            await pool.query("UPDATE promoters SET status = $1 WHERE id = $2", [
              "APPROVED",
              promoterId,
            ]);
            console.log(`  ✓ Created and approved promoter: ${testUser.name}`);
          }
        }

        if (key === "steward") {
          if (!memberId) {
            throw new Error("Member ID required for steward");
          }

          // Check if steward already exists via users table
          const existingSteward = await pool.query(
            `SELECT st.id FROM stewards st
             JOIN users u ON u.steward_id = st.id
             JOIN fraternity_members m ON (u.email = m.email OR u.cognito_sub = m.cognito_sub)
             WHERE m.id = $1`,
            [memberId]
          );

          if (existingSteward.rows.length > 0) {
            stewardId = existingSteward.rows[0].id;
            console.log(`  ✓ Steward already exists: ${testUser.name}`);
          } else {
            const sponsoringChapter =
              availableChapters[
                Math.floor(Math.random() * availableChapters.length)
              ];
            const steward = await createSteward({
              sponsoring_chapter_id: sponsoringChapter.id,
            });
            stewardId = steward.id;

            // Approve the steward
            await updateStewardStatus(stewardId, "APPROVED");
            console.log(`  ✓ Created and approved steward: ${testUser.name}`);
          }
        }

        // Create or update user record
        const existingUser = await pool.query(
          "SELECT id FROM users WHERE cognito_sub = $1 OR email = $2",
          [cognitoSub, testUser.email]
        );

        const userRole =
          key === "seller" || key === "sellerNonMember"
            ? "SELLER"
            : key === "promoter"
            ? "PROMOTER"
            : key === "steward"
            ? "STEWARD"
            : key === "guest"
            ? "GUEST"
            : null;

        // Members who are not sellers/promoters/stewards don't get user accounts
        // They only exist in the fraternity_members table
        if (key === "member") {
          console.log(
            `  ✓ Member record created (no user account - members and guests are separate)`
          );
          continue;
        }

        if (existingUser.rows.length > 0) {
          const userId = existingUser.rows[0].id;

          // Determine onboarding_status (fraternity_member relationship via email/cognito_sub matching)
          let onboardingStatus = "ONBOARDING_FINISHED";

          // Update user (fraternity_member relationship accessed via email/cognito_sub matching)
          if (userRole === "PROMOTER") {
            await pool.query(
              `UPDATE users 
               SET email = $1, 
                   role = $2, 
                   onboarding_status = $3,
                   seller_id = COALESCE(seller_id, $4),
                   promoter_id = COALESCE(promoter_id, $5),
                   steward_id = COALESCE(steward_id, $6)
               WHERE id = $7`,
              [
                testUser.email,
                userRole,
                onboardingStatus,
                sellerId,
                promoterId,
                stewardId,
                userId,
              ]
            );
          } else if (userRole === "STEWARD") {
            // STEWARD users: fraternity_member accessed via users table -> email/cognito_sub -> fraternity_members
            await pool.query(
              `UPDATE users 
               SET email = $1, 
                   role = $2, 
                   onboarding_status = $3,
                   seller_id = COALESCE(seller_id, $4),
                   promoter_id = COALESCE(promoter_id, $5),
                   steward_id = COALESCE(steward_id, $6)
               WHERE id = $7`,
              [
                testUser.email,
                userRole,
                onboardingStatus,
                sellerId,
                promoterId,
                stewardId,
                userId,
              ]
            );
          } else {
            await pool.query(
              `UPDATE users 
               SET email = $1, 
                   role = $2, 
                   onboarding_status = $3,
                   seller_id = COALESCE(seller_id, $4),
                   promoter_id = COALESCE(promoter_id, $5),
                   steward_id = COALESCE(steward_id, $6)
               WHERE id = $7`,
              [
                testUser.email,
                userRole,
                onboardingStatus,
                sellerId,
                promoterId,
                stewardId,
                userId,
              ]
            );
          }
          console.log(`  ✓ Updated user record: ${testUser.name}`);
        } else {
          if (userRole === "STEWARD") {
            // STEWARD users: fraternity_member accessed via users table -> email/cognito_sub -> fraternity_members
            await pool.query(
              `INSERT INTO users (cognito_sub, email, role, onboarding_status, steward_id, features)
               VALUES ($1, $2, $3, $4, $5, $6)
               RETURNING *`,
              [
                cognitoSub,
                testUser.email,
                "STEWARD",
                "ONBOARDING_FINISHED",
                stewardId,
                JSON.stringify({}),
              ]
            );
          } else if (userRole === "PROMOTER") {
            // PROMOTER: fraternity_member accessed via email matching
            await pool.query(
              `INSERT INTO users (cognito_sub, email, role, onboarding_status, promoter_id, features)
               VALUES ($1, $2, $3, $4, $5, $6)
               RETURNING *`,
              [
                cognitoSub,
                testUser.email,
                "PROMOTER",
                "ONBOARDING_FINISHED",
                promoterId,
                JSON.stringify({}),
              ]
            );
          } else if (userRole === "GUEST") {
            // GUEST users: fraternity_member accessed via email/cognito_sub matching
            await createUser({
              cognito_sub: cognitoSub,
              email: testUser.email,
              role: "GUEST",
              onboarding_status: "ONBOARDING_FINISHED",
              seller_id: null,
              promoter_id: null,
            });
          } else {
            await createUser({
              cognito_sub: cognitoSub,
              email: testUser.email,
              role: userRole as "ADMIN" | "SELLER",
              onboarding_status: "ONBOARDING_FINISHED",
              seller_id: sellerId,
              promoter_id: promoterId,
            });
          }
          console.log(`  ✓ Created user record: ${testUser.name}`);
        }

        console.log(`  ✅ Completed setup for ${testUser.name}`);
      } catch (error: any) {
        console.error(`  ❌ Error processing ${testUser.name}:`, error.message);
        throw error;
      }
    }

    console.log("\n✅ Test users seeded successfully!");
    console.log("\n📋 Test User Emails:");
    Object.values(testUsers).forEach((user) => {
      console.log(`   - ${user.name}: ${user.email}`);
    });
    console.log("\n");
  } catch (error) {
    console.error("❌ Error seeding test users:", error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes("--clear");

  try {
    console.log("🌱 Starting test data seeding...\n");

    // Always clear old @example.com test data first
    await clearOldTestData();

    // Seed test users first (buddy+ users)
    await seedTestUsers();

    // Seed products and sellers (tied to buddy+ users)
    await seedProducts();

    // Seed promoters (tied to buddy+ users)
    await seedPromoters();

    // Seed events (requires promoters to be seeded first)
    await seedEvents();

    // Seed orders for impact banner
    await seedOrders();

    // Seed steward sellers and products
    await seedStewardSellers();

    console.log("✅ Test data seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding test data:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export {
  seedProducts,
  seedPromoters,
  seedEvents,
  seedStewardSellers,
  seedTestUsers,
  clearOldTestData,
};
