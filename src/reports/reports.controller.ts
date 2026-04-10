import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get system health overview' })
  @ApiResponse({ status: 200, description: 'Status distribution and document type breakdown' })
  getSummary() {
    return this.reportsService.getSummary();
  }
}
