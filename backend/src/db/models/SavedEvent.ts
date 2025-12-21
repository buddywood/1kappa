import { Table, Column, Model, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { BaseModel } from './BaseModel';
import { Event } from './Event';

@Table({
  tableName: 'saved_events',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['user_email', 'event_id']
    }
  ]
})
export class SavedEvent extends BaseModel {
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
  user_email!: string;

  @ForeignKey(() => Event)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  event_id!: number;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW
  })
  created_at!: Date;

  @BelongsTo(() => Event, 'event_id')
  event?: Event;
}
