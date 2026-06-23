import { RequestMethod } from '@nestjs/common';
import { Params } from 'nestjs-pino';

import { config } from '@/config';

export const loggerConfig: Params = {
  pinoHttp: {
    level: config.logger.level,

    transport:
      config.app.environment !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              singleLine: true,
              colorize: true,
              translateTime: 'SYS:standard',
            },
          }
        : undefined,

    autoLogging: true,
  },
  forRoutes: [{ method: RequestMethod.ALL, path: '*splat' }],
};
