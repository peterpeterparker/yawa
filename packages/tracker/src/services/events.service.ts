import { EventsApi } from "../api/events.api";
import type { Environment } from "../types/env";
import type {
  SetPageViewRequest,
  SetPerformanceMetricRequest,
  SetTrackEventRequest,
} from "../types/api";

export class EventsService {
  readonly #visitId: string;
  readonly #api: EventsApi;

  constructor(env: Environment) {
    this.#api = new EventsApi(env);
    this.#visitId = window.crypto.randomUUID();
  }

  async setPageView(entry: Omit<SetPageViewRequest, "visit_id">): Promise<void> {
    const request: SetPageViewRequest = {
      ...this.visitId(),
      ...entry,
    };

    await this.#api.postPageViews({ request });
  }

  async setTrackEvent(entry: Omit<SetTrackEventRequest, "visit_id">): Promise<void> {
    const request: SetTrackEventRequest = {
      ...this.visitId(),
      ...entry,
    };

    await this.#api.postTrackEvents({ request });
  }

  async setPerformanceMetric(entry: Omit<SetPerformanceMetricRequest, "visit_id">): Promise<void> {
    const request: SetPerformanceMetricRequest = {
      ...this.visitId(),
      ...entry,
    };

    await this.#api.postPerformanceMetrics({ request });
  }

  private visitId(): { visit_id: string } {
    return {
      visit_id: this.#visitId,
    };
  }
}
