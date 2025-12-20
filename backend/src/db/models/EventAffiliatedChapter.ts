import { Table, Column, Model, ForeignKey, DataType, BelongsTo } from 'sequelize-typescript';
import { BaseModel } from './BaseModel';
import { Event } from './Event';
import { Chapter } from './Chapter';

@Table({
  tableName: 'event_affiliated_chapters',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
})
export class EventAffiliatedChapter extends BaseModel {
  @ForeignKey(() => Event)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  event_id!: number;

  @BelongsTo(() => Event)
  event!: Event;

  @ForeignKey(() => Chapter)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  chapter_id!: number;

  @BelongsTo(() => Chapter)
  chapter!: Chapter;
}
