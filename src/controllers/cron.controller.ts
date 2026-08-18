import { Controller, Post, UnauthorizedException, Headers } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CronService } from '../services/cron.service';

@ApiTags('Cron')
@Controller('cron')
export class CronController {
  constructor(private readonly cronService: CronService) {}

  @Post('tasks/overdue')
  async handleOverdueTasks(@Headers('authorization') authHeader: string) {
    // Vercel Cron automatically sends the CRON_SECRET as a Bearer token
    // Example: Authorization: Bearer <CRON_SECRET>
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        throw new UnauthorizedException('Invalid cron secret');
      }
    } else {
      // For local development if CRON_SECRET is not set, optionally just allow it,
      // or check a custom header. For now, if no CRON_SECRET is configured, we allow it.
      // But logging a warning is good practice.
      console.warn('CRON_SECRET is not set. The cron endpoint is unprotected.');
    }

    const result = await this.cronService.transitionOverdueTasks();
    return result;
  }
}
