export const EVENT_EXAMPLES = {
  'Valid event': {
    summary: 'Clean, valid event',
    value: {
      eventId: 'evt-1',
      documentId: 'doc-1',
      status: 'PROCESSED',
      documentType: 'INVOICE',
      provider: 'google-vision',
      metadata: { pages: 3, confidence: 0.95 },
      createdAt: '2025-01-15T10:00:00.000Z',
    },
  },
  'Duplicate (same eventId)': {
    summary: 'Send evt-1 again — should return "duplicate"',
    value: {
      eventId: 'evt-1',
      documentId: 'doc-1',
      status: 'PROCESSED',
      documentType: 'INVOICE',
      provider: 'google-vision',
      metadata: { pages: 3 },
      createdAt: '2025-01-15T10:00:00.000Z',
    },
  },
  'Messy data (nulls + "undefined")': {
    summary: 'All optional fields are dirty — should normalize without crashing',
    value: {
      eventId: 'evt-2',
      documentId: 'doc-2',
      status: 'FAILED',
      documentType: 'undefined',
      provider: null,
      metadata: 'undefined',
      createdAt: '2025-01-15T11:00:00.000Z',
    },
  },
  'MANUAL INPUT status': {
    summary: 'Status with space — should normalize to MANUAL_INPUT',
    value: {
      eventId: 'evt-3',
      documentId: 'doc-3',
      status: 'MANUAL INPUT',
      documentType: 'ID CARD',
      provider: 'internal-ocr',
      metadata: null,
      createdAt: '2025-01-15T12:00:00.000Z',
    },
  },
  'Out-of-order (newer first)': {
    summary: 'Newer event for doc-4 — creates document with PROCESSED',
    value: {
      eventId: 'evt-4-new',
      documentId: 'doc-4',
      status: 'PROCESSED',
      documentType: 'CONTRACT',
      provider: 'engine-a',
      metadata: { signed: true },
      createdAt: '2025-01-15T14:00:00.000Z',
    },
  },
  'Out-of-order (older second)': {
    summary: 'Older event for doc-4 — should NOT overwrite PROCESSED state',
    value: {
      eventId: 'evt-4-old',
      documentId: 'doc-4',
      status: 'MANUAL INPUT',
      documentType: 'INVOICE',
      provider: 'engine-b',
      metadata: null,
      createdAt: '2025-01-15T09:00:00.000Z',
    },
  },
  'Partial merge (newer with null type)': {
    summary: 'Newer event with null documentType — should keep existing INVOICE',
    value: {
      eventId: 'evt-5',
      documentId: 'doc-1',
      status: 'FAILED',
      documentType: null,
      provider: null,
      metadata: null,
      createdAt: '2025-01-15T15:00:00.000Z',
    },
  },
  'Missing optional fields': {
    summary: 'Only required fields — provider defaults to internal-engine',
    value: {
      eventId: 'evt-6',
      documentId: 'doc-6',
      status: 'PROCESSED',
      createdAt: '2025-01-15T16:00:00.000Z',
    },
  },
  'Should fail (missing required)': {
    summary: 'Missing eventId, status, createdAt — should return 400',
    value: {
      documentId: 'doc-bad',
    },
  },
  'Should fail (invalid status)': {
    summary: 'Unknown status — should return 400',
    value: {
      eventId: 'evt-bad',
      documentId: 'doc-bad',
      status: 'UNKNOWN',
      createdAt: '2025-01-15T10:00:00.000Z',
    },
  },
};
