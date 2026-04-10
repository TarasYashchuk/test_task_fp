import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(200)
  async create(@Body() dto: CreateEventDto) {
    return this.eventsService.ingest(dto);
  }
}
