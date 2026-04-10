import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { Document, DocumentRecord } from './schemas/document.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { normalizeEvent, NormalizedEvent } from './helpers/normalize';
import { MONGO_DUPLICATE_KEY_CODE } from './constants';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Document.name)
    private documentModel: Model<DocumentRecord>,
  ) {}

  async ingest(
    dto: CreateEventDto,
  ): Promise<{ status: string; eventId: string }> {
    const normalized = normalizeEvent(dto);

    let isDuplicate = false;
    try {
      await this.eventModel.create(normalized);
    } catch (err: unknown) {
      if (this.isDuplicateKeyError(err)) {
        isDuplicate = true;
      } else {
        throw err;
      }
    }

    await this.upsertDocument(normalized);

    return {
      status: isDuplicate ? 'duplicate' : 'created',
      eventId: normalized.eventId,
    };
  }

  private async upsertDocument(event: NormalizedEvent): Promise<void> {
    const pipelineUpdate = this.buildConditionalUpdate(event);
    const collection = this.documentModel.collection;

    try {
      await collection.updateOne(
        { documentId: event.documentId },
        pipelineUpdate,
        { upsert: true },
      );
    } catch (err: unknown) {
      if (this.isDuplicateKeyError(err)) {
        // Race condition: two concurrent inserts for new documentId.
        // Retry without upsert — document now exists.
        await collection.updateOne(
          { documentId: event.documentId },
          pipelineUpdate,
        );
      } else {
        throw err;
      }
    }
  }

  private buildConditionalUpdate(event: NormalizedEvent) {
    const isNewer = {
      $or: [
        { $eq: [{ $type: '$lastEventAt' }, 'missing'] },
        { $lt: ['$lastEventAt', event.createdAt] },
      ],
    };

    return [
      {
        $set: {
          documentId: event.documentId,
          status: { $cond: [isNewer, event.status, '$status'] },
          documentType: this.condSetIfNotNull(isNewer, event.documentType, '$documentType'),
          provider: { $cond: [isNewer, event.provider, '$provider'] },
          metadata: this.condSetIfNotNull(isNewer, event.metadata, '$metadata'),
          lastEventAt: { $cond: [isNewer, event.createdAt, '$lastEventAt'] },
        },
      },
    ];
  }

  /**
   * Partial merge: update field only if event is newer AND new value is not null.
   * Prevents dirty events from erasing existing data.
   */
  private condSetIfNotNull(isNewer: object, newValue: unknown, currentField: string) {
    return {
      $cond: [
        { $and: [isNewer, { $ne: [newValue, null] }] },
        newValue,
        currentField,
      ],
    };
  }

  private isDuplicateKeyError(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: number }).code === MONGO_DUPLICATE_KEY_CODE
    );
  }
}
