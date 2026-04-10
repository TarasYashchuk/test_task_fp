import { BadRequestException } from '@nestjs/common';
import { CreateEventDto } from '../dto/create-event.dto';
import {
  EventStatus,
  DocumentType,
  DEFAULT_PROVIDER,
} from '../constants';

export interface NormalizedEvent {
  eventId: string;
  documentId: string;
  status: EventStatus;
  documentType: DocumentType | null;
  provider: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

const STATUS_MAP: Record<string, EventStatus> = {
  'MANUAL INPUT': EventStatus.MANUAL_INPUT,
  [EventStatus.MANUAL_INPUT]: EventStatus.MANUAL_INPUT,
  [EventStatus.PROCESSED]: EventStatus.PROCESSED,
  [EventStatus.FAILED]: EventStatus.FAILED,
};

const DOCUMENT_TYPE_MAP: Record<string, DocumentType> = {
  [DocumentType.INVOICE]: DocumentType.INVOICE,
  'ID CARD': DocumentType.ID_CARD,
  [DocumentType.ID_CARD]: DocumentType.ID_CARD,
  [DocumentType.CONTRACT]: DocumentType.CONTRACT,
};

export function normalizeEvent(dto: CreateEventDto): NormalizedEvent {
  return {
    eventId: dto.eventId,
    documentId: dto.documentId,
    status: normalizeStatus(dto.status),
    documentType: normalizeDocumentType(dto.documentType),
    provider: normalizeProvider(dto.provider),
    metadata: normalizeOptional(dto.metadata),
    createdAt: new Date(dto.createdAt),
  };
}

function normalizeStatus(raw: string): EventStatus {
  const result = STATUS_MAP[raw?.trim()];
  if (!result) {
    throw new BadRequestException(`Invalid status: ${raw}`);
  }
  return result;
}

function normalizeDocumentType(raw: unknown): DocumentType | null {
  if (raw == null || raw === 'undefined' || raw === '') {
    return null;
  }
  return DOCUMENT_TYPE_MAP[String(raw).trim()] ?? null;
}

function normalizeProvider(raw: unknown): string {
  if (raw == null || raw === 'undefined' || raw === '') {
    return DEFAULT_PROVIDER;
  }
  return String(raw);
}

function normalizeOptional(
  raw: unknown,
): Record<string, unknown> | null {
  if (raw == null || raw === 'undefined') {
    return null;
  }
  if (typeof raw === 'object') {
    return raw as Record<string, unknown>;
  }
  return null;
}
