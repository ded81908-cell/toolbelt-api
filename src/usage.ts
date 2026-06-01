/**
 * Minimal in-memory usage metering. Counts billable calls per client and per
 * endpoint so you can (a) expose a /v1/usage summary and (b) export counters to a
 * real billing system (Stripe metered billing, a warehouse, etc.) later.
 *
 * This is intentionally dependency-free. For multi-instance production, swap the
 * Map for Redis or push each event to your metering pipeline — the call sites and
 * the `record`/`snapshot` shape stay the same.
 */
export interface UsageEvent {
  clientId: string;
  endpoint: string;
  at: number;
}

export class UsageMeter {
  private readonly counts = new Map<string, number>();
  private total = 0;

  record(clientId: string, endpoint: string): void {
    this.total += 1;
    const byClient = `${clientId}`;
    const byEndpoint = `${clientId}::${endpoint}`;
    this.counts.set(byClient, (this.counts.get(byClient) ?? 0) + 1);
    this.counts.set(byEndpoint, (this.counts.get(byEndpoint) ?? 0) + 1);
  }

  forClient(clientId: string): { total: number; endpoints: Record<string, number> } {
    const endpoints: Record<string, number> = {};
    const prefix = `${clientId}::`;
    for (const [key, value] of this.counts) {
      if (key.startsWith(prefix)) {
        endpoints[key.slice(prefix.length)] = value;
      }
    }
    return { total: this.counts.get(clientId) ?? 0, endpoints };
  }

  snapshot(): { totalCalls: number; clients: number } {
    let clients = 0;
    for (const key of this.counts.keys()) {
      if (!key.includes("::")) clients += 1;
    }
    return { totalCalls: this.total, clients };
  }
}

export const meter = new UsageMeter();
