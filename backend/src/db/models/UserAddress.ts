import { Table, Column, Model, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { BaseModel } from './BaseModel';
import { User } from './User';

@Table({
  tableName: 'user_addresses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'is_default'],
      where: {
        is_default: true
      }
    }
  ]
})
export class UserAddress extends BaseModel {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  user_id!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: true
  })
  label!: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  street!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  city!: string;

  @Column({
    type: DataType.STRING(2),
    allowNull: false
  })
  state!: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false
  })
  zip!: string;

  @Column({
    type: DataType.STRING(2),
    allowNull: false,
    defaultValue: 'US'
  })
  country!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  is_default!: boolean;

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
  @BelongsTo(() => User, 'user_id')
  user?: User;
}









