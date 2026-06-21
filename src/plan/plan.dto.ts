import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { BlockFocus, Intensity } from '../domain/enums';

export class PlanBlockDto {
  @IsString()
  @MaxLength(60)
  name!: string;

  @IsOptional()
  @IsEnum(BlockFocus)
  focus?: BlockFocus;

  @IsInt()
  @Min(1)
  @Max(52)
  weeks!: number;

  @IsOptional()
  @IsNumber()
  weeklyLoadTarget?: number;
}

export class CreatePlanDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsISO8601()
  startDate!: string;

  @IsOptional()
  @IsISO8601()
  goalDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanBlockDto)
  blocks?: PlanBlockDto[];
}

export class CreateRecurringRuleDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  sportType?: string;

  @IsOptional()
  @IsEnum(Intensity)
  intensity?: Intensity;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedDurationMin?: number;

  @IsOptional()
  @IsNumber()
  estimatedLoad?: number;

  /** Weekday numbers, 0 = Sunday … 6 = Saturday. */
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek!: number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  weekInterval?: number;

  @IsISO8601()
  startDate!: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
