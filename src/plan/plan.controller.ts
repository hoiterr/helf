import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { addDays } from '../common/time';
import { CreatePlanDto, CreateRecurringRuleDto } from './plan.dto';
import { PlanService } from './plan.service';

@Controller()
export class PlanController {
  constructor(private readonly plan: PlanService) {}

  // ── Plans + blocks ────────────────────────────────────────────────────────────
  @Post('users/:userId/plans')
  createPlan(@Param('userId') userId: string, @Body() dto: CreatePlanDto) {
    return this.plan.createPlan(userId, dto);
  }

  @Get('users/:userId/plans')
  listPlans(@Param('userId') userId: string) {
    return this.plan.listPlans(userId);
  }

  @Get('plans/:id')
  getPlan(@Param('id') id: string) {
    return this.plan.getPlan(id);
  }

  /** Week-by-week periodization overview (block, focus, target vs. planned load). */
  @Get('plans/:id/schedule')
  schedule(@Param('id') id: string) {
    return this.plan.schedule(id);
  }

  // ── Recurring rules ────────────────────────────────────────────────────────────
  @Post('users/:userId/recurring')
  createRule(@Param('userId') userId: string, @Body() dto: CreateRecurringRuleDto) {
    return this.plan.createRecurringRule(userId, dto);
  }

  @Get('users/:userId/recurring')
  listRules(@Param('userId') userId: string) {
    return this.plan.listRules(userId);
  }

  @Delete('recurring/:id')
  deleteRule(@Param('id') id: string, @Query('deleteFuture') deleteFuture?: string) {
    return this.plan.deleteRule(id, deleteFuture === 'true');
  }

  /**
   * Generate planned sessions from recurring rules over a range. Defaults to the
   * next 4 weeks if `from`/`to` are omitted — call this to extend the horizon.
   */
  @Post('users/:userId/materialize')
  materialize(
    @Param('userId') userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const start = from ?? new Date().toISOString();
    const end = to ?? addDays(new Date(start), 28).toISOString();
    return this.plan.materialize(userId, start, end);
  }
}
