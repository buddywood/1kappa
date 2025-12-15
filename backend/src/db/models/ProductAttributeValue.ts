import { Table, Column, Model, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { BaseModel } from './BaseModel';
import { Product } from './Product';
import { CategoryAttributeDefinition } from './CategoryAttributeDefinition';

@Table({
  tableName: 'product_attribute_values',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['product_id', 'attribute_definition_id']
    }
  ]
})
export class ProductAttributeValue extends BaseModel {
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

  @ForeignKey(() => CategoryAttributeDefinition)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  attribute_definition_id!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  value_text!: string | null;

  @Column({
    type: DataType.DECIMAL,
    allowNull: true
  })
  value_number!: number | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true
  })
  value_boolean!: boolean | null;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW
  })
  created_at!: Date;

  // Associations will be defined in index.ts
  @BelongsTo(() => Product, 'product_id')
  product?: Product;

  @BelongsTo(() => CategoryAttributeDefinition, 'attribute_definition_id')
  attributeDefinition?: CategoryAttributeDefinition;
}











