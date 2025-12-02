import { Table, Column, Model, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { BaseModel } from './BaseModel';
import { Promoter } from './Promoter';
import { Chapter } from './Chapter';
import { EventType } from './EventType';
import { EventAudienceType } from './EventAudienceType';

@Table({
  tableName: 'events',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
})
export class Event extends BaseModel {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @ForeignKey(() => Promoter)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  promoter_id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  description!: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  event_date!: Date;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  location!: string;

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
    type: DataType.TEXT,
    allowNull: true
  })
  image_url!: string | null;

  @ForeignKey(() => Chapter)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  sponsored_chapter_id!: number | null;

  @ForeignKey(() => EventType)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  event_type_id!: number | null;

  @ForeignKey(() => EventAudienceType)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  event_audience_type_id!: number | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  all_day!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  duration_minutes!: number | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  event_link!: string | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  is_featured!: boolean;

  @Column({
    type: DataType.STRING(50),
    defaultValue: 'UNPAID'
  })
  featured_payment_status!: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  stripe_payment_intent_id!: string | null;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  ticket_price_cents!: number;

  @Column({
    type: DataType.JSONB,
    defaultValue: ['business_casual'],
    get() {
      const value = this.getDataValue('dress_codes');
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return ['business_casual'];
        }
      }
      return value || ['business_casual'];
    },
    set(value: any) {
      if (typeof value === 'string') {
        this.setDataValue('dress_codes', value);
      } else {
        this.setDataValue('dress_codes', JSON.stringify(value || ['business_casual']));
      }
    }
  })
  dress_codes!: ('business' | 'business_casual' | 'formal' | 'semi_formal' | 'kappa_casual' | 'greek_encouraged' | 'greek_required' | 'outdoor' | 'athletic' | 'comfortable' | 'all_white')[];

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  dress_code_notes!: string | null;

  @Column({
    type: DataType.ENUM('ACTIVE', 'CLOSED', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'ACTIVE'
  })
  status!: 'ACTIVE' | 'CLOSED' | 'CANCELLED';

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
  @BelongsTo(() => Promoter, 'promoter_id')
  promoter?: Promoter;

  @BelongsTo(() => Chapter, 'sponsored_chapter_id')
  sponsoredChapter?: Chapter;

  @BelongsTo(() => EventType, 'event_type_id')
  eventType?: EventType;

  @BelongsTo(() => EventAudienceType, 'event_audience_type_id')
  eventAudienceType?: EventAudienceType;
}



