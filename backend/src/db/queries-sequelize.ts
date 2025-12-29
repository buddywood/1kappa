// @ts-nocheck

import { Op, QueryTypes } from "sequelize";
import sequelize from "./sequelize";
import {
  Chapter,
  Seller,
  Product,
  ProductCategory,
  CategoryAttributeDefinition,
  ProductAttributeValue,
  ProductImage,
  Order,
  Promoter,
  Event,
  EventType,
  EventAudienceType,
  User,
  Steward,
  StewardListing,
  StewardListingImage,
  StewardClaim,
  PlatformSetting,
  Industry,
  Profession,
  FraternityMember,
  Favorite as FavoriteModel,
  EventAffiliatedChapter,
  SavedEvent as SavedEventModel,
} from "./models";
import {
  Chapter as ChapterType,
  Seller as SellerType,
  Product as ProductType,
  ProductCategory as ProductCategoryType,
  CategoryAttributeDefinition as CategoryAttributeDefinitionType,
  ProductAttributeValue as ProductAttributeValueType,
  Order as OrderType,
  Promoter as PromoterType,
  Event as EventTypeType,
  User as UserType,
  Steward as StewardType,
  StewardListing as StewardListingType,
  StewardClaim as StewardClaimType,
  PlatformSetting as PlatformSettingType,
} from "../types";

