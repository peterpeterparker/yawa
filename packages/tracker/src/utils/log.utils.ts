const SERVICES_UNDEFINED_MSG =
  "Unable to connect to the analytics services. Did you call `initAnalytics`?";

export const warningServicesNotInitialized = <T>(value: T) => {
  if (value === undefined || value === null) {
    console.warn(SERVICES_UNDEFINED_MSG);
  }
};
