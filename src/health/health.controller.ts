import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string; service: string; time: string } {
    return { status: 'ok', service: 'helf', time: new Date().toISOString() };
  }
}
