// @ts-nocheck

// Import all models
import { Chapter } from './Chapter';
import { Role } from './Role';
import { FraternityMember } from './FraternityMember';
import { Seller } from './Seller';
import { Promoter } from './Promoter';
import { Steward } from './Steward';
import { ProductCategory } from './ProductCategory';
import { CategoryAttributeDefinition } from './CategoryAttributeDefinition';
import { Product } from './Product';
import { ProductAttributeValue } from './ProductAttributeValue';
import { ProductImage } from './ProductImage';
import { User } from './User';
import { Order } from './Order';
import { UserAddress } from './UserAddress';
import { Notification } from './Notification';
import { Favorite } from './Favorite';
import { EventType } from './EventType';
import { EventAudienceType } from './EventAudienceType';
import { Event } from './Event';
import { Industry } from './Industry';
import { Profession } from './Profession';
import { PlatformSetting } from './PlatformSetting';
import { StewardListing } from './StewardListing';
import { StewardListingImage } from './StewardListingImage';
import { StewardClaim } from './StewardClaim';

/**
 * Initialize all model associations
 * This must be called after Sequelize instance is created and models are registered
 */
export function initializeAssociations(): void {
  // Define all associations

// Chapter associations
Chapter.hasMany(FraternityMember, {
  foreignKey: 'initiated_chapter_id',
  as: 'initiatedMembers'
});

Chapter.hasMany(Seller, {
  foreignKey: 'sponsoring_chapter_id',
  as: 'sellers'
});

Chapter.hasMany(Promoter, {
  foreignKey: 'sponsoring_chapter_id',
  as: 'promoters'
});

Chapter.hasMany(Steward, {
  foreignKey: 'sponsoring_chapter_id',
  as: 'stewards'
});

Chapter.hasMany(Order, {
  foreignKey: 'chapter_id',
  as: 'orders'
});

Chapter.hasMany(StewardListing, {
  foreignKey: 'sponsoring_chapter_id',
  as: 'stewardListings'
});

Chapter.hasMany(Event, {
  foreignKey: 'sponsored_chapter_id',
  as: 'sponsoredEvents'
});

// FraternityMember associations
// Note: Seller, Promoter, and Steward associations are now handled via email/cognito_sub matching
// since fraternity_member_id columns have been removed. Associations are loaded manually in queries.
// FraternityMember.hasOne(Seller, { foreignKey: 'fraternity_member_id', as: 'seller' });
// FraternityMember.hasOne(Promoter, { foreignKey: 'fraternity_member_id', as: 'promoter' });
// FraternityMember.hasOne(Steward, { foreignKey: 'fraternity_member_id', as: 'steward' });

FraternityMember.hasMany(StewardListing, {
  foreignKey: 'claimed_by_fraternity_member_id',
  as: 'claimedListings'
});

FraternityMember.hasMany(StewardClaim, {
  foreignKey: 'claimant_fraternity_member_id',
  as: 'stewardClaims'
});

// Seller associations
Seller.hasMany(Product, {
  foreignKey: 'seller_id',
  as: 'products'
});

// ProductCategory associations
ProductCategory.hasMany(CategoryAttributeDefinition, {
  foreignKey: 'category_id',
  as: 'attributeDefinitions'
});

ProductCategory.hasMany(Product, {
  foreignKey: 'category_id',
  as: 'products'
});

// CategoryAttributeDefinition associations
CategoryAttributeDefinition.hasMany(ProductAttributeValue, {
  foreignKey: 'attribute_definition_id',
  as: 'productAttributeValues'
});

// Product associations
Product.hasMany(ProductAttributeValue, {
  foreignKey: 'product_id',
  as: 'attributeValues'
});

Product.hasMany(ProductImage, {
  foreignKey: 'product_id',
  as: 'images'
});

Product.hasMany(Order, {
  foreignKey: 'product_id',
  as: 'orders'
});

Product.hasMany(Favorite, {
  foreignKey: 'product_id',
  as: 'favorites'
});

// User associations
User.hasMany(Order, {
  foreignKey: 'user_id',
  as: 'orders'
});

User.hasMany(UserAddress, {
  foreignKey: 'user_id',
  as: 'addresses'
});

// User hasOne relationships with role-specific tables (via user_id)
User.hasOne(Seller, {
  foreignKey: 'user_id',
  as: 'seller'
});

User.hasOne(Promoter, {
  foreignKey: 'user_id',
  as: 'promoter'
});

User.hasOne(Steward, {
  foreignKey: 'user_id',
  as: 'steward'
});

// FraternityMember belongsTo User (optional - not all members have user accounts)
// Note: user_id is on fraternity_members table, not users table
FraternityMember.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'userAccount'
});

// Promoter associations
Promoter.hasMany(Event, {
  foreignKey: 'promoter_id',
  as: 'events'
});

// Steward associations
Steward.hasMany(StewardListing, {
  foreignKey: 'steward_id',
  as: 'listings'
});

// StewardListing associations
StewardListing.hasMany(StewardListingImage, {
  foreignKey: 'steward_listing_id',
  as: 'images'
});

StewardListing.hasMany(StewardClaim, {
  foreignKey: 'listing_id',
  as: 'claims'
});

// EventType associations
EventType.hasMany(Event, {
  foreignKey: 'event_type_id',
  as: 'events'
});

// EventAudienceType associations
EventAudienceType.hasMany(Event, {
  foreignKey: 'event_audience_type_id',
  as: 'events'
});
}

// Export all models
export {
  Chapter,
  Role,
  FraternityMember,
  Seller,
  Promoter,
  Steward,
  ProductCategory,
  CategoryAttributeDefinition,
  Product,
  ProductAttributeValue,
  ProductImage,
  User,
  Order,
  UserAddress,
  Notification,
  Favorite,
  EventType,
  EventAudienceType,
  Event,
  Industry,
  Profession,
  PlatformSetting,
  StewardListing,
  StewardListingImage,
  StewardClaim
};

