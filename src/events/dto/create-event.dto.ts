import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsISO8601,
  IsObject,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ example: 'evt-1' })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({ example: 'doc-1' })
  @IsString()
  @IsNotEmpty()
  documentId: string;

  @ApiProperty({ example: 'PROCESSED', enum: ['MANUAL_INPUT', 'MANUAL INPUT', 'PROCESSED', 'FAILED'] })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional({ example: 'INVOICE', enum: ['INVOICE', 'ID_CARD', 'ID CARD', 'CONTRACT'], nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.documentType !== null)
  @IsString()
  documentType?: string | null;

  @ApiPropertyOptional({ example: 'google-vision', nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.provider !== null)
  @IsString()
  provider?: string | null;

  @ApiPropertyOptional({ example: { pages: 3, confidence: 0.95 }, nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.metadata !== null && o.metadata !== 'undefined')
  @IsObject()
  metadata?: Record<string, unknown> | null;

  @ApiProperty({ example: '2025-01-15T10:00:00.000Z' })
  @IsISO8601()
  @IsNotEmpty()
  createdAt: string;
}
