import { API_URL } from "./constants";
import { authenticatedFetch } from "./api-utils";

export interface Chapter {
  id: number;
  name: string;
  type: string;
  status: string | null;
  chartered: number | null;
  province: string | null;
  city: string | null;
  state: string | null;
  contact_email: string | null;
}

export interface ProductAttributeValue {
  id: number;
  product_id: number;
  attribute_definition_id: number;
  value_text: string | null;
  value_number: number | null;
  value_boolean: boolean | null;
  created_at: string;
  attribute_name?: string;
  attribute_type?: "TEXT" | "SELECT" | "NUMBER" | "BOOLEAN";
  display_order?: number;
}

export interface ProductCategory {
  id: number;
  name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryAttributeDefinition {
  id: number;
  category_id: number;
  attribute_name: string;
  attribute_type: "TEXT" | "SELECT" | "NUMBER" | "BOOLEAN";
  is_required: boolean;
  display_order: number;
  options: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  seller_id: number;
  name: string;
  description: string;
  price_cents: number;
  image_url: string | null;
  category_id: number | null;
  category_name?: string | null;
  is_kappa_branded?: boolean;
  seller_name?: string;
  seller_business_name?: string | null;
  seller_fraternity_member_id?: number | null;
  seller_sponsoring_chapter_id?: number | null;
  seller_initiated_chapter_id?: number | null;
  seller_initiated_season?: string | null;
  seller_initiated_year?: number | null;
  seller_status?: "PENDING" | "APPROVED" | "REJECTED";
  is_fraternity_member?: boolean;
  is_seller?: boolean;
  is_promoter?: boolean;
  is_steward?: boolean;
  attributes?: ProductAttributeValue[];
}

export interface Event {
  id: number;
  promoter_id: number;
  title: string;
  description: string | null;
  event_date: string;
  location: string;
  city: string | null;
  state: string | null;
  image_url: string | null;
  sponsored_chapter_id: number | null;
  event_type_id: number | null;
  event_audience_type_id: number | null;
  all_day: boolean;
  duration_minutes: number | null;
  event_link: string | null;
  is_featured: boolean;
  featured_payment_status:
    | "UNPAID"
    | "PENDING"
    | "PAID"
    | "FAILED"
    | "REFUNDED";
  stripe_payment_intent_id: string | null;
  ticket_price_cents: number;
  dress_codes: (
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
  )[];
  dress_code_notes: string | null;
  status: "ACTIVE" | "CLOSED" | "CANCELLED";
  is_recurring?: boolean;
  recurrence_rule?: string | null;
  recurrence_end_date?: string | null;
  promoter_name?: string;
  promoter_email?: string;
  promoter_fraternity_member_id?: number | null;
  promoter_sponsoring_chapter_id?: number | null;
  promoter_initiated_chapter_id?: number | null;
  promoter_initiated_season?: string | null;
  promoter_initiated_year?: number | null;
  chapter_name?: string | null;
  is_fraternity_member?: boolean;
  is_promoter?: boolean;
  is_steward?: boolean;
  is_seller?: boolean;
  event_audience_type_description?: string | null;
  event_type_description?: string | null;
  affiliated_chapters?: Chapter[];
}

export interface EventType {
  id: number;
  enum: string;
  description: string;
  display_order: number;
}

export interface EventAudienceType {
  id: number;
  enum: string;
  description: string;
  display_order: number;
}

export async function fetchEventTypes(): Promise<EventType[]> {
  try {
    const res = await fetch(`${API_URL}/api/events/types`);
    if (!res.ok) {
      throw new Error("Failed to fetch event types");
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching event types:", error);
    throw error;
  }
}

export async function fetchEventAudienceTypes(): Promise<EventAudienceType[]> {
  try {
    const res = await fetch(`${API_URL}/api/events/audience-types`);
    if (!res.ok) {
      throw new Error("Failed to fetch event audience types");
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching event audience types:", error);
    throw error;
  }
}

export interface Seller {
  id: number;
  name: string;
  business_name?: string | null;
  headshot_url?: string | null;
  sponsoring_chapter_id: number;
  social_links?: Record<string, string>;
  fraternity_member_id?: number | null;
  initiated_chapter_id?: number | null;
  initiated_season?: string | null;
  initiated_year?: number | null;
  product_count: number;
  is_fraternity_member?: boolean;
  is_seller?: boolean;
  is_promoter?: boolean;
  is_steward?: boolean;
}

export interface SellerWithProducts extends Seller {
  products: Product[];
}

export async function fetchChapters(): Promise<Chapter[]> {
  try {
    const res = await fetch(`${API_URL}/api/chapters`);
    if (!res.ok) throw new Error("Failed to fetch chapters");
    return res.json();
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return [];
  }
}

export async function fetchCollegiateChapters(): Promise<Chapter[]> {
  try {
    const res = await fetch(`${API_URL}/api/chapters/active-collegiate`);
    if (!res.ok) throw new Error("Failed to fetch collegiate chapters");
    return res.json();
  } catch (error) {
    console.error("Error fetching collegiate chapters:", error);
    return [];
  }
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/api/products`);
    if (!res.ok) throw new Error("Failed to fetch products");
    return res.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/api/products/featured`);
    if (!res.ok) throw new Error("Failed to fetch featured products");
    return res.json();
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

export async function fetchProduct(productId: number): Promise<Product> {
  try {
    const res = await fetch(`${API_URL}/api/products/${productId}`);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error("Product not found");
      }
      throw new Error("Failed to fetch product");
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
}

export async function fetchEvents(): Promise<Event[]> {
  try {
    const res = await fetch(`${API_URL}/api/events`);
    if (!res.ok) throw new Error("Failed to fetch events");
    return res.json();
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

export async function fetchUpcomingEvents(): Promise<Event[]> {
  try {
    const res = await fetch(`${API_URL}/api/events/upcoming`);
    if (!res.ok) throw new Error("Failed to fetch upcoming events");
    return res.json();
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    return [];
  }
}

export async function fetchEvent(eventId: number): Promise<Event> {
  try {
    const res = await fetch(`${API_URL}/api/events/${eventId}`);
    if (!res.ok) throw new Error("Failed to fetch event");
    return res.json();
  } catch (error) {
    console.error("Error fetching event:", error);
    throw error;
  }
}

export async function getPromoterEvents(token: string): Promise<Event[]> {
  try {
    const res = await authenticatedFetch(`${API_URL}/api/events/promoter/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to fetch promoter events");
    }
    return res.json();
  } catch (error: any) {
    console.error("Error fetching promoter events:", error);
    // Re-throw session expired errors
    if (error.code === "SESSION_EXPIRED") {
      throw error;
    }
    throw error;
  }
}

export interface Promoter {
  id: number;
  fraternity_member_id: number | null;
  sponsoring_chapter_id: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  stripe_account_id: string | null;
  created_at: string;
  updated_at: string;
  email?: string;
  name?: string;
  membership_number?: string;
  initiated_chapter_id?: number | null;
  headshot_url?: string | null;
  social_links?: Record<string, string>;
}

export async function getPromoterProfile(token: string): Promise<Promoter> {
  try {
    const res = await fetch(`${API_URL}/api/promoters/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to fetch promoter profile");
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching promoter profile:", error);
    throw error;
  }
}

export async function promoteEvent(
  eventId: number,
  token: string
): Promise<{
  checkout_url: string;
  event_id: number;
  requires_payment: boolean;
}> {
  const response = await fetch(`${API_URL}/api/events/${eventId}/promote`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Failed to promote event" }));
    throw new Error(error.error || "Failed to promote event");
  }

  return response.json();
}

export async function closeEvent(
  eventId: number,
  token: string
): Promise<Event> {
  try {
    const res = await fetch(`${API_URL}/api/events/${eventId}/close`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to close event");
    }
    return res.json();
  } catch (error) {
    console.error("Error closing event:", error);
    throw error;
  }
}

export async function createEvent(
  token: string,
  formData: FormData
): Promise<
  Event & {
    checkout_url?: string;
    requires_payment?: boolean;
    payment_error?: string;
  }
> {
  try {
    const res = await fetch(`${API_URL}/api/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to create event");
    }
    return res.json();
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
}

export async function updateEvent(
  token: string,
  eventId: number,
  formData: FormData
): Promise<
  Event & {
    checkout_url?: string;
    requires_payment?: boolean;
    payment_error?: string;
  }
> {
  try {
    const res = await fetch(`${API_URL}/api/events/${eventId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to update event");
    }
    return res.json();
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
}

export interface SearchResults {
  products: Product[];
  events: Event[];
}

export async function searchPublicItems(query: string): Promise<SearchResults> {
  try {
    if (!query.trim()) {
      return { products: [], events: [] };
    }

    // Fetch all products and events, then filter client-side
    // (In a production app, you'd want a dedicated search endpoint)
    const [products, events] = await Promise.all([
      fetchProducts(),
      fetchEvents(),
    ]);

    const searchLower = query.toLowerCase();

    const filteredProducts = products.filter((product) => {
      const nameMatch = product.name?.toLowerCase().includes(searchLower);
      const descMatch = product.description
        ?.toLowerCase()
        .includes(searchLower);
      const sellerMatch =
        product.seller_name?.toLowerCase().includes(searchLower) ||
        product.seller_business_name?.toLowerCase().includes(searchLower);
      return nameMatch || descMatch || sellerMatch;
    });

    const filteredEvents = events.filter((event) => {
      const titleMatch = event.title?.toLowerCase().includes(searchLower);
      const descMatch = event.description?.toLowerCase().includes(searchLower);
      const locationMatch =
        event.location?.toLowerCase().includes(searchLower) ||
        event.city?.toLowerCase().includes(searchLower) ||
        event.state?.toLowerCase().includes(searchLower);
      const promoterMatch = event.promoter_name
        ?.toLowerCase()
        .includes(searchLower);
      return titleMatch || descMatch || locationMatch || promoterMatch;
    });

    return {
      products: filteredProducts,
      events: filteredEvents,
    };
  } catch (error) {
    console.error("Error searching public items:", error);
    return { products: [], events: [] };
  }
}

export async function fetchTotalDonations(): Promise<number> {
  try {
    const res = await fetch(`${API_URL}/api/donations/total`);
    if (!res.ok) throw new Error("Failed to fetch total donations");
    const data = await res.json();
    return data.total_donations_cents || 0;
  } catch (error) {
    console.error("Error fetching total donations:", error);
    return 0;
  }
}

export interface StewardListing {
  id: number;
  steward_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  shipping_cost_cents: number;
  chapter_donation_cents: number;
  sponsoring_chapter_id: number;
  category_id: number | null;
  status: "ACTIVE" | "CLAIMED" | "REMOVED";
  steward?: {
    id: number;
    fraternity_member_id: number | null;
    sponsoring_chapter_id: number;
    status: string;
    member?: {
      id: number;
      name: string;
      email: string;
    } | null;
  } | null;
  chapter?: {
    id: number;
    name: string;
  } | null;
  can_claim?: boolean;
}

export async function getStewardMarketplacePublic(): Promise<StewardListing[]> {
  try {
    const url = `${API_URL}/api/stewards/marketplace/public`;
    console.log("Fetching steward marketplace from:", url);
    const res = await fetch(url);
    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        `Failed to fetch steward marketplace: ${res.status} ${res.statusText}`,
        errorText
      );
      throw new Error(
        `Failed to fetch steward marketplace: ${res.status} ${res.statusText}`
      );
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching steward marketplace:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return [];
  }
}

export async function getStewardListingPublic(
  id: number
): Promise<StewardListing> {
  try {
    const res = await fetch(`${API_URL}/api/stewards/listings/${id}/public`);
    if (!res.ok) throw new Error("Failed to fetch steward listing");
    return res.json();
  } catch (error) {
    console.error("Error fetching steward listing:", error);
    throw error;
  }
}

export async function fetchProductCategories(): Promise<ProductCategory[]> {
  try {
    const res = await fetch(`${API_URL}/api/products/categories`);
    if (!res.ok) throw new Error("Failed to fetch product categories");
    return res.json();
  } catch (error) {
    console.error("Error fetching product categories:", error);
    return [];
  }
}

export async function fetchCategoryAttributeDefinitions(
  categoryId: number
): Promise<CategoryAttributeDefinition[]> {
  try {
    const res = await fetch(
      `${API_URL}/api/products/categories/${categoryId}/attributes`
    );
    if (!res.ok) throw new Error("Failed to fetch category attributes");
    return res.json();
  } catch (error) {
    console.error("Error fetching category attributes:", error);
    return [];
  }
}

export interface Seller {
  id: number;
  status: string;
  stripe_account_id: string | null;
  verification_status?: string;
}

export async function getSellerProfile(token: string): Promise<Seller> {
  const res = await authenticatedFetch(`${API_URL}/api/sellers/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch seller profile");
  return res.json();
}

// Note: createProduct is handled directly in SellerListingScreen
// because FormData requires special handling and we can't use authenticatedFetch
// which may interfere with Content-Type headers needed for multipart/form-data

export async function fetchSellersWithProducts(): Promise<
  SellerWithProducts[]
> {
  try {
    const res = await fetch(`${API_URL}/api/sellers/collections`);
    if (!res.ok) throw new Error("Failed to fetch sellers");
    return res.json();
  } catch (error) {
    console.error("Error fetching sellers with products:", error);
    return [];
  }
}

export async function fetchSellerWithProducts(
  sellerId: number
): Promise<SellerWithProducts | null> {
  try {
    const res = await fetch(`${API_URL}/api/sellers/${sellerId}/products`);
    if (!res.ok) throw new Error("Failed to fetch seller with products");
    const data = await res.json();
    // The API returns seller data with products array
    return {
      ...data,
      products: data.products || [],
    };
  } catch (error) {
    console.error("Error fetching seller with products:", error);
    return null;
  }
}

// Helper function to get auth headers (for future use when auth is implemented)
export async function getAuthHeaders(): Promise<HeadersInit> {
  // TODO: Get token from auth context when authentication is implemented
  return {
    "Content-Type": "application/json",
  };
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export async function createCheckoutSession(
  productId: number,
  buyerEmail: string,
  token?: string
): Promise<CheckoutSession> {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/api/checkout/${productId}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ buyer_email: buyerEmail }),
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to create checkout session" }));
      throw new Error(
        errorData.error ||
          errorData.details ||
          "Failed to create checkout session"
      );
    }

    return res.json();
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}

export interface FeaturedBrother {
  id: number;
  name: string;
  business_name: string | null;
  headshot_url: string | null;
  sponsoring_chapter_id: number;
  chapter_name: string | null;
  social_links: Record<string, string>;
  website: string | null;
  product_count: number;
}

export async function fetchFeaturedBrothers(): Promise<FeaturedBrother[]> {
  try {
    const res = await fetch(`${API_URL}/api/sellers/featured`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error(
        `Failed to fetch featured brothers: ${res.status} ${res.statusText}`,
        errorData
      );
      return [];
    }
    const data = await res.json();
    console.log(
      `fetchFeaturedBrothers: Retrieved ${data.length} featured brothers`
    );
    return data;
  } catch (error) {
    console.error("Error fetching featured brothers:", error);
    return [];
  }
}

export interface Industry {
  id: number;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profession {
  id: number;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemberProfile {
  id: number;
  email: string;
  name: string | null;
  membership_number: string | null;
  initiated_chapter_id: number | null;
  chapter_name: string | null;
  initiated_season: string | null;
  initiated_year: number | null;
  ship_name: string | null;
  line_name: string | null;
  location: string | null;
  address: string | null;
  address_is_private: boolean;
  phone_number: string | null;
  phone_is_private: boolean;
  industry: string | null;
  profession_id: number | null;
  profession_name: string | null;
  job_title: string | null;
  bio: string | null;
  headshot_url: string | null;
  social_links: Record<string, string>;
  verification_status?: "PENDING" | "VERIFIED" | "FAILED" | "MANUAL_REVIEW";
  created_at: string;
  updated_at: string;
  is_seller?: boolean;
  is_promoter?: boolean;
  is_steward?: boolean;
}

export async function fetchIndustries(): Promise<Industry[]> {
  try {
    const res = await fetch(`${API_URL}/api/industries`);
    if (!res.ok) {
      console.error("Failed to fetch industries:", res.status, res.statusText);
      throw new Error(
        `Failed to fetch industries: ${res.status} ${res.statusText}`
      );
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching industries:", error);
    throw error;
  }
}

export async function fetchProfessions(): Promise<Profession[]> {
  try {
    const res = await fetch(`${API_URL}/api/professions`);
    if (!res.ok) {
      console.error("Failed to fetch professions:", res.status, res.statusText);
      throw new Error(
        `Failed to fetch professions: ${res.status} ${res.statusText}`
      );
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching professions:", error);
    throw error;
  }
}

export async function fetchMemberProfile(
  token: string
): Promise<MemberProfile> {
  try {
    const res = await authenticatedFetch(`${API_URL}/api/members/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        const errorData = await res.json().catch(() => ({}));
        const error = new Error("Member profile not found");
        (error as any).requiresRegistration =
          errorData.requiresRegistration === true;
        (error as any).code = errorData.code;
        throw error;
      }
      throw new Error("Failed to fetch member profile");
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching member profile:", error);
    throw error;
  }
}

export async function updateMemberProfile(
  token: string,
  data: Partial<MemberProfile> & {
    headshot?: { uri: string; type: string; name: string };
  }
): Promise<MemberProfile> {
  try {
    const formData = new FormData();

    // Add all fields except headshot
    Object.keys(data).forEach((key) => {
      if (key !== "headshot" && data[key as keyof typeof data] !== undefined) {
        const value = data[key as keyof typeof data];
        if (key === "social_links" && typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else if (key === "address_is_private" || key === "phone_is_private") {
          formData.append(key, String(value));
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      }
    });

    // Add headshot if provided
    if (data.headshot) {
      formData.append("headshot", {
        uri: data.headshot.uri,
        type: data.headshot.type,
        name: data.headshot.name,
      } as any);
    }

    const res = await authenticatedFetch(`${API_URL}/api/members/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({
        error: "Failed to update profile",
      }));
      throw new Error(errorData.error || "Failed to update member profile");
    }

    return res.json();
  } catch (error) {
    console.error("Error updating member profile:", error);
    throw error;
  }
}

/**
 * Get order count for the current user
 */
export async function getOrderCount(token: string): Promise<number> {
  try {
    const res = await authenticatedFetch(`${API_URL}/api/users/me/orders`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return 0;
    }

    const orders = await res.json();
    return Array.isArray(orders) ? orders.length : 0;
  } catch (error: any) {
    // Re-throw session expired errors
    if (error.code === "SESSION_EXPIRED") {
      throw error;
    }
    console.error("Error fetching order count:", error);
    return 0;
  }
}

/**
 * Get saved items (favorites) count for the current user
 */
export async function getSavedItemsCount(
  token: string,
  userEmail: string
): Promise<number> {
  try {
    const res = await authenticatedFetch(
      `${API_URL}/api/favorites/${userEmail}/products`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      return 0;
    }

    const products = await res.json();
    return Array.isArray(products) ? products.length : 0;
  } catch (error: any) {
    // Re-throw session expired errors
    if (error.code === "SESSION_EXPIRED") {
      throw error;
    }
    console.error("Error fetching saved items count:", error);
    return 0;
  }
}

export interface Notification {
  id: number;
  user_email: string;
  type:
    | "PURCHASE_BLOCKED"
    | "ITEM_AVAILABLE"
    | "ORDER_CONFIRMED"
    | "ORDER_SHIPPED";
  title: string;
  message: string;
  related_product_id: number | null;
  related_order_id: number | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

/**
 * Get notifications for the current user
 */
export async function getNotifications(
  token: string,
  userEmail: string,
  limit?: number
): Promise<Notification[]> {
  try {
    const url = limit
      ? `${API_URL}/api/notifications/${userEmail}?limit=${limit}`
      : `${API_URL}/api/notifications/${userEmail}`;
    const res = await authenticatedFetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch notifications");
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadNotificationCount(
  token: string,
  userEmail: string
): Promise<number> {
  try {
    const res = await authenticatedFetch(
      `${API_URL}/api/notifications/${userEmail}/count`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      return 0;
    }

    const data = await res.json();
    return data.count || 0;
  } catch (error) {
    console.error("Error fetching notification count:", error);
    return 0;
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  token: string,
  notificationId: number,
  userEmail: string
): Promise<void> {
  try {
    const res = await authenticatedFetch(
      `${API_URL}/api/notifications/${notificationId}/read`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userEmail }),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to mark notification as read");
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(
  token: string,
  userEmail: string
): Promise<number> {
  try {
    const res = await authenticatedFetch(
      `${API_URL}/api/notifications/${userEmail}/read-all`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to mark all notifications as read");
    }

    const data = await res.json();
    return data.count || 0;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  token: string,
  notificationId: number,
  userEmail: string
): Promise<void> {
  try {
    const res = await authenticatedFetch(
      `${API_URL}/api/notifications/${notificationId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userEmail }),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to delete notification");
    }
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
}

/**
 * Save an event
 */
export async function saveEvent(token: string, eventId: number): Promise<void> {
  try {
    const res = await authenticatedFetch(
      `${API_URL}/api/saved-events/${eventId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to save event");
    }
  } catch (error) {
    console.error("Error saving event:", error);
    throw error;
  }
}

/**
 * Unsave an event
 */
export async function unsaveEvent(
  token: string,
  eventId: number
): Promise<void> {
  try {
    const res = await authenticatedFetch(
      `${API_URL}/api/saved-events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to unsave event");
    }
  } catch (error) {
    console.error("Error unsaving event:", error);
    throw error;
  }
}

/**
 * Check if an event is saved
 */
export async function checkEventSaved(
  token: string,
  eventId: number
): Promise<boolean> {
  try {
    const res = await authenticatedFetch(
      `${API_URL}/api/saved-events/check/${eventId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      return false;
    }

    const data = await res.json();
    return data.saved || false;
  } catch (error) {
    console.error("Error checking saved status:", error);
    return false;
  }
}

/**
 * Get all saved events for the current user
 */
export async function fetchSavedEvents(token: string): Promise<Event[]> {
  try {
    const res = await authenticatedFetch(`${API_URL}/api/saved-events`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch saved events");
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching saved events:", error);
    throw error;
  }
}
