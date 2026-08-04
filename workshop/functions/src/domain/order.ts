export interface OrderEvent {
  eventId: string;
  orderId: string;
  amount: number;
  occurredAtUtc: string;
}

export class NonRetryableOrderError extends Error {}

export function parseOrderEvent(message: unknown): OrderEvent {
  if (typeof message !== "object" || message === null) {
    throw new NonRetryableOrderError("Message must be a JSON object");
  }

  const candidate = message as Partial<OrderEvent>;
  if (!candidate.eventId || !candidate.orderId) {
    throw new NonRetryableOrderError("eventId and orderId are required");
  }
  if (typeof candidate.amount !== "number" || !Number.isFinite(candidate.amount) || candidate.amount <= 0) {
    throw new NonRetryableOrderError("amount must be a positive finite number");
  }
  if (!candidate.occurredAtUtc || Number.isNaN(Date.parse(candidate.occurredAtUtc))) {
    throw new NonRetryableOrderError("occurredAtUtc must be an ISO-8601 timestamp");
  }

  return candidate as OrderEvent;
}

export function idempotencyKey(order: OrderEvent): string {
  return `order-event:${order.eventId}`;
}