export interface IndustryType {
  id: number;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductImageType {
  id: number;
  product_id: number;
  image_url: string;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

// Chapter queries
export async function getAllChapters(): Promise<ChapterType[]> {
  const chapters = await Chapter.findAll({
    order: [["name", "ASC"]],
  });
  return chapters.map((ch) => ch.toJSON() as ChapterType);
}

export async function getChapterById(id: number): Promise<ChapterType | null> {
  const chapter = await Chapter.findByPk(id);
  return chapter ? (chapter.toJSON() as ChapterType) : null;
}

export async function getActiveCollegiateChapters(): Promise<ChapterType[]> {
  const chapters = await Chapter.findAll({
    where: {
      type: "Collegiate",
      status: "Active",
    },
    order: [["name", "ASC"]],
  });
  return chapters.map((ch) => ch.toJSON() as ChapterType);
}

export async function createChapter(chapter: {
  name: string;
  type: string;
  status?: string | null;
  chartered?: number | null;
  province?: string | null;
  city?: string | null;
  state?: string | null;
  contact_email?: string | null;
}): Promise<ChapterType> {
  const newChapter = await Chapter.create({
    name: chapter.name,
    type: chapter.type,
    status: chapter.status || null,
    chartered: chapter.chartered || null,
    province: chapter.province || null,
    city: chapter.city || null,
    state: chapter.state || null,
    contact_email: chapter.contact_email || null,
  });
  return newChapter.toJSON() as ChapterType;
}

// Industry queries
export async function getAllIndustries(
  includeInactive: boolean = false
): Promise<IndustryType[]> {
  const where: any = {};
  if (!includeInactive) {
    where.is_active = true;
  }
  const industries = await Industry.findAll({
    where,
    order: [
      ["display_order", "ASC"],
      ["name", "ASC"],
    ],
  });
  return industries.map((ind) => ind.toJSON() as Industry);
}

export async function getIndustryById(
  id: number
): Promise<IndustryType | null> {
  const industry = await Industry.findByPk(id);
  return industry ? (industry.toJSON() as IndustryType) : null;
}

export async function createIndustry(industry: {
  name: string;
  display_order?: number;
  is_active?: boolean;
}): Promise<IndustryType> {
  const newIndustry = await Industry.create({
    name: industry.name,
    display_order: industry.display_order ?? 0,
    is_active: industry.is_active ?? true,
  });
  return newIndustry.toJSON() as Industry;
}

export async function updateIndustry(
  id: number,
  updates: {
    name?: string;
    display_order?: number;
    is_active?: boolean;
  }
): Promise<IndustryType | null> {
  const industry = await Industry.findByPk(id);
  if (!industry) return null;

  if (updates.name !== undefined) industry.name = updates.name;
  if (updates.display_order !== undefined)
    industry.display_order = updates.display_order;
  if (updates.is_active !== undefined) industry.is_active = updates.is_active;

  await industry.save();
  return industry.toJSON() as IndustryType;
}

export async function deleteIndustry(id: number): Promise<boolean> {
  const industry = await Industry.findByPk(id);
  if (!industry) return false;
  await industry.destroy();
  return true;
}

// Profession queries
export async function getAllProfessions(
  includeInactive: boolean = false
): Promise<Profession[]> {
  const where: any = {};
  if (!includeInactive) {
    where.is_active = true;
  }
  const professions = await Profession.findAll({
    where,
    order: [
      ["display_order", "ASC"],
      ["name", "ASC"],
    ],
  });
  return professions.map((prof) => prof.toJSON() as any);
}

export async function getProfessionById(id: number): Promise<any | null> {
  const profession = await Profession.findByPk(id);
  return profession ? profession.toJSON() : null;
}

export async function createProfession(profession: {
  name: string;
  display_order?: number;
  is_active?: boolean;
}): Promise<any> {
  const newProfession = await Profession.create({
    name: profession.name,
    display_order: profession.display_order ?? 0,
    is_active: profession.is_active ?? true,
  });
  return newProfession.toJSON();
}

export async function updateProfession(
  id: number,
  updates: {
    name?: string;
    display_order?: number;
    is_active?: boolean;
  }
): Promise<any | null> {
  const profession = await Profession.findByPk(id);
  if (!profession) return null;

  if (updates.name !== undefined) profession.name = updates.name;
  if (updates.display_order !== undefined)
    profession.display_order = updates.display_order;
  if (updates.is_active !== undefined) profession.is_active = updates.is_active;

  await profession.save();
  return profession.toJSON();
}

export async function deleteProfession(id: number): Promise<boolean> {
  const profession = await Profession.findByPk(id);
  if (!profession) return false;
  await profession.destroy();
  return true;
}

// Platform Setting queries
export async function getPlatformSetting(
  key: string
): Promise<PlatformSettingType | null> {
  const setting = await PlatformSetting.findOne({
    where: { key },
  });
  return setting ? (setting.toJSON() as PlatformSettingType) : null;
}

export async function setPlatformSetting(
  key: string,
  value: string | null,
  description?: string | null
): Promise<PlatformSettingType> {
  const [setting] = await PlatformSetting.upsert({
    key,
    value,
    description: description || null,
  });
  return setting.toJSON() as PlatformSettingType;
}

export async function getAllPlatformSettings(): Promise<PlatformSettingType[]> {
  const settings = await PlatformSetting.findAll({
    order: [["key", "ASC"]],
  });
  return settings.map((s) => s.toJSON() as PlatformSettingType);
}

// Product Category queries
export async function getAllProductCategories(): Promise<
  ProductCategoryType[]
> {
  const categories = await ProductCategory.findAll({
    order: [
      ["display_order", "ASC"],
      ["name", "ASC"],
    ],
  });
  return categories.map((cat) => cat.toJSON() as ProductCategoryType);
}

export async function getProductCategoryById(
  id: number
): Promise<ProductCategoryType | null> {
  const category = await ProductCategory.findByPk(id);
  return category ? (category.toJSON() as ProductCategoryType) : null;
}

// Category Attribute Definition queries
export async function getCategoryAttributeDefinitions(
  categoryId: number
): Promise<CategoryAttributeDefinitionType[]> {
  const definitions = await CategoryAttributeDefinition.findAll({
    where: { category_id: categoryId },
    order: [["display_order", "ASC"]],
  });
  return definitions.map(
    (def) => def.toJSON() as CategoryAttributeDefinitionType
  );
}

export async function getCategoryAttributeDefinitionById(
  id: number
): Promise<CategoryAttributeDefinitionType | null> {
  const definition = await CategoryAttributeDefinition.findByPk(id);
  return definition
    ? (definition.toJSON() as CategoryAttributeDefinitionType)
    : null;
}

// Event Type queries
export async function getAllEventTypes(): Promise<
  Array<{
    id: number;
    enum: string;
    description: string;
    display_order: number;
  }>
> {
  const eventTypes = await EventType.findAll({
    where: { is_active: true },
    order: [["display_order", "ASC"]],
  });
  return eventTypes.map((et) => ({
    id: et.id,
    enum: et.enum,
    description: et.description,
    display_order: et.display_order,
  }));
}

export async function getAllEventAudienceTypes(): Promise<
  Array<{
    id: number;
    enum: string;
    description: string;
    display_order: number;
  }>
> {
  const audienceTypes = await EventAudienceType.findAll({
    where: { is_active: true },
    order: [["display_order", "ASC"]],
  });
  return audienceTypes.map((at) => ({
    id: at.id,
    enum: at.enum,
    description: at.description,
    display_order: at.display_order,
  }));
}

// Seller queries
export async function createSeller(seller: {
  user_id?: number | null;
  email: string;
  name: string;
  sponsoring_chapter_id: number;
  business_name?: string | null;
  business_email?: string | null;
  kappa_vendor_id?: string | null;
  merchandise_type?: "KAPPA" | "NON_KAPPA" | string | null; // Allow string for comma-separated values
  website?: string | null;
  slug?: string | null;
  headshot_url?: string;
  store_logo_url?: string;
  social_links?: Record<string, string>;
}): Promise<SellerType> {
  // Handle merchandise_type - if it's a comma-separated string, use it directly
  // Otherwise convert single value to string
  let merchandiseTypeValue: string | null = null;
  if (seller.merchandise_type) {
    if (typeof seller.merchandise_type === "string") {
      merchandiseTypeValue = seller.merchandise_type;
    } else {
      merchandiseTypeValue = seller.merchandise_type;
    }
  }

  const newSeller = await Seller.create({
    user_id: seller.user_id || null,
    email: seller.email,
    name: seller.name,
    sponsoring_chapter_id: seller.sponsoring_chapter_id,
    business_name: seller.business_name || null,
    business_email: seller.business_email || null,
    kappa_vendor_id: seller.kappa_vendor_id || null,
    merchandise_type: merchandiseTypeValue as any, // Cast to any since DB might need ENUM but we're storing string
    website: seller.website || null,
    slug: seller.slug || null,
    headshot_url: seller.headshot_url || null,
    store_logo_url: seller.store_logo_url || null,
    social_links: seller.social_links || {},
    status: "PENDING",
  });
  return newSeller.toJSON() as SellerType;
}

export async function checkSlugAvailability(
  slug: string
): Promise<boolean> {
  const seller = await Seller.findOne({
    where: { slug },
  });
  return !seller;
}

export async function getSellerBySlug(
  slug: string
): Promise<SellerType | null> {
  const seller = await Seller.findOne({
    where: { slug },
  });
  return seller ? (seller.toJSON() as SellerType) : null;
}

export async function getSellerById(id: number): Promise<SellerType | null> {
  const seller = await Seller.findByPk(id);
  return seller ? (seller.toJSON() as SellerType) : null;
}

export async function getSellerByEmail(
  email: string
): Promise<SellerType | null> {
  const seller = await Seller.findOne({
    where: { email },
  });
  return seller ? (seller.toJSON() as SellerType) : null;
}

export async function getPendingSellers(): Promise<SellerType[]> {
  const sellers = await Seller.findAll({
    where: { status: "PENDING" },
    order: [["created_at", "DESC"]],
  });
  return sellers.map((s) => s.toJSON() as SellerType);
}

export async function updateSellerStatus(
  id: number,
  status: "PENDING" | "APPROVED" | "REJECTED",
  stripe_account_id?: string
): Promise<SellerType> {
  const seller = await Seller.findByPk(id);
  if (!seller) throw new Error("Seller not found");

  seller.status = status;
  if (stripe_account_id) {
    seller.stripe_account_id = stripe_account_id;
  }
  await seller.save();
  return seller.toJSON() as SellerType;
}

export async function updateSellerInvitationToken(
  sellerId: number,
  invitationToken: string | null
): Promise<void> {
  await Seller.update(
    { invitation_token: invitationToken },
    { where: { id: sellerId } }
  );
}

export async function getSellerByInvitationToken(
  invitationToken: string
): Promise<SellerType | null> {
  const seller = await Seller.findOne({
    where: {
      invitation_token: invitationToken,
      status: "APPROVED",
    },
  });
  return seller ? (seller.toJSON() as SellerType) : null;
}

// Product queries
export async function createProduct(product: {
  seller_id: number;
  name: string;
  description: string;
  price_cents: number;
  image_url?: string;
  category_id?: number | null;
  is_kappa_branded?: boolean;
}): Promise<ProductType> {
  const newProduct = await Product.create({
    seller_id: product.seller_id,
    name: product.name,
    description: product.description,
    price_cents: product.price_cents,
    image_url: product.image_url || null,
    category_id: product.category_id || null,
    is_kappa_branded: product.is_kappa_branded ?? false,
  });
  return newProduct.toJSON() as ProductType;
}

export async function getProductById(id: number): Promise<ProductType | null> {
  const product = await Product.findByPk(id, {
    include: [
      {
        model: Seller,
        as: "seller",
      },
      {
        model: ProductCategory,
        as: "category",
      },
    ],
  });

  if (!product) return null;

  // Load attributes and images separately
  const attributes = await getProductAttributeValues(id);
  const images = await getProductImages(id);

  const productData = product.toJSON() as any;

  // Get fraternity member info via email matching (fraternity_member_id column was removed)
  const sellerEmail = productData.seller?.email;
  let memberId: number | null = null;
  let memberData: any = null;

  if (sellerEmail) {
    const memberResult = await sequelize.query(
      `SELECT id, initiated_chapter_id, initiated_season, initiated_year 
       FROM fraternity_members 
       WHERE email = :email`,
      {
        replacements: { email: sellerEmail },
        type: QueryTypes.SELECT,
      }
    );
    if ((memberResult as any[]).length > 0) {
      memberData = memberResult[0];
      memberId = (memberData as any).id;
    }
  }

  // Check if seller is also a steward or promoter (via email matching with fraternity_members)
  const stewardCheck = memberId
    ? await sequelize.query(
        `SELECT st.id FROM stewards st
     JOIN users u ON st.user_id = u.id
     JOIN fraternity_members m ON (u.email = m.email OR u.cognito_sub = m.cognito_sub)
     WHERE m.id = :memberId AND st.status = 'APPROVED'`,
        {
          replacements: { memberId },
          type: QueryTypes.SELECT,
        }
      )
    : [];

  const promoterCheck = sellerEmail
    ? await sequelize.query(
        `SELECT id FROM promoters WHERE email = :email AND status = 'APPROVED'`,
        {
          replacements: { email: sellerEmail },
          type: QueryTypes.SELECT,
        }
      )
    : [];

  // Transform to match existing return format
  return {
    ...productData,
    seller_name: productData.seller?.name,
    seller_business_name: productData.seller?.business_name,
    seller_status: productData.seller?.status,
    seller_stripe_account_id: productData.seller?.stripe_account_id,
    seller_fraternity_member_id: memberId,
    seller_initiated_chapter_id: memberData?.initiated_chapter_id || null,
    seller_initiated_season: memberData?.initiated_season || null,
    seller_initiated_year: memberData?.initiated_year || null,
    seller_sponsoring_chapter_id: productData.seller?.sponsoring_chapter_id,
    seller_email: sellerEmail,
    category_name: productData.category?.name,
    is_fraternity_member: !!memberId,
    is_seller: productData.seller?.status === "APPROVED",
    is_steward: (stewardCheck as any[]).length > 0,
    is_promoter: (promoterCheck as any[]).length > 0,
    attributes,
    images,
  } as ProductType;
}

export async function getActiveProducts(): Promise<ProductType[]> {
  // Use raw SQL for complex query with multiple LEFT JOINs and CASE statements
  const result = await sequelize.query(
    `SELECT p.*, 
            s.name as seller_name, 
            s.business_name as seller_business_name, 
            s.status as seller_status, 
            s.stripe_account_id as seller_stripe_account_id,
            m.id as seller_fraternity_member_id,
            m.initiated_chapter_id as seller_initiated_chapter_id,
            m.initiated_season as seller_initiated_season,
            m.initiated_year as seller_initiated_year,
            s.sponsoring_chapter_id as seller_sponsoring_chapter_id,
            s.email as seller_email,
            CASE WHEN m.id IS NOT NULL THEN true ELSE false END as is_fraternity_member,
            CASE WHEN s.status = 'APPROVED' THEN true ELSE false END as is_seller,
            CASE WHEN st.id IS NOT NULL THEN true ELSE false END as is_steward,
            CASE WHEN pr.id IS NOT NULL THEN true ELSE false END as is_promoter
     FROM products p
     JOIN sellers s ON p.seller_id = s.id
     LEFT JOIN fraternity_members m ON s.email = m.email
     LEFT JOIN users u_st ON u_st.email = m.email OR u_st.cognito_sub = m.cognito_sub
     LEFT JOIN stewards st ON st.user_id = u_st.id AND st.status = 'APPROVED'
     LEFT JOIN promoters pr ON s.email = pr.email AND pr.status = 'APPROVED'
     WHERE s.status = 'APPROVED' AND p.status = 'ACTIVE'
     ORDER BY p.created_at DESC`,
    { type: QueryTypes.SELECT }
  );

  // Load attributes and images for all products
  const productsWithAttributes = await Promise.all(
    (result as any[]).map(async (product: any) => {
      const attributes = await getProductAttributeValues(product.id);
      const images = await getProductImages(product.id);
      return { ...product, attributes, images };
    })
  );

  return productsWithAttributes as ProductType[];
}

export async function getProductsBySeller(
  sellerId: number
): Promise<ProductType[]> {
  // Use raw SQL for complex query
  const result = await sequelize.query(
    `SELECT p.*, 
            s.name as seller_name, 
            s.business_name as seller_business_name, 
            s.status as seller_status, 
            s.stripe_account_id as seller_stripe_account_id,
            m.id as seller_fraternity_member_id,
            m.initiated_chapter_id as seller_initiated_chapter_id,
            m.initiated_season as seller_initiated_season,
            m.initiated_year as seller_initiated_year,
            s.sponsoring_chapter_id as seller_sponsoring_chapter_id,
            s.email as seller_email,
            CASE WHEN m.id IS NOT NULL THEN true ELSE false END as is_fraternity_member,
            CASE WHEN s.status = 'APPROVED' THEN true ELSE false END as is_seller,
            CASE WHEN st.id IS NOT NULL THEN true ELSE false END as is_steward,
            CASE WHEN pr.id IS NOT NULL THEN true ELSE false END as is_promoter
     FROM products p
     JOIN sellers s ON p.seller_id = s.id
     LEFT JOIN fraternity_members m ON s.email = m.email
     LEFT JOIN users u_st ON u_st.email = m.email OR u_st.cognito_sub = m.cognito_sub
     LEFT JOIN stewards st ON st.user_id = u_st.id AND st.status = 'APPROVED'
     LEFT JOIN promoters pr ON s.email = pr.email AND pr.status = 'APPROVED'
     WHERE p.seller_id = :sellerId AND p.status IN ('ACTIVE', 'PENDING')
     ORDER BY p.created_at DESC`,
    {
      replacements: { sellerId },
      type: QueryTypes.SELECT,
    }
  );

  // Load attributes and images for all products
  const productsWithAttributes = await Promise.all(
    (result as any[]).map(async (product: any) => {
      const attributes = await getProductAttributeValues(product.id);
      const images = await getProductImages(product.id);
      return { ...product, attributes, images };
    })
  );

  return productsWithAttributes as ProductType[];
}

export async function updateProduct(
  id: number,
  updates: {
    name?: string;
    description?: string | null;
    price_cents?: number;
    image_url?: string | null;
    category_id?: number | null;
    is_kappa_branded?: boolean;
    status?: 'ACTIVE' | 'INACTIVE' | 'ADMIN_DELETE' | 'PENDING' | 'SOLD' | 'SHIPPED' | 'CLOSED';
  }
): Promise<ProductType | null> {
  const product = await Product.findByPk(id);
  if (!product) return null;

  if (updates.name !== undefined) product.name = updates.name;
  if (updates.description !== undefined)
    product.description = updates.description;
  if (updates.price_cents !== undefined)
    product.price_cents = updates.price_cents;
  if (updates.image_url !== undefined) product.image_url = updates.image_url;
  if (updates.category_id !== undefined)
    product.category_id = updates.category_id;
  if (updates.is_kappa_branded !== undefined)
    product.is_kappa_branded = updates.is_kappa_branded;
  if (updates.status !== undefined) product.status = updates.status;

  await product.save();
  return product.toJSON() as ProductType;
}

export async function updateProductStatus(
  id: number,
  status: 'ACTIVE' | 'INACTIVE' | 'ADMIN_DELETE' | 'PENDING' | 'SOLD' | 'SHIPPED' | 'CLOSED'
): Promise<ProductType | null> {
  const product = await Product.findByPk(id);
  if (!product) return null;

  product.status = status;
  await product.save();
  return product.toJSON() as ProductType;
}

export async function deleteProduct(
  productId: number
): Promise<ProductType | null> {
  const product = await Product.findByPk(productId);
  if (!product) return null;

  product.status = 'ADMIN_DELETE';
  await product.save();
  return product.toJSON() as ProductType;
}

export async function getAllProducts(): Promise<ProductType[]> {
  // Get all products regardless of status (for admin view)
  const result = await sequelize.query(
    `SELECT p.*, 
            s.name as seller_name, 
            s.business_name as seller_business_name, 
            s.status as seller_status, 
            s.stripe_account_id as seller_stripe_account_id,
            m.id as seller_fraternity_member_id,
            m.initiated_chapter_id as seller_initiated_chapter_id,
            m.initiated_season as seller_initiated_season,
            m.initiated_year as seller_initiated_year,
            s.sponsoring_chapter_id as seller_sponsoring_chapter_id,
            s.email as seller_email,
            CASE WHEN m.id IS NOT NULL THEN true ELSE false END as is_fraternity_member,
            CASE WHEN s.status = 'APPROVED' THEN true ELSE false END as is_seller,
            CASE WHEN st.id IS NOT NULL THEN true ELSE false END as is_steward,
            CASE WHEN pr.id IS NOT NULL THEN true ELSE false END as is_promoter
     FROM products p
     JOIN sellers s ON p.seller_id = s.id
     LEFT JOIN fraternity_members m ON s.email = m.email
     LEFT JOIN users u_st ON u_st.email = m.email OR u_st.cognito_sub = m.cognito_sub
     LEFT JOIN stewards st ON st.user_id = u_st.id AND st.status = 'APPROVED'
     LEFT JOIN promoters pr ON s.email = pr.email AND pr.status = 'APPROVED'
     ORDER BY p.created_at DESC`,
    { type: QueryTypes.SELECT }
  );

  // Load attributes and images for all products
  const productsWithAttributes = await Promise.all(
    (result as any[]).map(async (product: any) => {
      const attributes = await getProductAttributeValues(product.id);
      const images = await getProductImages(product.id);
      return { ...product, attributes, images };
    })
  );

  return productsWithAttributes as ProductType[];
}

export async function getProductWithOwnerInfo(
  productId: number
): Promise<(ProductType & { owner_email: string; owner_name: string }) | null> {
  const result = await sequelize.query(
    `SELECT p.*, 
            s.name as owner_name,
            s.email as owner_email,
            s.business_name as seller_business_name
     FROM products p
     JOIN sellers s ON p.seller_id = s.id
     WHERE p.id = :productId`,
    {
      replacements: { productId },
      type: QueryTypes.SELECT,
    }
  );

  if ((result as any[]).length === 0) return null;

  const product = result[0] as any;
  const attributes = await getProductAttributeValues(productId);
  const images = await getProductImages(productId);

  return { ...product, attributes, images } as ProductType & {
    owner_email: string;
    owner_name: string;
  };
}


// Product Attribute Value queries
export async function getProductAttributeValues(
  productId: number
): Promise<ProductAttributeValueType[]> {
  const values = await ProductAttributeValue.findAll({
    where: { product_id: productId },
    include: [
      {
        model: CategoryAttributeDefinition,
        as: "attributeDefinition",
      },
    ],
    order: [
      [
        { model: CategoryAttributeDefinition, as: "attributeDefinition" },
        "display_order",
        "ASC",
      ],
    ],
  });

  return values.map((v) => {
    const val = v.toJSON() as any;
    return {
      ...val,
      attribute_name: val.attributeDefinition?.attribute_name,
      attribute_type: val.attributeDefinition?.attribute_type,
      display_order: val.attributeDefinition?.display_order,
    } as ProductAttributeValueType;
  });
}

export async function setProductAttributeValue(
  productId: number,
  attributeDefinitionId: number,
  value: { text?: string; number?: number; boolean?: boolean }
): Promise<ProductAttributeValueType> {
  const [attributeValue] = await ProductAttributeValue.upsert({
    product_id: productId,
    attribute_definition_id: attributeDefinitionId,
    value_text: value.text || null,
    value_number: value.number || null,
    value_boolean: value.boolean ?? null,
  });
  return attributeValue.toJSON() as ProductAttributeValueType;
}

export async function deleteProductAttributeValue(
  productId: number,
  attributeDefinitionId: number
): Promise<void> {
  await ProductAttributeValue.destroy({
    where: {
      product_id: productId,
      attribute_definition_id: attributeDefinitionId,
    },
  });
}

// Product Image queries
export async function getProductImages(
  productId: number
): Promise<ProductImageType[]> {
  const images = await ProductImage.findAll({
    where: { product_id: productId },
    order: [
      ["display_order", "ASC"],
      ["id", "ASC"],
    ],
  });
  return images.map((img) => img.toJSON() as ProductImageType);
}

export async function addProductImage(
  productId: number,
  imageUrl: string,
  displayOrder: number = 0
): Promise<ProductImageType> {
  const image = await ProductImage.create({
    product_id: productId,
    image_url: imageUrl,
    display_order: displayOrder,
  });
  return image.toJSON() as ProductImageType;
}

export async function deleteProductImage(imageId: number): Promise<void> {
  await ProductImage.destroy({
    where: { id: imageId },
  });
}

export async function updateProductImageOrder(
  imageId: number,
  displayOrder: number
): Promise<void> {
  await ProductImage.update(
    { display_order: displayOrder },
    { where: { id: imageId } }
  );
}

// Order queries
export async function createOrder(order: {
  product_id: number;
  user_id: number;
  amount_cents: number;
  stripe_session_id: string;
  chapter_id?: number;
  shipping_street?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  shipping_country?: string;
}): Promise<OrderType> {
  const newOrder = await Order.create({
    product_id: order.product_id,
    user_id: order.user_id,
    amount_cents: order.amount_cents,
    stripe_session_id: order.stripe_session_id,
    chapter_id: order.chapter_id || null,
    status: "PENDING",
    shipping_street: order.shipping_street || null,
    shipping_city: order.shipping_city || null,
    shipping_state: order.shipping_state || null,
    shipping_zip: order.shipping_zip || null,
    shipping_country: order.shipping_country || "US",
  });
  return newOrder.toJSON() as OrderType;
}

export async function getOrderByStripeSessionId(
  stripeSessionId: string
): Promise<OrderType | null> {
  const order = await Order.findOne({
    where: { stripe_session_id: stripeSessionId },
  });
  return order ? (order.toJSON() as OrderType) : null;
}

export async function updateOrderStatus(
  id: number,
  status: "PENDING" | "PAID" | "FAILED"
): Promise<OrderType> {
  const order = await Order.findByPk(id);
  if (!order) throw new Error("Order not found");
  order.status = status;
  await order.save();
  return order.toJSON() as OrderType;
}

export async function getAllOrders(): Promise<OrderType[]> {
  // Use raw SQL for complex join query
  const result = await sequelize.query(
    `SELECT o.*, p.name as product_name, s.name as seller_name, c.name as chapter_name
     FROM orders o
     JOIN products p ON o.product_id = p.id
     JOIN sellers s ON p.seller_id = s.id
     LEFT JOIN chapters c ON o.chapter_id = c.id
     ORDER BY o.created_at DESC`,
    { type: QueryTypes.SELECT }
  );
  return result as OrderType[];
}

export async function getChapterDonations(): Promise<
  Array<{
    chapter_id: number;
    chapter_name: string;
    total_donations_cents: number;
  }>
> {
  // Keep as raw SQL for aggregation
  const result = await sequelize.query(
    `SELECT 
       o.chapter_id,
       c.name as chapter_name,
       SUM(o.amount_cents * 0.03) as total_donations_cents
     FROM orders o
     LEFT JOIN chapters c ON o.chapter_id = c.id
     WHERE o.status = 'PAID' AND o.chapter_id IS NOT NULL
     GROUP BY o.chapter_id, c.name
     ORDER BY total_donations_cents DESC`,
    { type: QueryTypes.SELECT }
  );
  return result as Array<{
    chapter_id: number;
    chapter_name: string;
    total_donations_cents: number;
  }>;
}

export async function getTotalDonations(): Promise<number> {
  // Keep as raw SQL for aggregation
  const result = await sequelize.query(
    `SELECT SUM(o.amount_cents * 0.03) as total_donations_cents
     FROM orders o
     WHERE o.status = 'PAID' AND o.chapter_id IS NOT NULL`,
    { type: QueryTypes.SELECT }
  );
  return (result[0] as any)?.total_donations_cents || 0;
}

// Promoter queries
export async function createPromoter(promoter: {
  user_id?: number | null;
  email: string;
  name: string;
  sponsoring_chapter_id?: number;
  headshot_url?: string;
  social_links?: Record<string, string>;
}): Promise<PromoterType> {
  const newPromoter = await Promoter.create({
    user_id: promoter.user_id || null,
    email: promoter.email,
    name: promoter.name,
    sponsoring_chapter_id: promoter.sponsoring_chapter_id || null,
    headshot_url: promoter.headshot_url || null,
    social_links: promoter.social_links || {},
    status: "PENDING",
  });
  return newPromoter.toJSON() as PromoterType;
}

export async function getPromoterById(
  id: number
): Promise<PromoterType | null> {
  const promoter = await Promoter.findByPk(id);
  return promoter ? (promoter.toJSON() as PromoterType) : null;
}

export async function getPromoterByEmail(
  email: string
): Promise<PromoterType | null> {
  const promoter = await Promoter.findOne({
    where: { email },
  });
  return promoter ? (promoter.toJSON() as PromoterType) : null;
}

export async function getPendingPromoters(): Promise<PromoterType[]> {
  const promoters = await Promoter.findAll({
    where: { status: "PENDING" },
    order: [["created_at", "DESC"]],
  });
  return promoters.map((p) => p.toJSON() as PromoterType);
}

export async function updatePromoterStatus(
  id: number,
  status: "PENDING" | "APPROVED" | "REJECTED",
  stripe_account_id?: string
): Promise<PromoterType> {
  const promoter = await Promoter.findByPk(id);
  if (!promoter) throw new Error("Promoter not found");

  promoter.status = status;
  if (stripe_account_id) {
    promoter.stripe_account_id = stripe_account_id;
  }
  await promoter.save();
  return promoter.toJSON() as PromoterType;
}

// Event queries
export async function createEvent(event: {
  promoter_id: number;
  title: string;
  description?: string;
  event_date: Date;
  location: string;
  city?: string;
  state?: string;
  image_url?: string;
  sponsored_chapter_id: number;
  event_type_id: number;
  event_audience_type_id: number;
  all_day?: boolean;
  duration_minutes?: number;
  event_link?: string;
  is_featured?: boolean;
  featured_payment_status?:
    | "UNPAID"
    | "PENDING"
    | "PAID"
    | "FAILED"
    | "REFUNDED";
  stripe_payment_intent_id?: string;
  ticket_price_cents?: number;
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
  dress_code_notes?: string;
  status?: "ACTIVE" | "CLOSED" | "CANCELLED";
  is_recurring?: boolean;
  recurrence_rule?: string | null;
  recurrence_end_date?: Date | null;
  affiliated_chapter_ids?: number[];
}): Promise<EventTypeType> {
  const newEvent = await Event.create({
    promoter_id: event.promoter_id,
    title: event.title,
    description: event.description || null,
    event_date: event.event_date,
    location: event.location,
    city: event.city || null,
    state: event.state || null,
    image_url: event.image_url || null,
    sponsored_chapter_id: event.sponsored_chapter_id,
    event_type_id: event.event_type_id,
    event_audience_type_id: event.event_audience_type_id,
    all_day: event.all_day || false,
    duration_minutes: event.duration_minutes || null,
    event_link: event.event_link || null,
    is_recurring: event.is_recurring || false,
    recurrence_rule: event.recurrence_rule || null,
    recurrence_end_date: event.recurrence_end_date || null,
    is_featured: event.is_featured || false,
    featured_payment_status: event.featured_payment_status || "UNPAID",
    stripe_payment_intent_id: event.stripe_payment_intent_id || null,
    ticket_price_cents: event.ticket_price_cents || 0,
    dress_codes: event.dress_codes,
    dress_code_notes: event.dress_code_notes || null,
    status: event.status || "ACTIVE",
  });

  if (event.affiliated_chapter_ids && event.affiliated_chapter_ids.length > 0) {
    await EventAffiliatedChapter.bulkCreate(
      event.affiliated_chapter_ids.map((chapterId) => ({
        event_id: newEvent.id,
        chapter_id: chapterId,
      }))
    );
  }

  return newEvent.toJSON() as EventTypeType;
}

export async function getEventById(id: number): Promise<EventTypeType | null> {
  // Use raw SQL for complex query with multiple joins
  const result = await sequelize.query(
    `SELECT e.*,
            pr.name as promoter_name,
            pr.email as promoter_email,
            m.id as promoter_fraternity_member_id,
            pr.sponsoring_chapter_id as promoter_sponsoring_chapter_id,
            m.initiated_chapter_id as promoter_initiated_chapter_id,
            m.initiated_season as promoter_initiated_season,
            m.initiated_year as promoter_initiated_year,
            eat.description as event_audience_type_description,
            et.description as event_type_description,
            CASE WHEN m.id IS NOT NULL THEN true ELSE false END as is_fraternity_member,
            CASE WHEN pr.status = 'APPROVED' THEN true ELSE false END as is_promoter,
            CASE WHEN st.id IS NOT NULL THEN true ELSE false END as is_steward,
            CASE WHEN s.id IS NOT NULL AND s.status = 'APPROVED' THEN true ELSE false END as is_seller
     FROM events e
     JOIN promoters pr ON e.promoter_id = pr.id
     LEFT JOIN fraternity_members m ON pr.email = m.email
     LEFT JOIN users u_st ON u_st.email = m.email OR u_st.cognito_sub = m.cognito_sub
     LEFT JOIN stewards st ON st.user_id = u_st.id AND st.status = 'APPROVED'
     LEFT JOIN sellers s ON pr.email = s.email AND s.status = 'APPROVED'
     LEFT JOIN event_audience_types eat ON e.event_audience_type_id = eat.id
     LEFT JOIN event_types et ON e.event_type_id = et.id
     WHERE e.id = :id`,
    {
      replacements: { id },
      type: QueryTypes.SELECT,
    }
  );
  
  const event = (result[0] as EventTypeType) || null;
  
  if (event) {
    const affiliatedChapters = await EventAffiliatedChapter.findAll({
      where: { event_id: id },
      include: [Chapter],
    });
    
    event.affiliated_chapters = affiliatedChapters.map(ac => 
      // @ts-ignore - ac.chapter is populated by include
      ac.chapter ? (ac.chapter.toJSON() as ChapterType) : null
    ).filter(c => c !== null) as ChapterType[];
  }
  
  return event;
}

import { expandEvents } from "../lib/recurrence";

export async function getActiveEvents(): Promise<EventTypeType[]> {
  // Use raw SQL for complex query
  // We fetch both upcoming one-time events AND all active recurring events (even if they started in the past)
  const result = await sequelize.query(
    `SELECT e.*, 
            p.name as promoter_name, 
            p.status as promoter_status,
            eat.description as event_audience_type_description,
            et.description as event_type_description
     FROM events e
     JOIN promoters p ON e.promoter_id = p.id
     LEFT JOIN event_audience_types eat ON e.event_audience_type_id = eat.id
     LEFT JOIN event_types et ON e.event_type_id = et.id
     WHERE p.status = 'APPROVED' 
       AND e.status = 'ACTIVE' 
       AND (
         (e.is_recurring = false AND e.event_date >= NOW())
         OR 
         (e.is_recurring = true AND (e.recurrence_end_date IS NULL OR e.recurrence_end_date >= NOW()))
       )
     ORDER BY e.event_date ASC`,
    { type: QueryTypes.SELECT }
  );

  const rawEvents = result as EventTypeType[];
  
  // Expand recurring events for the next 90 days
  return expandEvents(rawEvents);
}

export async function getAllEvents(): Promise<EventTypeType[]> {
  // Use raw SQL for complex query
  const result = await sequelize.query(
    `SELECT e.*, 
            p.name as promoter_name, 
            p.status as promoter_status,
            eat.description as event_audience_type_description,
            et.description as event_type_description
     FROM events e
     JOIN promoters p ON e.promoter_id = p.id
     LEFT JOIN event_audience_types eat ON e.event_audience_type_id = eat.id
     LEFT JOIN event_types et ON e.event_type_id = et.id
     WHERE p.status = 'APPROVED'
     ORDER BY e.event_date ASC`,
    { type: QueryTypes.SELECT }
  );
  return result as EventTypeType[];
}

export async function getEventsByPromoter(
  promoterId: number
): Promise<EventTypeType[]> {
  // Use raw SQL for complex query
  const result = await sequelize.query(
    `SELECT e.*, 
            eat.description as event_audience_type_description,
            et.description as event_type_description
     FROM events e
     LEFT JOIN event_audience_types eat ON e.event_audience_type_id = eat.id
     LEFT JOIN event_types et ON e.event_type_id = et.id
     WHERE e.promoter_id = :promoterId 
     ORDER BY e.event_date DESC`,
    {
      replacements: { promoterId },
      type: QueryTypes.SELECT,
    }
  );
  return result as EventTypeType[];
}

export async function updateEvent(
  eventId: number,
  updates: {
    title?: string;
    description?: string | null;
    event_date?: Date;
    location?: string;
    city?: string | null;
    state?: string | null;
    image_url?: string | null;
    sponsored_chapter_id?: number | null;
    event_type_id?: number | null;
    event_audience_type_id?: number | null;
    all_day?: boolean;
    duration_minutes?: number | null;
    event_link?: string | null;
    is_featured?: boolean;
    featured_payment_status?:
      | "UNPAID"
      | "PENDING"
      | "PAID"
      | "FAILED"
      | "REFUNDED";
    ticket_price_cents?: number;
    dress_codes?: string[];
    dress_code_notes?: string | null;
    status?: "ACTIVE" | "CLOSED" | "CANCELLED";
    is_recurring?: boolean;
    recurrence_rule?: string | null;
    recurrence_end_date?: Date | null;
    affiliated_chapter_ids?: number[];
  }
): Promise<EventTypeType> {
  const event = await Event.findByPk(eventId);
  if (!event) throw new Error(`Event with ID ${eventId} not found`);

  if (updates.title !== undefined) event.title = updates.title;
  if (updates.description !== undefined)
    event.description = updates.description;
  if (updates.event_date !== undefined) event.event_date = updates.event_date;
  if (updates.location !== undefined) event.location = updates.location;
  if (updates.city !== undefined) event.city = updates.city;
  if (updates.state !== undefined) event.state = updates.state;
  if (updates.image_url !== undefined) event.image_url = updates.image_url;
  if (updates.sponsored_chapter_id !== undefined)
    event.sponsored_chapter_id = updates.sponsored_chapter_id;
  if (updates.event_type_id !== undefined)
    event.event_type_id = updates.event_type_id;
  if (updates.event_audience_type_id !== undefined)
    event.event_audience_type_id = updates.event_audience_type_id;
  if (updates.all_day !== undefined) event.all_day = updates.all_day;
  if (updates.duration_minutes !== undefined)
    event.duration_minutes = updates.duration_minutes;
  if (updates.event_link !== undefined) event.event_link = updates.event_link;
  if (updates.ticket_price_cents !== undefined)
    event.ticket_price_cents = updates.ticket_price_cents;
  if (updates.dress_codes !== undefined)
    event.dress_codes = updates.dress_codes;
  if (updates.dress_code_notes !== undefined)
    event.dress_code_notes = updates.dress_code_notes;
  if (updates.is_recurring !== undefined)
    event.is_recurring = updates.is_recurring;
  if (updates.recurrence_rule !== undefined)
    event.recurrence_rule = updates.recurrence_rule;
  if (updates.recurrence_end_date !== undefined)
    event.recurrence_end_date = updates.recurrence_end_date;
  if (updates.is_featured !== undefined)
    event.is_featured = updates.is_featured;
  if (updates.featured_payment_status !== undefined)
    event.featured_payment_status = updates.featured_payment_status;
  if (updates.status !== undefined)
    event.status = updates.status;

  await event.save();

  if (updates.affiliated_chapter_ids !== undefined) {
    // Sync affiliated chapters: remove all existing and add new
    await EventAffiliatedChapter.destroy({ where: { event_id: eventId } });
    
    if (updates.affiliated_chapter_ids.length > 0) {
      await EventAffiliatedChapter.bulkCreate(
        updates.affiliated_chapter_ids.map((chapterId) => ({
          event_id: eventId,
          chapter_id: chapterId,
        }))
      );
    }
  }

  return event.toJSON() as EventTypeType;
}

export async function updateEventStatus(
  eventId: number,
  status: "ACTIVE" | "CLOSED" | "CANCELLED"
): Promise<EventTypeType> {
  const event = await Event.findByPk(eventId);
  if (!event) throw new Error(`Event with ID ${eventId} not found`);
  event.status = status;
  await event.save();
  return event.toJSON() as EventTypeType;
}

export async function deleteEvent(
  eventId: number
): Promise<EventTypeType> {
  const event = await Event.findByPk(eventId);
  if (!event) throw new Error(`Event with ID ${eventId} not found`);
  event.status = 'CANCELLED';
  await event.save();
  return event.toJSON() as EventTypeType;
}

export async function getAllEventsForAdmin(): Promise<EventTypeType[]> {
  // Get all events regardless of status (for admin view)
  const result = await sequelize.query(
    `SELECT e.*, 
            p.name as promoter_name, 
            p.status as promoter_status,
            eat.description as event_audience_type_description,
            et.description as event_type_description
     FROM events e
     JOIN promoters p ON e.promoter_id = p.id
     LEFT JOIN event_audience_types eat ON e.event_audience_type_id = eat.id
     LEFT JOIN event_types et ON e.event_type_id = et.id
     ORDER BY e.event_date DESC`,
    { type: QueryTypes.SELECT }
  );
  return result as EventTypeType[];
}

export async function getEventWithOwnerInfo(
  eventId: number
): Promise<(EventTypeType & { owner_email: string; owner_name: string }) | null> {
  const result = await sequelize.query(
    `SELECT e.*,
            p.name as owner_name,
            p.email as owner_email,
            eat.description as event_audience_type_description,
            et.description as event_type_description
     FROM events e
     JOIN promoters p ON e.promoter_id = p.id
     LEFT JOIN event_audience_types eat ON e.event_audience_type_id = eat.id
     LEFT JOIN event_types et ON e.event_type_id = et.id
     WHERE e.id = :eventId`,
    {
      replacements: { eventId },
      type: QueryTypes.SELECT,
    }
  );

  if ((result as any[]).length === 0) return null;

  return result[0] as EventTypeType & {
    owner_email: string;
    owner_name: string;
  };
}


// User queries
export async function createUser(user: {
  cognito_sub: string;
  email: string;
  role: "ADMIN" | "SELLER" | "PROMOTER" | "GUEST" | "STEWARD" | "MEMBER";
  onboarding_status?:
    | "PRE_COGNITO"
    | "COGNITO_CONFIRMED"
    | "ONBOARDING_STARTED"
    | "ONBOARDING_FINISHED";
  features?: Record<string, any>;
}): Promise<UserType> {
  const newUser = await User.create({
    cognito_sub: user.cognito_sub,
    email: user.email,
    role: user.role,
    onboarding_status: user.onboarding_status || "COGNITO_CONFIRMED",
    features: user.features || {},
  });
  return newUser.toJSON() as UserType;
}

export async function getUserByCognitoSub(
  cognitoSub: string
): Promise<UserType | null> {
  const user = await User.findOne({
    where: { cognito_sub: cognitoSub },
  });
  return user ? (user.toJSON() as UserType) : null;
}

export async function getUserByEmail(email: string): Promise<UserType | null> {
  const user = await User.findOne({
    where: { email },
  });
  return user ? (user.toJSON() as UserType) : null;
}

export async function getUserById(id: number): Promise<UserType | null> {
  const user = await User.findByPk(id);
  return user ? (user.toJSON() as UserType) : null;
}

export async function getAllAdminUsers(): Promise<UserType[]> {
  const admins = await User.findAll({
    where: { role: "ADMIN" },
  });
  return admins.map((admin) => admin.toJSON() as UserType);
}

export async function updateUserRole(
  id: number,
  role: "ADMIN" | "SELLER" | "PROMOTER" | "GUEST" | "STEWARD" | "MEMBER"
): Promise<UserType> {
  const user = await User.findByPk(id);
  if (!user) throw new Error("User not found");
  user.role = role;
  await user.save();
  return user.toJSON() as UserType;
}

export async function updateUserRoleByCognitoSub(
  cognito_sub: string,
  role: "ADMIN" | "SELLER" | "PROMOTER" | "GUEST" | "STEWARD" | "MEMBER"
): Promise<UserType> {
  const user = await User.findOne({
    where: { cognito_sub },
  });
  if (!user) throw new Error("User not found");
  user.role = role;
  await user.save();
  return user.toJSON() as UserType;
}

export async function linkUserToMember(
  userId: number,
  memberId: number
): Promise<UserType> {
  // Note: fraternity_member_id column removed - linking is done via email/cognito_sub matching
  // This function is kept for backward compatibility but doesn't set a column
  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found");
  // Verify member exists and email/cognito_sub matches
  const member = await FraternityMember.findByPk(memberId);
  if (!member) throw new Error("Fraternity member not found");
  // Ensure email or cognito_sub matches for GUEST users
  if (
    user.role === "GUEST" &&
    member.email !== user.email &&
    member.cognito_sub !== user.cognito_sub
  ) {
    throw new Error("User email/cognito_sub does not match fraternity member");
  }
  // Upgrade GUEST users to MEMBER when they link to a member profile
  if (user.role === "GUEST") {
    user.role = "MEMBER";
  }
  // Don't change role for other users (e.g., SELLER, PROMOTER, etc.)
  await user.save();
  return user.toJSON() as UserType;
}

export async function linkUserToSeller(
  userId: number,
  sellerId: number
): Promise<UserType> {
  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found");
  const seller = await Seller.findByPk(sellerId);
  if (!seller) throw new Error("Seller not found");
  seller.user_id = userId;
  await seller.save();
  user.role = "SELLER";
  await user.save();
  return user.toJSON() as UserType;
}

export async function linkUserToPromoter(
  userId: number,
  promoterId: number
): Promise<UserType> {
  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found");
  const promoter = await Promoter.findByPk(promoterId);
  if (!promoter) throw new Error("Promoter not found");
  promoter.user_id = userId;
  await promoter.save();
  user.role = "PROMOTER";
  await user.save();
  return user.toJSON() as UserType;
}

export async function linkUserToSteward(
  userId: number,
  stewardId: number
): Promise<UserType> {
  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found");
  const steward = await Steward.findByPk(stewardId);
  if (!steward) throw new Error("Steward not found");
  steward.user_id = userId;
  await steward.save();
  user.role = "STEWARD";
  await user.save();
  return user.toJSON() as UserType;
}

export async function updateUserOnboardingStatus(
  id: number,
  onboarding_status:
    | "PRE_COGNITO"
    | "COGNITO_CONFIRMED"
    | "ONBOARDING_STARTED"
    | "ONBOARDING_FINISHED"
): Promise<UserType> {
  const user = await User.findByPk(id);
  if (!user) throw new Error("User not found");
  user.onboarding_status = onboarding_status;
  await user.save();
  return user.toJSON() as UserType;
}

export async function updateUserOnboardingStatusByCognitoSub(
  cognito_sub: string,
  onboarding_status:
    | "PRE_COGNITO"
    | "COGNITO_CONFIRMED"
    | "ONBOARDING_STARTED"
    | "ONBOARDING_FINISHED"
): Promise<UserType | null> {
  const user = await User.findOne({
    where: { cognito_sub },
  });
  if (!user) return null;
  user.onboarding_status = onboarding_status;
  await user.save();
  return user.toJSON() as UserType;
}

export async function updateUserLastLogin(
  cognitoSub: string
): Promise<UserType | null> {
  const user = await User.findOne({
    where: { cognito_sub: cognitoSub },
  });
  if (!user) return null;
  user.last_login = new Date();
  await user.save();
  return user.toJSON() as UserType;
}

export async function upsertUserOnLogin(
  cognitoSub: string,
  email: string
): Promise<UserType> {
  // Try to find existing user by cognito_sub
  let user = await User.findOne({
    where: { cognito_sub: cognitoSub },
  });

  if (user) {
    // Update existing user
    user.last_login = new Date();
    user.email = email;
    await user.save();
    return user.toJSON() as UserType;
  }

  // Try to find by email
  user = await User.findOne({
    where: { email },
  });

  if (user) {
    // Update cognito_sub if different
    if (user.cognito_sub !== cognitoSub) {
      user.cognito_sub = cognitoSub;
    }
    user.last_login = new Date();
    await user.save();
    return user.toJSON() as UserType;
  }

  // Create new user
  const newUser = await User.create({
    cognito_sub: cognitoSub,
    email,
    role: "GUEST",
    onboarding_status: "COGNITO_CONFIRMED",
    last_login: new Date(),
  });
  return newUser.toJSON() as UserType;
}

export async function updateUserFeatures(
  id: number,
  features: Record<string, any>
): Promise<UserType> {
  const user = await User.findByPk(id);
  if (!user) throw new Error("User not found");
  user.features = features;
  await user.save();
  return user.toJSON() as UserType;
}

// Member queries
export async function getMemberById(id: number): Promise<any | null> {
  const member = await FraternityMember.findByPk(id);
  return member ? member.toJSON() : null;
}

// Steward queries
export async function createSteward(steward: {
  user_id?: number | null;
  sponsoring_chapter_id: number;
}): Promise<StewardType> {
  const newSteward = await Steward.create({
    user_id: steward.user_id || null,
    sponsoring_chapter_id: steward.sponsoring_chapter_id,
    status: "PENDING",
  });
  return newSteward.toJSON() as StewardType;
}

export async function getStewardById(id: number): Promise<StewardType | null> {
  const steward = await Steward.findByPk(id);
  return steward ? (steward.toJSON() as StewardType) : null;
}

export async function getStewardByFraternityMemberId(
  fraternityMemberId: number
): Promise<StewardType | null> {
  // Find steward via users table -> cognito_sub/email -> fraternity_members
  const member = await FraternityMember.findByPk(fraternityMemberId);
  if (!member) return null;

  const result = await sequelize.query(
    `SELECT st.* FROM stewards st
     JOIN users u ON st.user_id = u.id
     WHERE (u.email = :email OR u.cognito_sub = :cognitoSub)
     LIMIT 1`,
    {
      replacements: { email: member.email, cognitoSub: member.cognito_sub },
      type: QueryTypes.SELECT,
    }
  );

  return result.length > 0 ? (result[0] as StewardType) : null;
}

export async function getPendingStewards(): Promise<StewardType[]> {
  const stewards = await Steward.findAll({
    where: { status: "PENDING" },
    order: [["created_at", "DESC"]],
  });
  return stewards.map((s) => s.toJSON() as StewardType);
}

export async function updateStewardStatus(
  id: number,
  status: "PENDING" | "APPROVED" | "REJECTED"
): Promise<StewardType> {
  const steward = await Steward.findByPk(id);
  if (!steward) throw new Error("Steward not found");
  steward.status = status;
  await steward.save();
  return steward.toJSON() as StewardType;
}

// Steward Listing queries
export async function createStewardListing(listing: {
  steward_id: number;
  name: string;
  description?: string | null;
  image_url?: string | null;
  shipping_cost_cents: number;
  chapter_donation_cents: number;
  sponsoring_chapter_id: number;
  category_id?: number | null;
}): Promise<StewardListingType> {
  const newListing = await StewardListing.create({
    steward_id: listing.steward_id,
    name: listing.name,
    description: listing.description || null,
    image_url: listing.image_url || null,
    shipping_cost_cents: listing.shipping_cost_cents,
    chapter_donation_cents: listing.chapter_donation_cents,
    sponsoring_chapter_id: listing.sponsoring_chapter_id,
    status: "ACTIVE",
  });
  return newListing.toJSON() as StewardListingType;
}

export async function getStewardListingImages(
  listingId: number
): Promise<Array<{ id: number; image_url: string; display_order: number }>> {
  const images = await StewardListingImage.findAll({
    where: { steward_listing_id: listingId },
    order: [
      ["display_order", "ASC"],
      ["id", "ASC"],
    ],
  });
  return images.map((img) => ({
    id: img.id,
    image_url: img.image_url,
    display_order: img.display_order,
  }));
}

export async function addStewardListingImage(
  listingId: number,
  imageUrl: string,
  displayOrder: number = 0
): Promise<{ id: number; image_url: string; display_order: number }> {
  const image = await StewardListingImage.create({
    steward_listing_id: listingId,
    image_url: imageUrl,
    display_order: displayOrder,
  });
  return {
    id: image.id,
    image_url: image.image_url,
    display_order: image.display_order,
  };
}

export async function getStewardListingById(
  id: number
): Promise<StewardListingType | null> {
  const listing = await StewardListing.findByPk(id);
  return listing ? (listing.toJSON() as StewardListingType) : null;
}

export async function getStewardListings(
  stewardId: number
): Promise<StewardListingType[]> {
  const listings = await StewardListing.findAll({
    where: { steward_id: stewardId },
    order: [["created_at", "DESC"]],
  });
  return listings.map((l) => l.toJSON() as StewardListingType);
}

export async function getActiveStewardListings(): Promise<
  StewardListingType[]
> {
  // Use raw SQL for join query
  const result = await sequelize.query(
    `SELECT sl.*, s.status as steward_status
     FROM steward_listings sl
     JOIN stewards s ON sl.steward_id = s.id
     WHERE sl.status = 'ACTIVE' AND s.status = 'APPROVED'
     ORDER BY sl.created_at DESC`,
    { type: QueryTypes.SELECT }
  );
  return result as StewardListingType[];
}

export async function updateStewardListing(
  id: number,
  updates: {
    name?: string;
    description?: string | null;
    image_url?: string | null;
    shipping_cost_cents?: number;
    chapter_donation_cents?: number;
    status?: "ACTIVE" | "CLAIMED" | "REMOVED";
  }
): Promise<StewardListingType | null> {
  const listing = await StewardListing.findByPk(id);
  if (!listing) return null;

  if (updates.name !== undefined) listing.name = updates.name;
  if (updates.description !== undefined)
    listing.description = updates.description;
  if (updates.image_url !== undefined) listing.image_url = updates.image_url;
  if (updates.shipping_cost_cents !== undefined)
    listing.shipping_cost_cents = updates.shipping_cost_cents;
  if (updates.chapter_donation_cents !== undefined)
    listing.chapter_donation_cents = updates.chapter_donation_cents;
  if (updates.status !== undefined) listing.status = updates.status;

  await listing.save();
  return listing.toJSON() as StewardListingType;
}

export async function claimStewardListing(
  listingId: number,
  claimantMemberId: number
): Promise<StewardListingType | null> {
  const listing = await StewardListing.findOne({
    where: {
      id: listingId,
      status: "ACTIVE",
    },
  });
  if (!listing) return null;

  listing.status = "CLAIMED";
  listing.claimed_by_fraternity_member_id = claimantMemberId;
  listing.claimed_at = new Date();
  await listing.save();
  return listing.toJSON() as StewardListingType;
}

export async function deleteStewardListing(id: number): Promise<boolean> {
  const listing = await StewardListing.findByPk(id);
  if (!listing) return false;
  listing.status = "REMOVED";
  await listing.save();
  return true;
}

// Steward Claim queries
export async function createStewardClaim(claim: {
  listing_id: number;
  claimant_fraternity_member_id: number;
  stripe_session_id: string;
  total_amount_cents: number;
  shipping_cents: number;
  platform_fee_cents: number;
  chapter_donation_cents: number;
}): Promise<StewardClaimType> {
  const newClaim = await StewardClaim.create({
    listing_id: claim.listing_id,
    claimant_fraternity_member_id: claim.claimant_fraternity_member_id,
    stripe_session_id: claim.stripe_session_id,
    total_amount_cents: claim.total_amount_cents,
    shipping_cents: claim.shipping_cents,
    platform_fee_cents: claim.platform_fee_cents,
    chapter_donation_cents: claim.chapter_donation_cents,
    status: "PENDING",
  });
  return newClaim.toJSON() as StewardClaimType;
}

export async function getStewardClaimByStripeSessionId(
  stripeSessionId: string
): Promise<StewardClaimType | null> {
  const claim = await StewardClaim.findOne({
    where: { stripe_session_id: stripeSessionId },
  });
  return claim ? (claim.toJSON() as StewardClaimType) : null;
}

export async function updateStewardClaimStatus(
  id: number,
  status: "PENDING" | "PAID" | "FAILED"
): Promise<StewardClaimType | null> {
  const claim = await StewardClaim.findByPk(id);
  if (!claim) return null;
  claim.status = status;
  await claim.save();
  return claim.toJSON() as StewardClaimType;
}

export async function getStewardActivity(): Promise<
  Array<{
    steward_id: number;
    steward_name: string;
    total_listings: number;
    active_listings: number;
    claimed_listings: number;
    total_donations_cents: number;
  }>
> {
  // Keep as raw SQL for complex aggregation
  const result = await sequelize.query(
    `SELECT 
      s.id as steward_id,
      m.name as steward_name,
      COUNT(sl.id) as total_listings,
      COUNT(CASE WHEN sl.status = 'ACTIVE' THEN 1 END) as active_listings,
      COUNT(CASE WHEN sl.status = 'CLAIMED' THEN 1 END) as claimed_listings,
      COALESCE(SUM(sc.chapter_donation_cents), 0) as total_donations_cents
     FROM stewards s
     JOIN users u ON s.user_id = u.id
     JOIN fraternity_members m ON (u.email = m.email OR u.cognito_sub = m.cognito_sub)
     LEFT JOIN steward_listings sl ON s.id = sl.steward_id
     LEFT JOIN steward_claims sc ON sl.id = sc.listing_id AND sc.status = 'PAID'
     GROUP BY s.id, m.name
     ORDER BY s.created_at DESC`,
    { type: QueryTypes.SELECT }
  );
  return result as Array<{
    steward_id: number;
    steward_name: string;
    total_listings: number;
    active_listings: number;
    claimed_listings: number;
    total_donations_cents: number;
  }>;
}

export async function getChapterDonationsFromStewards(): Promise<
  Array<{
    chapter_id: number;
    chapter_name: string;
    total_donations_cents: number;
    claim_count: number;
  }>
> {
  // Keep as raw SQL for complex aggregation
  const result = await sequelize.query(
    `SELECT 
      c.id as chapter_id,
      c.name as chapter_name,
      COALESCE(SUM(sc.chapter_donation_cents), 0) as total_donations_cents,
      COUNT(sc.id) as claim_count
     FROM chapters c
     LEFT JOIN steward_listings sl ON c.id = sl.sponsoring_chapter_id
     LEFT JOIN steward_claims sc ON sl.id = sc.listing_id AND sc.status = 'PAID'
     GROUP BY c.id, c.name
     HAVING COUNT(sc.id) > 0
     ORDER BY total_donations_cents DESC`,
    { type: QueryTypes.SELECT }
  );
  return result as Array<{
    chapter_id: number;
    chapter_name: string;
    total_donations_cents: number;
    claim_count: number;
  }>;
}

// Favorite queries
export interface Favorite {
  id: number;
  user_email: string;
  product_id: number;
  created_at: Date;
}

export async function addFavorite(
  userEmail: string,
  productId: number
): Promise<Favorite | null> {
  try {
    const favorite = await FavoriteModel.create({
      user_email: userEmail,
      product_id: productId,
    });
    return favorite.toJSON() as Favorite;
  } catch (error: any) {
    // If already favorited (unique constraint), return existing
    if (error.name === "SequelizeUniqueConstraintError") {
      const existing = await FavoriteModel.findOne({
        where: {
          user_email: userEmail,
          product_id: productId,
        },
      });
      return existing ? (existing.toJSON() as Favorite) : null;
    }
    throw error;
  }
}

export async function removeFavorite(
  userEmail: string,
  productId: number
): Promise<boolean> {
  const result = await FavoriteModel.destroy({
    where: {
      user_email: userEmail,
      product_id: productId,
    },
  });
  return result > 0;
}

export async function getFavoritesByUser(
  userEmail: string
): Promise<Favorite[]> {
  const favorites = await FavoriteModel.findAll({
    where: { user_email: userEmail },
    order: [["created_at", "DESC"]],
  });
  return favorites.map((f) => f.toJSON() as Favorite);
}

export async function isFavorite(
  userEmail: string,
  productId: number
): Promise<boolean> {
  const favorite = await FavoriteModel.findOne({
    where: {
      user_email: userEmail,
      product_id: productId,
    },
  });
  return !!favorite;
}

export async function getFavoriteProductsByUser(
  userEmail: string
): Promise<ProductType[]> {
  // Use raw SQL for complex query with multiple joins
  const result = await sequelize.query(
    `SELECT p.*, 
            s.name as seller_name,
            s.status as seller_status,
            s.stripe_account_id as seller_stripe_account_id,
            s.sponsoring_chapter_id as seller_sponsoring_chapter_id,
            m.initiated_chapter_id as seller_initiated_chapter_id,
            CASE WHEN m.id IS NOT NULL THEN true ELSE false END as is_fraternity_member,
            CASE WHEN s.status = 'APPROVED' THEN true ELSE false END as is_seller,
            CASE WHEN st.id IS NOT NULL THEN true ELSE false END as is_steward,
            CASE WHEN pr.id IS NOT NULL THEN true ELSE false END as is_promoter,
            f.created_at as favorited_at
     FROM favorites f
     JOIN products p ON f.product_id = p.id
     LEFT JOIN sellers s ON p.seller_id = s.id
     LEFT JOIN fraternity_members m ON s.email = m.email
     LEFT JOIN users u_st ON u_st.email = m.email OR u_st.cognito_sub = m.cognito_sub
     LEFT JOIN stewards st ON st.user_id = u_st.id AND st.status = 'APPROVED'
     LEFT JOIN promoters pr ON s.email = pr.email AND pr.status = 'APPROVED'
     WHERE f.user_email = :userEmail
     ORDER BY f.created_at DESC`,
    {
      replacements: { userEmail },
      type: QueryTypes.SELECT,
    }
  );
  return result as ProductType[];
}

export async function addSavedEvent(
  userEmail: string,
  eventId: number
): Promise<SavedEventModel | null> {
  try {
    const savedEvent = await SavedEventModel.create({
      user_email: userEmail,
      event_id: eventId,
    });
    return savedEvent;
  } catch (error: any) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return await SavedEventModel.findOne({
        where: { user_email: userEmail, event_id: eventId },
      });
    }
    throw error;
  }
}

