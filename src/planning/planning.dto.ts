import { Intensity, PlannedStatus } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsString()
  sportType!: string;

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

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsArray()
  steps?: unknown[];
}

export class QuickAddDto {
  @IsString()
  @MaxLength(280)
  text!: string;
}

/** Create a planned workout one of three ways: `text` (quick-add), `templateId`, or explicit fields. */
export class CreatePlannedDto {
  @IsISO8601()
  date!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  text?: string;

  @IsOptional()
  @IsString()
  templateId?: string;

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
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsArray()
  steps?: unknown[];
}

export class UpdatePlannedDto {
  @IsOptional()
  @IsISO8601()
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsEnum(Intensity)
  intensity?: Intensity;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedDurationMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsEnum(PlannedStatus)
  status?: PlannedStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class CompletePlannedDto {
  @IsOptional()
  @IsString()
  workoutId?: string;
}
