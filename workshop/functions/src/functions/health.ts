import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function health(_request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("health check", { invocationId: context.invocationId });
  return {
    status: 200,
    jsonBody: {
      status: "ok",
      functionName: context.functionName,
      invocationId: context.invocationId
    }
  };
}

app.http("health", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "health",
  handler: health
});