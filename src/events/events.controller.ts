import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Ingest a processing event' })
  @ApiResponse({ status: 200, description: 'Event accepted (created or duplicate)' })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid status' })
  async create(@Body() dto: CreateEventDto) {
    return this.eventsService.ingest(dto);
  }
}
