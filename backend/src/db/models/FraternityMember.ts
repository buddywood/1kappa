import { Table, Column, Model, DataType, BelongsTo, HasOne, ForeignKey } from 'sequelize-typescript';
import { BaseModel } from './BaseModel';
import { Chapter } from './Chapter';
import { Profession } from './Profession';

@Table({
  tableName: 'fraternity_members',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
})
export class FraternityMember extends BaseModel {
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
  email!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  name!: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    unique: true
  })
  membership_number!: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    unique: true
  })
  cognito_sub!: string | null;

  @Column({
    type: DataType.ENUM('DRAFT', 'COMPLETE'),
    defaultValue: 'DRAFT'
  })
  registration_status!: 'DRAFT' | 'COMPLETE';

  @ForeignKey(() => Chapter)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  initiated_chapter_id!: number | null;

  @Column({
    type: DataType.STRING(50),
    allowNull: true
  })
  initiated_season!: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  initiated_year!: number | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  ship_name!: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  line_name!: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  location!: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  address!: string | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  address_is_private!: boolean;

  @Column({
    type: DataType.STRING(50),
    allowNull: true
  })
  phone_number!: string | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  phone_is_private!: boolean;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  industry!: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  job_title!: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  bio!: string | null;

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

  @ForeignKey(() => Profession)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  profession_id!: number | null;

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
  @BelongsTo(() => Chapter, 'initiated_chapter_id')
  initiatedChapter?: Chapter;

  @BelongsTo(() => Profession, 'profession_id')
  profession?: Profession;
}

