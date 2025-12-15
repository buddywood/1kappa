import { Table, Column, Model, DataType, BelongsTo, ForeignKey, HasMany } from 'sequelize-typescript';
import { BaseModel } from './BaseModel';
import { Seller } from './Seller';
import { ProductCategory } from './ProductCategory';

@Table({
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
})
export class Product extends BaseModel {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @ForeignKey(() => Seller)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  seller_id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  description!: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  })
  price_cents!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  image_url!: string | null;

  @ForeignKey(() => ProductCategory)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  category_id!: number | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  is_kappa_branded!: boolean;

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
  @BelongsTo(() => Seller, 'seller_id')
  seller?: Seller;

  @BelongsTo(() => ProductCategory, 'category_id')
  category?: ProductCategory;
}











