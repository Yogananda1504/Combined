import { createLogger, format, transports } from 'winston';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';


const __dirname = dirname(fileURLToPath(import.meta.url));

const createCustomLogger = (name) => {
  return createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
    ),
    transports: [
      new transports.File({ filename: join(__dirname, `../logs/${name}.log`) }),
      new transports.Console()
    ],
  });
};

export const email_logger = createCustomLogger('emailNotifications');
