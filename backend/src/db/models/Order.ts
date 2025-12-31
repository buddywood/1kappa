import { Table, Column, Model, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { BaseModel } from './BaseModel';
import { Product } from './Product';
import { User } from './User';
import { Chapter } from './Chapter';

@Table({
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
})
export class Order extends BaseModel {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  product_id!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  user_id!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  amount_cents!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    unique: true
  })
  stripe_session_id!: string | null;

  @Column({
    type: DataType.ENUM('PENDING', 'PAID', 'FAILED'),
    defaultValue: 'PENDING'
  })
  status!: 'PENDING' | 'PAID' | 'FAILED';

  @ForeignKey(() => Chapter)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  chapter_id!: number | null;

  // Shipping address fields from migration 041
  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  shipping_street!: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true
  })
  shipping_city!: string | null;

  @Column({
    type: DataType.STRING(2),
    allowNull: true
  })
  shipping_state!: string | null;

  @Column({
    type: DataType.STRING(20),
    allowNull: true
  })
  shipping_zip!: string | null;

  @Column({
    type: DataType.STRING(2),
    allowNull: true,
    defaultValue: 'US'
  })
  shipping_country!: string | null;

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
  @BelongsTo(() => Product, 'product_id')
  product?: Product;

  @BelongsTo(() => User, 'user_id')
  user?: User;

  @BelongsTo(() => Chapter, 'chapter_id')
  chapter?: Chapter;
}
















