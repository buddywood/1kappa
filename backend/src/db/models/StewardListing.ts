import { Table, Column, Model, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { BaseModel } from './BaseModel';
import { Steward } from './Steward';
import { Chapter } from './Chapter';
import { FraternityMember } from './FraternityMember';

@Table({
  tableName: 'steward_listings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
})
export class StewardListing extends BaseModel {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @ForeignKey(() => Steward)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  steward_id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  description!: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  image_url!: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  })
  shipping_cost_cents!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  })
  chapter_donation_cents!: number;

  @ForeignKey(() => Chapter)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  sponsoring_chapter_id!: number;

  @Column({
    type: DataType.ENUM('ACTIVE', 'CLAIMED', 'REMOVED'),
    defaultValue: 'ACTIVE'
  })
  status!: 'ACTIVE' | 'CLAIMED' | 'REMOVED';

  @ForeignKey(() => FraternityMember)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  claimed_by_fraternity_member_id!: number | null;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  claimed_at!: Date | null;

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
  @BelongsTo(() => Steward, 'steward_id')
  steward?: Steward;

  @BelongsTo(() => Chapter, 'sponsoring_chapter_id')
  sponsoringChapter?: Chapter;

  @BelongsTo(() => FraternityMember, 'claimed_by_fraternity_member_id')
  claimedByFraternityMember?: FraternityMember;
}













