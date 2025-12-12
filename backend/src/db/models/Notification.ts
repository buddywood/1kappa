import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { BaseModel } from './BaseModel';

@Table({
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true
})
export class Notification extends BaseModel {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  user_email!: string;

  @Column({
    type: DataType.ENUM('PURCHASE_BLOCKED', 'ITEM_AVAILABLE', 'ORDER_CONFIRMED', 'ORDER_SHIPPED'),
    allowNull: false
  })
  type!: 'PURCHASE_BLOCKED' | 'ITEM_AVAILABLE' | 'ORDER_CONFIRMED' | 'ORDER_SHIPPED';

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false
  })
  message!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  related_product_id!: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  related_order_id!: number | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  is_read!: boolean;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW
  })
  created_at!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  read_at!: Date | null;
}