export async function removeSavedEvent(
  userEmail: string,
  eventId: number
): Promise<boolean> {
  const result = await SavedEventModel.destroy({
    where: { user_email: userEmail, event_id: eventId },
  });
  return result > 0;
}

export async function isEventSaved(
  userEmail: string,
  eventId: number
): Promise<boolean> {
  const count = await SavedEventModel.count({
    where: { user_email: userEmail, event_id: eventId },
  });
  return count > 0;
}

export async function getSavedEventsByUser(
  userEmail: string
): Promise<any[]> {
  // Use raw SQL to get event details along with the saved status
  const result = await sequelize.query(
    `SELECT e.*, 
            c.name as chapter_name,
            et.description as event_type_description,
            eat.description as event_audience_type_description,
            p.name as promoter_name,
            se.created_at as saved_at
     FROM saved_events se
     JOIN events e ON se.event_id = e.id
     LEFT JOIN chapters c ON e.sponsored_chapter_id = c.id
     LEFT JOIN event_types et ON e.event_type_id = et.id
     LEFT JOIN event_audience_types eat ON e.event_audience_type_id = eat.id
     LEFT JOIN promoters p ON e.promoter_id = p.id
     WHERE se.user_email = :userEmail
     ORDER BY se.created_at DESC`,
    {
      replacements: { userEmail },
      type: QueryTypes.SELECT,
    }
  );
  return result;
}

