/**
 * Structured logging. Debug logs only when DEBUG_* env is set.
 */
type LogLevel = "debug" | "info" | "warn" | "error";

function shouldLog(level: LogLevel, topic?: string): boolean {
  if (level === "error" || level === "warn") return true;
  if (level === "debug") {
    if (process.env.DEBUG === "1" || process.env.DEBUG === "true") return true;
    if (topic && process.env[`DEBUG_${topic.toUpperCase().replace(/-/g, "_")}`] === "1")
      return true;
    return false;
  }
  return true;
}

function formatMessage(topic: string, ...args: unknown[]): string {
  return `[${topic}] ${args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")}`;
}

export const logger = {
  debug(topic: string, ...args: unknown[]): void {
    if (shouldLog("debug", topic)) {
      console.log(formatMessage(topic, ...args));
    }
  },
  info(topic: string, ...args: unknown[]): void {
    if (shouldLog("info")) {
      console.log(formatMessage(topic, ...args));
    }
  },
  warn(topic: string, ...args: unknown[]): void {
    if (shouldLog("warn")) {
      console.warn(formatMessage(topic, ...args));
    }
  },
  error(topic: string, ...args: unknown[]): void {
    if (shouldLog("error")) {
      console.error(formatMessage(topic, ...args));
    }
  },
};
