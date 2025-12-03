import { Table, Column, Model, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { BaseModel } from './BaseModel';
import { FraternityMember } from './FraternityMember';
import { Seller } from './Seller';
import { Promoter } from './Promoter';
import { Steward } from './Steward';

@Table({
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
})
export class User extends BaseModel {
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
  cognito_sub!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true
  })
  email!: string;

  @Column({
    type: DataType.ENUM('ADMIN', 'SELLER', 'PROMOTER', 'GUEST', 'STEWARD'),
    allowNull: false
  })
  role!: 'ADMIN' | 'SELLER' | 'PROMOTER' | 'GUEST' | 'STEWARD';

  @Column({
    type: DataType.ENUM('PRE_COGNITO', 'COGNITO_CONFIRMED', 'ONBOARDING_STARTED', 'ONBOARDING_FINISHED'),
    defaultValue: 'PRE_COGNITO'
  })
  onboarding_status!: 'PRE_COGNITO' | 'COGNITO_CONFIRMED' | 'ONBOARDING_STARTED' | 'ONBOARDING_FINISHED';

  @ForeignKey(() => Seller)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  seller_id!: number | null;

  @ForeignKey(() => Promoter)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  promoter_id!: number | null;

  @ForeignKey(() => Steward)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  steward_id!: number | null;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
    get() {
      const value = this.getDataValue('features');
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
        this.setDataValue('features', value);
      } else {
        this.setDataValue('features', JSON.stringify(value || {}));
      }
    }
  })
  features!: Record<string, any>;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  last_login!: Date | null;

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
  // fraternityMember association accessed via email/cognito_sub matching or through role-specific tables
  fraternityMember?: FraternityMember;

  @BelongsTo(() => Seller, 'seller_id')
  seller?: Seller;

  @BelongsTo(() => Promoter, 'promoter_id')
  promoter?: Promoter;

  @BelongsTo(() => Steward, 'steward_id')
  steward?: Steward;
}

