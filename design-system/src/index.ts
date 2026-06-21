// helf design system — public entry point.
// Tokens + base styles ship in the bundled stylesheet via these side-effect imports.
import './tokens/tokens.css';
import './styles/global.css';

export { Button } from './components/Button/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './components/Button/Button';

export { Card } from './components/Card/Card';
export type { CardProps } from './components/Card/Card';

export { Badge } from './components/Badge/Badge';
export type { BadgeProps, BadgeTone } from './components/Badge/Badge';

export { MetricCard } from './components/MetricCard/MetricCard';
export type { MetricCardProps, TrendDirection } from './components/MetricCard/MetricCard';

export { ScoreRing } from './components/ScoreRing/ScoreRing';
export type { ScoreRingProps } from './components/ScoreRing/ScoreRing';

export { SleepStagesBar } from './components/SleepStagesBar/SleepStagesBar';
export type {
  SleepStagesBarProps,
  SleepStages,
} from './components/SleepStagesBar/SleepStagesBar';

export { ReadinessBanner } from './components/ReadinessBanner/ReadinessBanner';
export type { ReadinessBannerProps } from './components/ReadinessBanner/ReadinessBanner';

export { TrainingLoadCard } from './components/TrainingLoadCard/TrainingLoadCard';
export type { TrainingLoadCardProps, AcwrZone } from './components/TrainingLoadCard/TrainingLoadCard';

// ── Planning ──────────────────────────────────────────────────────────────────
export { IntensityPill } from './components/IntensityPill/IntensityPill';
export type { IntensityPillProps } from './components/IntensityPill/IntensityPill';

export { SportIcon, sportEmoji } from './components/SportIcon/SportIcon';
export type { SportIconProps } from './components/SportIcon/SportIcon';

export { WorkoutCard } from './components/WorkoutCard/WorkoutCard';
export type { WorkoutCardProps } from './components/WorkoutCard/WorkoutCard';

export { TemplateChip } from './components/TemplateChip/TemplateChip';
export type { TemplateChipProps } from './components/TemplateChip/TemplateChip';

export { QuickAddInput } from './components/QuickAddInput/QuickAddInput';
export type { QuickAddInputProps, QuickAddParsed } from './components/QuickAddInput/QuickAddInput';

export { CalendarDayCell } from './components/CalendarDayCell/CalendarDayCell';
export type { CalendarDayCellProps, DayCellItem } from './components/CalendarDayCell/CalendarDayCell';

export { CalendarWeek } from './components/CalendarWeek/CalendarWeek';
export type { CalendarWeekProps, CalendarWeekDay } from './components/CalendarWeek/CalendarWeek';

export { TodayPanel } from './components/TodayPanel/TodayPanel';
export type { TodayPanelProps, TodayAdjustment } from './components/TodayPanel/TodayPanel';

// ── Shared types & tokens ─────────────────────────────────────────────────────
export type { Intensity, WorkoutStatus, ReadinessStatus, DayAction } from './types';
export { tokens, toneForScore } from './tokens/tokens';
export type { Tone } from './tokens/tokens';
