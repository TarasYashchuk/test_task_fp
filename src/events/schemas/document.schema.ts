import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { EventStatus, DEFAULT_PROVIDER } from '../constants';

export type DocumentRecord = HydratedDocument<Document>;

@Schema({ collection: 'documents', timestamps: true })
export class Document {
  @Prop({ required: true, unique: true })
  documentId: string;

  @Prop({ required: true, enum: Object.values(EventStatus), index: true })
  status: string;

  @Prop({ type: String, default: null, index: true })
  documentType: string | null;

  @Prop({ type: String, default: DEFAULT_PROVIDER })
  provider: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  metadata: Record<string, unknown> | null;

  @Prop({ required: true })
  lastEventAt: Date;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);
