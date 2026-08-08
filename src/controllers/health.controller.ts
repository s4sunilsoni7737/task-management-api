import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  check() {
    const mongoStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const dbState = mongoStates[this.connection.readyState] || 'unknown';

    return {
      success: true,
      userMessage: 'Service is healthy',
      developerMessage: 'Health check passed',
      data: {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbState,
      },
    };
  }
}
