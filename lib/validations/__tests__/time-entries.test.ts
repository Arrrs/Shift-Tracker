import { describe, it, expect } from 'vitest';
import { workShiftSchema, dayOffSchema, timeSchema } from '../time-entries';

describe('Time Entry Validations', () => {
  describe('timeSchema', () => {
    it('should accept valid HH:MM format', () => {
      expect(() => timeSchema.parse('09:00')).not.toThrow();
      expect(() => timeSchema.parse('14:30')).not.toThrow();
      expect(() => timeSchema.parse('23:59')).not.toThrow();
      expect(() => timeSchema.parse('00:00')).not.toThrow();
    });

    it('should accept single-digit hours', () => {
      expect(() => timeSchema.parse('9:00')).not.toThrow();
      expect(() => timeSchema.parse('0:30')).not.toThrow();
    });

    it('should reject HH:MM:SS format', () => {
      expect(() => timeSchema.parse('09:00:00')).toThrow();
      expect(() => timeSchema.parse('14:30:45')).toThrow();
    });

    it('should reject invalid formats', () => {
      expect(() => timeSchema.parse('25:00')).toThrow();
      expect(() => timeSchema.parse('12:60')).toThrow();
      expect(() => timeSchema.parse('abc')).toThrow();
      expect(() => timeSchema.parse('')).toThrow();
    });
  });

  describe('workShiftSchema', () => {
    const validWorkShift = {
      entry_type: 'work_shift' as const,
      date: '2026-01-10',
      start_time: '09:00',
      end_time: '17:00',
      scheduled_hours: 8,
      actual_hours: 8,
      is_overnight: false,
      is_holiday: false,
      status: 'completed',
    };

    it('should accept valid work shift', () => {
      const result = workShiftSchema.safeParse(validWorkShift);
      expect(result.success).toBe(true);
    });

    it('should accept work shift without job', () => {
      const result = workShiftSchema.safeParse({
        ...validWorkShift,
        job_id: null,
      });
      expect(result.success).toBe(true);
    });

    it('should accept work shift with optional fields', () => {
      const result = workShiftSchema.safeParse({
        ...validWorkShift,
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        template_id: '123e4567-e89b-12d3-a456-426614174001',
        custom_hourly_rate: 25.5,
        pay_override_type: 'custom_hourly',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      const result = workShiftSchema.safeParse({
        ...validWorkShift,
        job_id: 'invalid-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative hours', () => {
      const result = workShiftSchema.safeParse({
        ...validWorkShift,
        actual_hours: -5,
      });
      expect(result.success).toBe(false);
    });

    it('should reject end time before start time for non-overnight', () => {
      const result = workShiftSchema.safeParse({
        ...validWorkShift,
        start_time: '17:00',
        end_time: '09:00',
        is_overnight: false,
      });
      expect(result.success).toBe(false);
    });

    it('should accept end time before start time for overnight shifts', () => {
      const result = workShiftSchema.safeParse({
        ...validWorkShift,
        start_time: '23:00',
        end_time: '07:00',
        is_overnight: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('dayOffSchema', () => {
    const validDayOff = {
      entry_type: 'day_off' as const,
      date: '2026-01-10',
      day_off_type: 'pto',
      actual_hours: 8,
      is_full_day: true,
      status: 'completed',
    };

    it('should accept valid day off', () => {
      const result = dayOffSchema.safeParse(validDayOff);
      expect(result.success).toBe(true);
    });

    it('should accept all day off types', () => {
      const types = ['pto', 'sick', 'personal', 'unpaid', 'bereavement', 'maternity', 'paternity', 'jury_duty'];
      types.forEach((type) => {
        const result = dayOffSchema.safeParse({
          ...validDayOff,
          day_off_type: type,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should accept partial day off', () => {
      const result = dayOffSchema.safeParse({
        ...validDayOff,
        actual_hours: 4,
        is_full_day: false,
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative hours', () => {
      const result = dayOffSchema.safeParse({
        ...validDayOff,
        actual_hours: -2,
      });
      expect(result.success).toBe(false);
    });
  });
});
