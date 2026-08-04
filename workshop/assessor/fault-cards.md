# Assessor fault cards

Select two faults after the candidate begins. Do not disclose the affected layer.

| Fault | Injection | Required recovery evidence |
| --- | --- | --- |
| Bad target port | Deploy a candidate revision with the wrong ingress target | Revision/system logs, corrected source, healthy TLS request |
| Readiness failure | Toggle `/fault/readiness` | Failed readiness evidence, traffic exclusion, restored SLI |
| Denied role | Remove one narrow data-plane assignment | 403/authorization evidence, restored assignment, successful retry |
| Bad traffic weight | Route production traffic to a known-bad revision | Candidate-specific errors, weight rollback, recovery timestamp |
| Downstream throttling | Lower dependency capacity or inject 429 responses | Saturation evidence, bounded concurrency/retry mitigation |
| Function host storage failure | Remove or corrupt `AzureWebJobsStorage` for the Function App | Host/system logs, corrected identity or setting, healthy trigger execution |
| Service Bus receiver denied | Remove **Azure Service Bus Data Receiver** from the Function App identity | Authorization evidence, narrow role restoration, successful message completion |
| Function ingress disabled | Disable ingress on an event-triggered Function App | Stalled scale evidence, internal or external ingress restoration, queue drain timeline |
| Poison message | Publish a permanently invalid order event | Retry and dead-letter evidence, non-retryable classification, unaffected valid message |
| Competing pull revisions | Activate two revisions against the same queue and host storage | Competing-consumer diagnosis, single-revision rollback or isolated event-source design |

For the Functions module or a Functions capstone path, select at least one Functions-specific card. Retakes use a different pair. Preserve failed and recovered timelines and ask what observation would falsify the diagnosis.
