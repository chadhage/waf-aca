import { app, InvocationContext } from "@azure/functions";
import { idempotencyKey, parseOrderEvent } from "../domain/order.js";

export async function processOrder(message: unknown, context: InvocationContext): Promise<void> {
  const order = parseOrderEvent(message);

  context.log("order accepted", {
    invocationId: context.invocationId,
    eventId: order.eventId,
    orderId: order.orderId,
    idempotencyKey: idempotencyKey(order),
    amount: order.amount,
    occurredAtUtc: order.occurredAtUtc
  });

  // Replace this boundary with an atomic write to a durable idempotency store.
  // Throw transient dependency failures so Service Bus retry/dead-letter policy remains effective.
}

app.serviceBusQueue("processOrder", {
  connection: "ServiceBusConnection",
  queueName: process.env.ORDERS_QUEUE_NAME ?? "orders",
  handler: processOrder
});