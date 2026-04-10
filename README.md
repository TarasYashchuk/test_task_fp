# Document Processing Pipeline

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start MongoDB
docker compose up mongodb -d

# 3. Copy env and adjust if needed
cp .env.example .env

# 4. Run the app
npm run start:dev
```

The API will be available at `http://localhost:3000`.

## API Endpoints

### POST /events

Accepts a processing event, normalizes it, stores the raw event, and upserts the corresponding document.

### GET /reports/summary

Returns a high-level overview: status distribution (count per status) and document type breakdown (percentage per type). Built as a single MongoDB `$facet` aggregation pipeline.

## Running Tests

```bash
# Unit tests (normalization logic)
npm run test

# E2E tests (full API with in-memory MongoDB)
npm run test:e2e
```

## Assumptions I Made

### 1. Dirty events shouldn't cause data loss

These OCR/AI engines send messy data, sometimes a field is just missing or null. I didn't want a newer but "incomplete" event to wipe out good data we already have.

So if, say, we already know a document is an `INVOICE` and then a newer event comes in with `documentType: null`, the system keeps `INVOICE` instead of blindly overwriting it with `null`. The idea for me is `null` means "I don't know," not "please delete this."

This applies to `documentType` and `metadata`. Fields like `status` and `provider` always have a value after normalization, so they update normally.

### 2. Duplicate events still sync the document 

There's a subtle failure mode: what if the server saves the event to the `events` collection but crashes right before updating the `documents` collection? On a retry, the system would see a duplicate `eventId`, and if it just returned "duplicate" and stopped, the document would never get updated.

So even when we catch a duplicate event, we still run the document upsert. The update logic is idempotent (it uses `$cond` to only apply changes if the event is actually newer), so running it twice is harmless.

### 3. Chronology wins, not status priority

The task didn't define any state transition rules, so I went with the simplest model is the most recent event is the source of truth.

That means if a `FAILED` event has a newer `createdAt` than the current `PROCESSED` state, it will overwrite it. The system trusts the event timeline rather than enforcing a state machine. In practice, a late `FAILED` could be a valid rejection or manual correction that happened after processing.

If we ever needed stricter rules (e.g., "PROCESSED is final"), that would be a state machine layer on top.

### 4. The literal string "undefined" is valid input

The task says all fields can be the literal string `"undefined"`. This is a bit tricky for `metadata`, which is supposed to be an object `class-validator`'s `@IsObject()` would reject the string `"undefined"` with a 400 error.

I configured validation to let `"undefined"` pass through, and the normalization layer converts it to `null`. The system never crashes on this input.

### 5. Events are stored after normalization, not raw

"store the raw event." I interpreted "raw" as the individual event before aggregation into a document record not the exact unmodified payload. Events are stored post normalization so that the `events` collection is consistent and queryable (e.g status is always `MANUAL_INPUT`, never `MANUAL INPUT`).

If a truly raw audit trail were needed, we can add a `rawPayload` field to the schema and itwould be straightforward.

### 6. Unknown document types are silently accepted

If an event comes in with `documentType: "RECEIPT"` (which isn't in our known types), system normalizes it to `null` rather than rejecting the event. I think these events might come from various OCR engines that might produce unexpected classifications (low probability but..). Rejecting them would mean losing the rest of the useful data in that event. If new document types emerge, they just need to be added to the mapping.

Scaling to 1M Events/Hour
I can suggest this:

1. I'd separate the api from the actual processing by dropping rabbitMQ or kafka in the middle. The api would just grab the incoming event, push it to the queue, and immediately return a success response. Background workers can then chew through the queue at their own pace. This prevents the api from choking during traffic spikes, and gives us durability for free if a worker dies mid processing, the message is still safe in the queue.

2. While I haven't worked extensively with MongoDB in production before, my research into its scaling best practices showed that doing a round-trip updateOne for every single event isn't optimal at high loads. To fix this, I'd have the workers batch the events and use MongoDB's bulkWrite(). Grouping operations into a single network request is the standard way to avoid hammering the database.

3. Shard MongoDB by Document ID To handle the heavy write load, I'd shard the events collection using a hashed documentId. This ensures the writes are distributed evenly across multiple shards without creating hot spots. The documents collection would benefit from the exact same sharding strategy.

4. Cache the heavy aggregations The GET /reports/summary endpoint currently runs a $facet aggregation over the entire collection. With millions of records, that will eventually get too expensive. Since an Ops dashboard usually doesn't need to be accurate down to the millisecond, I'd just cache the aggregation results in Redis with a short TTL, like 30 sec.

5. I'd spin up multiple instances of this app behind a load balancer. Since the service is completely stateless (all state lives in Mongo), and the current codebase already handles idempotency and race conditions during upserts, we can scale out horizontally without worrying about data corruption.

Brief schema

<img width="3210" height="4582" alt="Stateless API Layer Load-2026-04-10-143214" src="https://github.com/user-attachments/assets/99108b6b-3199-4223-8b4a-3f3b4067d135" />


