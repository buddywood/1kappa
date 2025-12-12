import { Table, Column, Model, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { BaseModel } from './BaseModel';
import { StewardListing } from './StewardListing';
import { FraternityMember } from './FraternityMember';

@Table({
  tableName: 'steward_claims',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
})
export class StewardClaim extends BaseModel {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @ForeignKey(() => StewardListing)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  listing_id!: number;

  @ForeignKey(() => FraternityMember)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  claimant_fraternity_member_id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    unique: true
  })
  stripe_session_id!: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  })
  total_amount_cents!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  })
  shipping_cents!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  })
  platform_fee_cents!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  })
  chapter_donation_cents!: number;

  @Column({
    type: DataType.ENUM('PENDING', 'PAID', 'FAILED'),
    defaultValue: 'PENDING'
  })
  status!: 'PENDING' | 'PAID' | 'FAILED';

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
  @BelongsTo(() => StewardListing, 'listing_id')
  listing?: StewardListing;

  @BelongsTo(() => FraternityMember, 'claimant_fraternity_member_id')
  claimantFraternityMember?: FraternityMember;
}









