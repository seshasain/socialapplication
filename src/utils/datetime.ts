import { ValidationError } from '../types/errors';

interface DateTimeOptions {
  includeTime?: boolean;
  includeSeconds?: boolean;
  use24Hour?: boolean;
  timeZone?: string;
}

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

const DEFAULT_OPTIONS: DateTimeOptions = {
  includeTime: true,
  includeSeconds: false,
  use24Hour: false,
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
};

export function formatDate(date: Date | string, options: DateTimeOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    throw new ValidationError('Invalid date');
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: opts.timeZone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: opts.includeTime ? opts.use24Hour ? '2-digit' : 'numeric' : undefined,
    minute: opts.includeTime ? '2-digit' : undefined,
    second: opts.includeTime && opts.includeSeconds ? '2-digit' : undefined,
    hour12: !opts.use24Hour
  });

  return formatter.format(d);
}

export function parseDate(dateString: string, timeZone?: string): Date {
  const parsedDate = new Date(dateString);
  if (isNaN(parsedDate.getTime())) {
    throw new ValidationError('Invalid date string');
  }

  if (timeZone) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });

    const parts = formatter.formatToParts(parsedDate);
    const dateObj: Record<string, string> = {};
    parts.forEach(part => {
      if (part.type !== 'literal') {
        dateObj[part.type] = part.value;
      }
    });

    return new Date(
      parseInt(dateObj.year),
      parseInt(dateObj.month) - 1,
      parseInt(dateObj.day),
      parseInt(dateObj.hour),
      parseInt(dateObj.minute),
      parseInt(dateObj.second)
    );
  }

  return parsedDate;
}

export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
}

export function getTimeSlots(
  startDate: Date,
  endDate: Date,
  duration: number,
  excludedTimes: Date[] = []
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  let currentSlot = new Date(startDate);

  while (currentSlot < endDate) {
    const slotEnd = new Date(currentSlot.getTime() + duration * 60000);
    const isExcluded = excludedTimes.some(
      excludedTime =>
        excludedTime >= currentSlot && excludedTime < slotEnd
    );

    slots.push({
      start: new Date(currentSlot),
      end: new Date(slotEnd),
      available: !isExcluded
    });

    currentSlot = slotEnd;
  }

  return slots;
}

export function addDuration(date: Date, duration: number, unit: 'minutes' | 'hours' | 'days'): Date {
  const result = new Date(date);
  switch (unit) {
    case 'minutes':
      result.setMinutes(result.getMinutes() + duration);
      break;
    case 'hours':
      result.setHours(result.getHours() + duration);
      break;
    case 'days':
      result.setDate(result.getDate() + duration);
      break;
  }
  return result;
}

export function subtractDuration(date: Date, duration: number, unit: 'minutes' | 'hours' | 'days'): Date {
  return addDuration(date, -duration, unit);
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function getDaysBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
}

export function getNextBusinessDay(date: Date): Date {
  const result = new Date(date);
  do {
    result.setDate(result.getDate() + 1);
  } while (!isBusinessDay(result));
  return result;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

export function parseTimeString(timeString: string): Date {
  const [time, meridiem] = timeString.toLowerCase().split(/\s+/);
  const [hours, minutes] = time.split(':').map(Number);

  if (isNaN(hours) || isNaN(minutes)) {
    throw new ValidationError('Invalid time format');
  }

  const date = new Date();
  date.setHours(0, 0, 0, 0);

  if (meridiem) {
    if (meridiem === 'pm' && hours !== 12) {
      date.setHours(hours + 12);
    } else if (meridiem === 'am' && hours === 12) {
      date.setHours(0);
    } else {
      date.setHours(hours);
    }
  } else {
    date.setHours(hours);
  }

  date.setMinutes(minutes);
  return date;
}

export function getDateRangeArray(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

export function getMonthDays(year: number, month: number): Date[] {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  return getDateRangeArray(startDate, endDate);
}

export function getQuarterDates(date: Date): { start: Date; end: Date } {
  const quarter = Math.floor(date.getMonth() / 3);
  const startMonth = quarter * 3;
  const endMonth = startMonth + 2;
  
  return {
    start: new Date(date.getFullYear(), startMonth, 1),
    end: new Date(date.getFullYear(), endMonth + 1, 0)
  };
} 