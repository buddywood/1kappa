import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { BaseModel } from './BaseModel';

@Table({
  tableName: 'professions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
})
export class Profession extends BaseModel {
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
  name!: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  display_order!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true
  })
  is_active!: boolean;

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
}










