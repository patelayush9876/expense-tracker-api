import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  onModuleInit() {
    this.setupKeepAlive();
  }

  private setupKeepAlive() {
    const url = process.env.RENDER_EXTERNAL_URL;

    if (!url) {
      this.logger.log(
        'RENDER_EXTERNAL_URL is not set. Keep-alive self-pinging is disabled (normal for local development).',
      );
      return;
    }

    this.logger.log(`Keep-alive self-pinging initialized. Target URL: ${url}`);

    // Ping every 10 minutes (600,000 ms) to stay well within Render's 15-minute inactivity window
    setInterval(async () => {
      try {
        const healthUrl = `${url.replace(/\/$/, '')}/health`;
        this.logger.log(`Sending keep-alive ping to ${healthUrl}...`);
        
        const response = await fetch(healthUrl);
        if (response.ok) {
          this.logger.log(`Keep-alive ping successful: ${response.status}`);
        } else {
          this.logger.warn(`Keep-alive ping returned status: ${response.status}`);
        }
      } catch (error) {
        this.logger.error('Error during keep-alive self-ping:', error);
      }
    }, 10 * 60 * 1000);
  }
}
