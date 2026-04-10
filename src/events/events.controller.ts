import { Controller, Post, Delete, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { EVENT_EXAMPLES } from './dto/event-examples';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Ingest a processing event' })
  @ApiResponse({ status: 200, description: 'Event accepted (created or duplicate)' })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid status' })
  @ApiBody({ type: CreateEventDto, examples: EVENT_EXAMPLES })
  async create(@Body() dto: CreateEventDto) {
    return this.eventsService.ingest(dto);
  }

  @Delete('reset')
  @ApiOperation({ summary: 'Reset database (delete all events and documents)' })
  @ApiResponse({ status: 200, description: 'All data deleted' })
  async reset() {
    return this.eventsService.resetAll();
  }
}
