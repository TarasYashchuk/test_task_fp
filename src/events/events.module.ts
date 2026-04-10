import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event, EventSchema } from './schemas/event.schema';
import { Document, DocumentSchema } from './schemas/document.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Document.name, schema: DocumentSchema },
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [MongooseModule],
})
export class EventsModule {}
