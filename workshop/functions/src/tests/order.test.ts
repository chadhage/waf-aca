import assert from "node:assert/strict";
import test from "node:test";
import { idempotencyKey, NonRetryableOrderError, parseOrderEvent } from "../domain/order.js";

const validOrder = {
  eventId: "evt-001",
  orderId: "ord-001",
  amount: 42.5,
  occurredAtUtc: "2026-08-04T12:00:00Z"
};

test("parses a valid order and derives a stable idempotency key", () => {
  const order = parseOrderEvent(validOrder);
  assert.equal(order.orderId, "ord-001");
  assert.equal(idempotencyKey(order), "order-event:evt-001");
  assert.equal(idempotencyKey(parseOrderEvent({ ...validOrder })), idempotencyKey(order));
});

test("rejects malformed input as non-retryable", () => {
  assert.throws(
    () => parseOrderEvent({ ...validOrder, amount: -1 }),
    NonRetryableOrderError
  );
  assert.throws(
    () => parseOrderEvent({ ...validOrder, eventId: "" }),
    /eventId and orderId are required/
  );
});