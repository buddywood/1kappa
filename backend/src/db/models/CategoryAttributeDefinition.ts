import { Table, Column, Model, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { BaseModel } from './BaseModel';
import { ProductCategory } from './ProductCategory';

@Table({
  tableName: 'category_attribute_definitions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['category_id', 'attribute_name']
    }
  ]
})
export class CategoryAttributeDefinition extends BaseModel {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @ForeignKey(() => ProductCategory)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  category_id!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  attribute_name!: string;

  @Column({
    type: DataType.ENUM('TEXT', 'SELECT', 'NUMBER', 'BOOLEAN'),
    allowNull: false
  })
  attribute_type!: 'TEXT' | 'SELECT' | 'NUMBER' | 'BOOLEAN';

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  is_required!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0
  })
  display_order!: number;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    get() {
      const value = this.getDataValue('options');
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      }
      return value;
    },
    set(value: any) {
      if (typeof value === 'string') {
        this.setDataValue('options', value);
      } else {
        this.setDataValue('options', value ? JSON.stringify(value) : null);
      }
    }
  })
  options!: string[] | null;

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
  @BelongsTo(() => ProductCategory, 'category_id')
  category?: ProductCategory;
}



