import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { EventStatus, DEFAULT_PROVIDER } from '../constants';

export type EventDocument = HydratedDocument<Event>;

@Schema({ collection: 'events', timestamps: true })
export class Event {
  @Prop({ required: true, unique: true })
  eventId: string;

  @Prop({ required: true, index: true })
  documentId: string;

  @Prop({ required: true, enum: Object.values(EventStatus) })
  status: string;

  @Prop({ type: String, default: null })
  documentType: string | null;

  @Prop({ type: String, default: DEFAULT_PROVIDER })
  provider: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  metadata: Record<string, unknown> | null;

  @Prop({ required: true })
  createdAt: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
