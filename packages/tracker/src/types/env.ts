/**
 * The options to configure the environment of the library.
 */
export interface Environment {
  /**
   * The URL of the analytics server to send events to.
   * @example "[https://analytics](https://analytics.example.com).yourdomain.com"
   */
  serverUrl: string;

  /**
   * Enable or disable tracking performances with Web Vitals.
   * @default false
   */
  webVitals?: boolean;
}
