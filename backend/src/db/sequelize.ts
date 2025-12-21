import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local first, then .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

// Use DATABASE_URL_TEST in test environment, otherwise use DATABASE_URL
const databaseUrl = process.env.NODE_ENV === 'test' 
  ? (process.env.DATABASE_URL_TEST || process.env.DATABASE_URL)
  : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required (or DATABASE_URL_TEST for tests)');
}

// Import all models explicitly to register them with Sequelize
import { Chapter } from './models/Chapter';
import { Role } from './models/Role';
import { FraternityMember } from './models/FraternityMember';
import { Seller } from './models/Seller';
import { Promoter } from './models/Promoter';
import { Steward } from './models/Steward';
import { ProductCategory } from './models/ProductCategory';
import { CategoryAttributeDefinition } from './models/CategoryAttributeDefinition';
import { Product } from './models/Product';
import { ProductAttributeValue } from './models/ProductAttributeValue';
import { ProductImage } from './models/ProductImage';
import { User } from './models/User';
import { Order } from './models/Order';
import { UserAddress } from './models/UserAddress';
import { Notification } from './models/Notification';
import { Favorite } from './models/Favorite';
import { EventType } from './models/EventType';
import { EventAudienceType } from './models/EventAudienceType';
import { Event } from './models/Event';
import { Industry } from './models/Industry';
import { Profession } from './models/Profession';
import { PlatformSetting } from './models/PlatformSetting';
import { StewardListing } from './models/StewardListing';
import { StewardListingImage } from './models/StewardListingImage';
import { StewardClaim } from './models/StewardClaim';
import { EventAffiliatedChapter } from './models/EventAffiliatedChapter';
import { SavedEvent } from './models/SavedEvent';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' && 
         (databaseUrl.includes('neon') || databaseUrl.includes('heroku'))
      ? { rejectUnauthorized: false }
      : false
  }
});

// Add all models to Sequelize instance
sequelize.addModels([
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
  StewardClaim,
  EventAffiliatedChapter,
  SavedEvent
]);

// Initialize associations after models are registered
import { initializeAssociations } from './models/index';
initializeAssociations();

export default sequelize;

