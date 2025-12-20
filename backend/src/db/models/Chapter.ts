import { Table, Column, Model, DataType, HasMany, BelongsToMany } from 'sequelize-typescript';
import { BaseModel } from './BaseModel';
import { Event } from './Event';
import { EventAffiliatedChapter } from './EventAffiliatedChapter';

@Table({
  tableName: 'chapters',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
})
export class Chapter extends BaseModel {
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
  name!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  type!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true
  })
  status!: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  chartered!: number | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true
  })
  province!: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true
  })
  city!: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true
  })
  state!: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  contact_email!: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  stripe_account_id!: string | null;

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
  @BelongsToMany(() => Event, () => EventAffiliatedChapter)
  events?: Event[];
}














