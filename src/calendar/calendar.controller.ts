import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { CalendarService } from './calendar.service';

@Controller('users/:userId/calendar')
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  /** GET /users/:userId/calendar?from=2026-06-15&to=2026-06-21 */
  @Get()
  range(
    @Param('userId') userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (!from || !to) {
      throw new BadRequestException('`from` and `to` query params (YYYY-MM-DD) are required.');
    }
    return this.calendar.range(userId, from, to);
  }
}
