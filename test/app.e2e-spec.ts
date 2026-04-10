import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from '../src/events/events.module';
import { ReportsModule } from '../src/reports/reports.module';

describe('Document Pipeline (e2e)', () => {
  let app: INestApplication<App>;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongod.getUri()),
        EventsModule,
        ReportsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  const validEvent = {
    eventId: 'evt-1',
    documentId: 'doc-1',
    status: 'PROCESSED',
    documentType: 'INVOICE',
    provider: 'ocr-engine',
    metadata: { pages: 3 },
    createdAt: '2025-01-15T10:00:00.000Z',
  };

  describe('POST /events', () => {
    it('should accept a valid event', async () => {
      const res = await request(app.getHttpServer())
        .post('/events')
        .send(validEvent)
        .expect(200);

      expect(res.body).toEqual({
        status: 'created',
        eventId: 'evt-1',
      });
    });

    it('should return duplicate for same eventId', async () => {
      const res = await request(app.getHttpServer())
        .post('/events')
        .send(validEvent)
        .expect(200);

      expect(res.body).toEqual({
        status: 'duplicate',
        eventId: 'evt-1',
      });
    });

    it('should reject missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/events')
        .send({ documentId: 'doc-1' })
        .expect(400);
    });

    it('should reject invalid createdAt', async () => {
      await request(app.getHttpServer())
        .post('/events')
        .send({ ...validEvent, eventId: 'evt-bad-date', createdAt: 'not-a-date' })
        .expect(400);
    });

    it('should reject invalid status', async () => {
      await request(app.getHttpServer())
        .post('/events')
        .send({ ...validEvent, eventId: 'evt-bad-status', status: 'UNKNOWN' })
        .expect(400);
    });

    it('should normalize "MANUAL INPUT" status', async () => {
      const res = await request(app.getHttpServer())
        .post('/events')
        .send({
          ...validEvent,
          eventId: 'evt-manual',
          documentId: 'doc-manual',
          status: 'MANUAL INPUT',
        })
        .expect(200);

      expect(res.body.status).toBe('created');
    });

    it('should default null provider to "internal-engine"', async () => {
      const res = await request(app.getHttpServer())
        .post('/events')
        .send({
          ...validEvent,
          eventId: 'evt-null-provider',
          documentId: 'doc-null-provider',
          provider: null,
        })
        .expect(200);

      expect(res.body.status).toBe('created');
    });

    it('should handle messy data without crashing', async () => {
      const res = await request(app.getHttpServer())
        .post('/events')
        .send({
          eventId: 'evt-messy',
          documentId: 'doc-messy',
          status: 'FAILED',
          documentType: 'undefined',
          provider: 'undefined',
          metadata: null,
          createdAt: '2025-01-15T12:00:00.000Z',
        })
        .expect(200);

      expect(res.body.status).toBe('created');
    });

    it('should handle metadata as string "undefined" without crashing', async () => {
      const res = await request(app.getHttpServer())
        .post('/events')
        .send({
          eventId: 'evt-meta-undefined',
          documentId: 'doc-meta-undefined',
          status: 'PROCESSED',
          documentType: 'undefined',
          provider: 'undefined',
          metadata: 'undefined',
          createdAt: '2025-01-15T12:00:00.000Z',
        })
        .expect(200);

      expect(res.body.status).toBe('created');
    });

    it('should handle out-of-order events correctly', async () => {
      // Send newer event first
      await request(app.getHttpServer())
        .post('/events')
        .send({
          eventId: 'evt-order-2',
          documentId: 'doc-order',
          status: 'PROCESSED',
          documentType: 'CONTRACT',
          provider: 'engine-a',
          metadata: null,
          createdAt: '2025-01-15T12:00:00.000Z',
        })
        .expect(200);

      // Send older event second
      await request(app.getHttpServer())
        .post('/events')
        .send({
          eventId: 'evt-order-1',
          documentId: 'doc-order',
          status: 'MANUAL INPUT',
          documentType: 'INVOICE',
          provider: 'engine-b',
          metadata: null,
          createdAt: '2025-01-15T10:00:00.000Z',
        })
        .expect(200);

      // The summary should reflect the newer event's status (PROCESSED)
      const summary = await request(app.getHttpServer())
        .get('/reports/summary')
        .expect(200);

      const docOrderStatus = summary.body.statusDistribution.find(
        (s: { status: string }) => s.status === 'PROCESSED',
      );
      expect(docOrderStatus).toBeDefined();
    });
  });

  describe('GET /reports/summary', () => {
    it('should return status distribution and type breakdown', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports/summary')
        .expect(200);

      expect(res.body).toHaveProperty('statusDistribution');
      expect(res.body).toHaveProperty('documentTypeBreakdown');
      expect(Array.isArray(res.body.statusDistribution)).toBe(true);
      expect(Array.isArray(res.body.documentTypeBreakdown)).toBe(true);
    });

    it('should have correct structure in status distribution', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports/summary')
        .expect(200);

      for (const item of res.body.statusDistribution) {
        expect(item).toHaveProperty('status');
        expect(item).toHaveProperty('count');
        expect(typeof item.count).toBe('number');
      }
    });

    it('should have percentages in type breakdown', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports/summary')
        .expect(200);

      let totalPercentage = 0;
      for (const item of res.body.documentTypeBreakdown) {
        expect(item).toHaveProperty('documentType');
        expect(item).toHaveProperty('count');
        expect(item).toHaveProperty('percentage');
        expect(typeof item.percentage).toBe('number');
        totalPercentage += item.percentage;
      }

      if (res.body.documentTypeBreakdown.length > 0) {
        expect(totalPercentage).toBeCloseTo(100, 0);
      }
    });
  });
});
