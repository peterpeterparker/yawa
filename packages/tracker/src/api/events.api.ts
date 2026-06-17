import type { Environment } from "../types/env";
import type {
  SetPageViewRequest,
  SetPerformanceMetricRequest,
  SetTrackEventRequest,
} from "../types/api";

type ApiPath = "/events/view" | "/events/track" | "/events/metric";

export class ApiError extends Error {
  constructor(
    private readonly status: number,
    private readonly statusText: string,
  ) {
    super(`[${status}] Analytics error: ${statusText}`);
  }
}

export class EventsApi {
  readonly #serverUrl: string;

  constructor({ serverUrl }: Pick<Environment, "serverUrl">) {
    this.#serverUrl = serverUrl;
  }

  async postPageViews({ request: payload }: { request: SetPageViewRequest }): Promise<void> {
    await this.post<SetPageViewRequest>({
      path: "/events/view",
      payload,
    });
  }

  async postTrackEvents({ request: payload }: { request: SetTrackEventRequest }): Promise<void> {
    await this.post<SetTrackEventRequest>({
      path: "/events/track",
      payload,
    });
  }

  async postPerformanceMetrics({
    request: payload,
  }: {
    request: SetPerformanceMetricRequest;
  }): Promise<void> {
    await this.post<SetPerformanceMetricRequest>({
      path: "/events/metric",
      payload,
    });
  }

  async post<T>({ path, payload }: { path: ApiPath; payload: T }): Promise<void> {
    const response = await fetch(`${this.#serverUrl}${path}`, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }
  }
}
