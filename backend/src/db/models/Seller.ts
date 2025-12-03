import { Table, Column, Model, DataType, BelongsTo, ForeignKey, HasMany } from 'sequelize-typescript';
import { BaseModel } from './BaseModel';
import { Chapter } from './Chapter';
import { FraternityMember } from './FraternityMember';

@Table({
  tableName: 'sellers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
})
export class Seller extends BaseModel {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true
  })
  email!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  name!: string;

  @ForeignKey(() => Chapter)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  sponsoring_chapter_id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  business_name!: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  kappa_vendor_id!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  headshot_url!: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  store_logo_url!: string | null;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
    get() {
      const value = this.getDataValue('social_links');
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return {};
        }
      }
      return value || {};
    },
    set(value: any) {
      if (typeof value === 'string') {
        this.setDataValue('social_links', value);
      } else {
        this.setDataValue('social_links', JSON.stringify(value || {}));
      }
    }
  })
  social_links!: Record<string, string>;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  stripe_account_id!: string | null;

  @Column({
    type: DataType.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    defaultValue: 'PENDING'
  })
  status!: 'PENDING' | 'APPROVED' | 'REJECTED';

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    unique: true
  })
  invitation_token!: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  business_email!: string | null;

  @Column({
    type: DataType.STRING(500),
    allowNull: true
  })
  website!: string | null;

  @Column({
    type: DataType.ENUM('PENDING', 'VERIFIED', 'FAILED', 'MANUAL_REVIEW'),
    defaultValue: 'PENDING'
  })
  verification_status!: 'PENDING' | 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW';

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  verification_date!: Date | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  verification_notes!: string | null;

  // Additional fields from migration 023
  @Column({
    type: DataType.STRING(20),
    allowNull: true
  })
  stripe_account_type!: 'company' | 'individual' | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true
  })
  tax_id!: string | null;

  @Column({
    type: DataType.STRING(50),
    allowNull: true
  })
  business_phone!: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  business_address_line1!: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  business_address_line2!: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true
  })
  business_city!: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true
  })
  business_state!: string | null;

  @Column({
    type: DataType.STRING(20),
    allowNull: true
  })
  business_postal_code!: string | null;

  @Column({
    type: DataType.STRING(2),
    allowNull: true
  })
  business_country!: string | null;

  // Additional field from migration 011
  @Column({
    type: DataType.ENUM('KAPPA', 'NON_KAPPA'),
    allowNull: true
  })
  merchandise_type!: 'KAPPA' | 'NON_KAPPA' | null;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW
  })
  created_at!: Date;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW
  })
  updated_at!: Date;

  // Associations will be defined in index.ts
  // fraternityMember association accessed via email matching
  fraternityMember?: FraternityMember;

  @BelongsTo(() => Chapter, 'sponsoring_chapter_id')
  sponsoringChapter?: Chapter;
}