// Verification queries
export async function getPendingMembersForVerification(): Promise<any[]> {
  const members = await FraternityMember.findAll({
    where: {
      registration_status: "COMPLETE",
      [Op.or]: [
        { verification_status: null },
        { verification_status: "PENDING" },
      ],
      name: { [Op.ne]: null },
      membership_number: { [Op.ne]: null },
    },
    order: [["created_at", "DESC"]],
  });
  return members.map((m) => m.toJSON());
}

export async function getPendingSellersForVerification(): Promise<
  SellerType[]
> {
  const sellers = await Seller.findAll({
    where: {
      status: "PENDING",
      [Op.or]: [
        { verification_status: null },
        { verification_status: "PENDING" },
      ],
    },
    order: [["created_at", "DESC"]],
  });
  return sellers.map((s) => s.toJSON() as SellerType);
}

export async function getPendingPromotersForVerification(): Promise<
  PromoterType[]
> {
  const promoters = await Promoter.findAll({
    where: {
      status: "PENDING",
      [Op.or]: [
        { verification_status: null },
        { verification_status: "PENDING" },
      ],
    },
    order: [["created_at", "DESC"]],
  });
  return promoters.map((p) => p.toJSON() as PromoterType);
}

export async function updateMemberVerification(
  id: number,
  verification_status: "PENDING" | "VERIFIED" | "FAILED" | "MANUAL_REVIEW",
  verification_notes?: string | null
): Promise<any> {
  const member = await FraternityMember.findByPk(id);
  if (!member) throw new Error("Member not found");
  member.verification_status = verification_status;
  member.verification_date = new Date();
  member.verification_notes = verification_notes || null;
  await member.save();
  return member.toJSON();
}

