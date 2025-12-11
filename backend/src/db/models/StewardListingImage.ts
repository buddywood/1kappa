import { Table, Column, Model, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { BaseModel } from './BaseModel';
import { StewardListing } from './StewardListing';

@Table({
  tableName: 'steward_listing_images',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
})
export class StewardListingImage extends BaseModel {
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
  steward_listing_id!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false
  })
  image_url!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0
  })
  display_order!: number;

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
  @BelongsTo(() => StewardListing, 'steward_listing_id')
  stewardListing?: StewardListing;
}







