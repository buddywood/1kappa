import { Table, Column, Model, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { BaseModel } from './BaseModel';
import { Chapter } from './Chapter';
import { FraternityMember } from './FraternityMember';
import { User } from './User';

@Table({
  tableName: 'promoters',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
})
export class Promoter extends BaseModel {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  user_id!: number | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true
  })
  email!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  name!: string;

  @ForeignKey(() => Chapter)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  sponsoring_chapter_id!: number | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  headshot_url!: string | null;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
    get() {
      const value = this.getDataValue('social_links');
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
        this.setDataValue('social_links', value);
      } else {
        this.setDataValue('social_links', JSON.stringify(value || {}));
      }
    }
  })
  social_links!: Record<string, string>;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  stripe_account_id!: string | null;

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
  // fraternityMember association accessed via email matching
  fraternityMember?: FraternityMember;

  @BelongsTo(() => Chapter, 'sponsoring_chapter_id')
  sponsoringChapter?: Chapter;

  @BelongsTo(() => User, 'user_id')
  user?: User;
}