export async function updateSellerVerification(
  id: number,
  verification_status: "PENDING" | "VERIFIED" | "FAILED" | "MANUAL_REVIEW",
  verification_notes?: string | null,
  autoApprove?: boolean
): Promise<SellerType> {
  const seller = await Seller.findByPk(id);
  if (!seller) throw new Error("Seller not found");
  seller.verification_status = verification_status;
  seller.verification_date = new Date();
  seller.verification_notes = verification_notes || null;
  if (autoApprove && verification_status === "VERIFIED") {
    seller.status = "APPROVED";
  }
  await seller.save();
  return seller.toJSON() as SellerType;
}

export async function updatePromoterVerification(
  id: number,
  verification_status: "PENDING" | "VERIFIED" | "FAILED" | "MANUAL_REVIEW",
  verification_notes?: string | null,
  autoApprove?: boolean
): Promise<PromoterType> {
  const promoter = await Promoter.findByPk(id);
  if (!promoter) throw new Error("Promoter not found");
  promoter.verification_status = verification_status;
  promoter.verification_date = new Date();
  promoter.verification_notes = verification_notes || null;
  if (autoApprove && verification_status === "VERIFIED") {
    promoter.status = "APPROVED";
  }
  await promoter.save();
  return promoter.toJSON() as PromoterType;
}
