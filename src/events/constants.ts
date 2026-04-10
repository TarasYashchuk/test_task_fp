export enum EventStatus {
  MANUAL_INPUT = 'MANUAL_INPUT',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export enum DocumentType {
  INVOICE = 'INVOICE',
  ID_CARD = 'ID_CARD',
  CONTRACT = 'CONTRACT',
}

export const DEFAULT_PROVIDER = 'internal-engine';

export const MONGO_DUPLICATE_KEY_CODE = 11000;
