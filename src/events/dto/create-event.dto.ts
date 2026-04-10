import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsISO8601,
  IsObject,
  ValidateIf,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsNotEmpty()
  documentId: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsOptional()
  @ValidateIf((o) => o.documentType !== null)
  @IsString()
  documentType?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.provider !== null)
  @IsString()
  provider?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.metadata !== null && o.metadata !== 'undefined')
  @IsObject()
  metadata?: Record<string, unknown> | null;

  @IsISO8601()
  @IsNotEmpty()
  createdAt: string;
}
