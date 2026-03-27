import fs from "node:fs";
import path from "node:path";
import pino from "pino";

export const createLogger = async (logFile: string) => {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  return pino(
    {
      level: "info",
    },
    pino.destination(logFile),
  );
};
