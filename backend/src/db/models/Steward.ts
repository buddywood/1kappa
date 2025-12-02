import { Table, Column, Model, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { BaseModel } from './BaseModel';
import { Chapter } from './Chapter';
import { FraternityMember } from './FraternityMember';

@Table({
  tableName: 'stewards',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
})
export class Steward extends BaseModel {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @ForeignKey(() => FraternityMember)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: true
  })
  fraternity_member_id!: number;

  @ForeignKey(() => Chapter)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  sponsoring_chapter_id!: number;

  @Column({
    type: DataType.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    defaultValue: 'PENDING'
  })
  status!: 'PENDING' | 'APPROVED' | 'REJECTED';

  @Column({
    type: DataType.ENUM('PENDING', 'VERIFIED', 'FAILED', 'MANUAL_REVIEW'),
    defaultValue: 'PENDING'
  })
  verification_status!: 'PENDING' | 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW';

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  verification_date!: Date | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  verification_notes!: string | null;

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
  @BelongsTo(() => FraternityMember, 'fraternity_member_id')
  fraternityMember?: FraternityMember;

  @BelongsTo(() => Chapter, 'sponsoring_chapter_id')
  sponsoringChapter?: Chapter;
}



