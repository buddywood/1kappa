import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { BaseModel } from './BaseModel';

@Table({
  tableName: 'platform_settings',
  timestamps: false,
  underscored: true
})
export class PlatformSetting extends BaseModel {
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
  key!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  value!: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  description!: string | null;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW
  })
  updated_at!: Date;
}














