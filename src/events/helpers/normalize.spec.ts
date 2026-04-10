import { BadRequestException } from '@nestjs/common';
import { normalizeEvent } from './normalize';
import { CreateEventDto } from '../dto/create-event.dto';

function makeDto(overrides: Partial<CreateEventDto> = {}): CreateEventDto {
  return {
    eventId: 'evt-1',
    documentId: 'doc-1',
    status: 'PROCESSED',
    documentType: 'INVOICE',
    provider: 'ocr-engine',
    metadata: { pages: 3 },
    createdAt: '2025-01-15T10:00:00.000Z',
    ...overrides,
  };
}

describe('normalizeEvent', () => {
  it('should pass through valid data unchanged', () => {
    const result = normalizeEvent(makeDto());
    expect(result).toEqual({
      eventId: 'evt-1',
      documentId: 'doc-1',
      status: 'PROCESSED',
      documentType: 'INVOICE',
      provider: 'ocr-engine',
      metadata: { pages: 3 },
      createdAt: new Date('2025-01-15T10:00:00.000Z'),
    });
  });

  describe('status normalization', () => {
    it('should map "MANUAL INPUT" to "MANUAL_INPUT"', () => {
      const result = normalizeEvent(makeDto({ status: 'MANUAL INPUT' }));
      expect(result.status).toBe('MANUAL_INPUT');
    });

    it('should keep "MANUAL_INPUT" as is', () => {
      const result = normalizeEvent(makeDto({ status: 'MANUAL_INPUT' }));
      expect(result.status).toBe('MANUAL_INPUT');
    });

    it('should keep "FAILED" as is', () => {
      const result = normalizeEvent(makeDto({ status: 'FAILED' }));
      expect(result.status).toBe('FAILED');
    });

    it('should throw BadRequestException for invalid status', () => {
      expect(() => normalizeEvent(makeDto({ status: 'UNKNOWN' }))).toThrow(
        BadRequestException,
      );
    });
  });

  describe('documentType normalization', () => {
    it('should map "ID CARD" to "ID_CARD"', () => {
      const result = normalizeEvent(makeDto({ documentType: 'ID CARD' }));
      expect(result.documentType).toBe('ID_CARD');
    });

    it('should return null for null', () => {
      const result = normalizeEvent(makeDto({ documentType: null }));
      expect(result.documentType).toBeNull();
    });

    it('should return null for undefined', () => {
      const result = normalizeEvent(makeDto({ documentType: undefined }));
      expect(result.documentType).toBeNull();
    });

    it('should return null for string "undefined"', () => {
      const result = normalizeEvent(makeDto({ documentType: 'undefined' }));
      expect(result.documentType).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = normalizeEvent(makeDto({ documentType: '' }));
      expect(result.documentType).toBeNull();
    });

    it('should return null for unknown document type', () => {
      const result = normalizeEvent(makeDto({ documentType: 'RECEIPT' }));
      expect(result.documentType).toBeNull();
    });
  });

  describe('provider normalization', () => {
    it('should default null to "internal-engine"', () => {
      const result = normalizeEvent(makeDto({ provider: null }));
      expect(result.provider).toBe('internal-engine');
    });

    it('should default undefined to "internal-engine"', () => {
      const result = normalizeEvent(makeDto({ provider: undefined }));
      expect(result.provider).toBe('internal-engine');
    });

    it('should default string "undefined" to "internal-engine"', () => {
      const result = normalizeEvent(makeDto({ provider: 'undefined' }));
      expect(result.provider).toBe('internal-engine');
    });

    it('should default empty string to "internal-engine"', () => {
      const result = normalizeEvent(makeDto({ provider: '' }));
      expect(result.provider).toBe('internal-engine');
    });

    it('should keep valid provider', () => {
      const result = normalizeEvent(makeDto({ provider: 'google-vision' }));
      expect(result.provider).toBe('google-vision');
    });
  });

  describe('metadata normalization', () => {
    it('should return null for null', () => {
      const result = normalizeEvent(makeDto({ metadata: null }));
      expect(result.metadata).toBeNull();
    });

    it('should return null for undefined', () => {
      const result = normalizeEvent(makeDto({ metadata: undefined }));
      expect(result.metadata).toBeNull();
    });

    it('should return null for string "undefined"', () => {
      const result = normalizeEvent(
        makeDto({ metadata: 'undefined' as unknown as Record<string, unknown> }),
      );
      expect(result.metadata).toBeNull();
    });

    it('should pass through valid object', () => {
      const result = normalizeEvent(makeDto({ metadata: { key: 'val' } }));
      expect(result.metadata).toEqual({ key: 'val' });
    });
  });

  describe('createdAt normalization', () => {
    it('should convert ISO string to Date', () => {
      const result = normalizeEvent(makeDto());
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.createdAt.toISOString()).toBe('2025-01-15T10:00:00.000Z');
    });
  });
});
