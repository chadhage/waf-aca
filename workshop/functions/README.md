# Azure Functions on Azure Container Apps sample

This sample uses the Azure Functions v4 host, TypeScript v4 programming model, Node.js 22, an HTTP health function, and a Service Bus queue trigger. It is designed for native Azure Functions support in an existing Azure Container Apps environment (`kind=functionapp`), not as a generic long-running container app.

## Run locally

Prerequisites: Node.js 22, Azure Functions Core Tools v4, Azurite, and access to a non-production Service Bus namespace.

```powershell
Copy-Item local.settings.example.json local.settings.json
npm ci
npm test
func start
Invoke-RestMethod http://localhost:7071/api/health
```

Use developer identity locally by setting `ServiceBusConnection__fullyQualifiedNamespace`; assign that identity **Azure Service Bus Data Receiver** on the workshop queue. Never commit `local.settings.json`.

## Build and deploy

```bash
az acr build --registry "$ACR_NAME" --image "functions-orders:$IMAGE_TAG" workshop/functions
IMAGE_DIGEST=$(az acr repository show \
  --name "$ACR_NAME" \
  --image "functions-orders:$IMAGE_TAG" \
  --query digest -o tsv)

az containerapp create \
  --name "$FUNCTION_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$ENVIRONMENT" \
  --kind functionapp \
  --functions-version 4 \
  --storage-account "$FUNCTION_STORAGE" \
  --workload-profile-name Consumption \
  --image "$ACR_LOGIN_SERVER/functions-orders@$IMAGE_DIGEST" \
  --ingress external \
  --target-port 80 \
  --min-replicas 0 \
  --max-replicas 20
```

Assign managed identities and narrow RBAC before processing messages. Configure these app settings in Azure:

```text
ServiceBusConnection__fullyQualifiedNamespace=<namespace>.servicebus.windows.net
ORDERS_QUEUE_NAME=orders
APPLICATIONINSIGHTS_CONNECTION_STRING=<managed deployment output or protected setting>
```

Functions derives the KEDA rule from the Service Bus trigger by default. Set replica bounds, but do not add a manual KEDA rule unless the lab intentionally tests `allowScalingRuleOverride`.

## Production boundaries

- `eventId` produces a stable idempotency key, but this sample intentionally does not pretend process memory is durable. Claim the key atomically in Cosmos DB, SQL, or another durable store before applying side effects.
- Every Functions-on-Container-Apps deployment requires host storage. Isolate storage and pull-based event sources when concurrently active revisions must not compete.
- Keep ingress enabled, externally or internally, for event-driven autoscaling. Use platform authentication or a gateway for non-health HTTP endpoints.
- A Service Bus trigger uses at-least-once delivery semantics. Make side effects idempotent, classify poison messages, and monitor dead-letter depth and message age.
- The final image runs as UID 1000. Validate the selected Functions base image and all dependencies in your supply-chain controls before cohort delivery.

## Microsoft sources

- [Azure Functions on Azure Container Apps overview](https://learn.microsoft.com/azure/container-apps/functions-overview)
- [Create and manage a Functions app](https://learn.microsoft.com/azure/container-apps/functions-usage)
- [Service Bus trigger](https://learn.microsoft.com/azure/azure-functions/functions-bindings-service-bus-trigger)
- [Identity-based connections](https://learn.microsoft.com/azure/azure-functions/functions-reference?tabs=blob#configure-an-identity-based-connection)
