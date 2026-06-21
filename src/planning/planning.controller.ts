import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  CompletePlannedDto,
  CreatePlannedDto,
  CreateTemplateDto,
  QuickAddDto,
  UpdatePlannedDto,
} from './planning.dto';
import { PlanningService } from './planning.service';

@Controller()
export class PlanningController {
  constructor(private readonly planning: PlanningService) {}

  // ── Templates ───────────────────────────────────────────────────────────────
  @Post('users/:userId/templates')
  createTemplate(@Param('userId') userId: string, @Body() dto: CreateTemplateDto) {
    return this.planning.createTemplate(userId, dto);
  }

  @Get('users/:userId/templates')
  listTemplates(@Param('userId') userId: string) {
    return this.planning.listTemplates(userId);
  }

  // ── Quick-add preview (parse-only, no save) ───────────────────────────────────
  @Post('planning/parse')
  parse(@Body() dto: QuickAddDto) {
    return this.planning.preview(dto.text);
  }

  // ── Planned workouts ─────────────────────────────────────────────────────────
  @Post('users/:userId/planned')
  createPlanned(@Param('userId') userId: string, @Body() dto: CreatePlannedDto) {
    return this.planning.createPlanned(userId, dto);
  }

  @Patch('planned/:id')
  updatePlanned(@Param('id') id: string, @Body() dto: UpdatePlannedDto) {
    return this.planning.updatePlanned(id, dto);
  }

  @Delete('planned/:id')
  async deletePlanned(@Param('id') id: string) {
    await this.planning.deletePlanned(id);
    return { ok: true };
  }

  @Post('planned/:id/complete')
  completePlanned(@Param('id') id: string, @Body() dto: CompletePlannedDto) {
    return this.planning.completePlanned(id, dto.workoutId);
  }

  // ── Reconciliation + today guidance ───────────────────────────────────────────
  @Post('users/:userId/reconcile')
  reconcile(@Param('userId') userId: string, @Query('date') date?: string) {
    return this.planning.reconcileDay(userId, date ?? new Date());
  }

  @Get('users/:userId/today')
  today(@Param('userId') userId: string) {
    return this.planning.todayGuidance(userId);
  }
}
