import { describe, it, expect } from 'vitest';
import { createFinancialRecordSchema } from '../financial-records';

describe('Financial Record Validations', () => {
  const validRecord = {
    type: 'income' as const,
    amount: 1000,
    currency: 'USD',
    date: '2026-01-10',
    description: 'Freelance work',
    status: 'completed' as const,
  };

  describe('createFinancialRecordSchema', () => {
    it('should accept valid income record', () => {
      const result = createFinancialRecordSchema.safeParse(validRecord);
      expect(result.success).toBe(true);
    });

    it('should accept valid expense record', () => {
      const result = createFinancialRecordSchema.safeParse({
        ...validRecord,
        type: 'expense',
      });
      expect(result.success).toBe(true);
    });

    it('should accept record with optional fields', () => {
      const result = createFinancialRecordSchema.safeParse({
        ...validRecord,
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        job_id: '123e4567-e89b-12d3-a456-426614174001',
        notes: 'Additional notes',
      });
      expect(result.success).toBe(true);
    });

    it('should accept record without category or job', () => {
      const result = createFinancialRecordSchema.safeParse({
        ...validRecord,
        category_id: null,
        job_id: null,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      const result = createFinancialRecordSchema.safeParse({
        ...validRecord,
        category_id: 'invalid-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative amounts', () => {
      const result = createFinancialRecordSchema.safeParse({
        ...validRecord,
        amount: -100,
      });
      expect(result.success).toBe(false);
    });

    it('should reject zero amount', () => {
      const result = createFinancialRecordSchema.safeParse({
        ...validRecord,
        amount: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should require description', () => {
      const result = createFinancialRecordSchema.safeParse({
        ...validRecord,
        description: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject description over 200 characters', () => {
      const result = createFinancialRecordSchema.safeParse({
        ...validRecord,
        description: 'a'.repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it('should trim description whitespace', () => {
      const result = createFinancialRecordSchema.safeParse({
        ...validRecord,
        description: '  Test Description  ',
      });
      if (result.success) {
        expect(result.data.description).toBe('Test Description');
      }
    });

    it('should accept different currencies', () => {
      const currencies = ['USD', 'EUR', 'GBP', 'JPY'];
      currencies.forEach((currency) => {
        const result = createFinancialRecordSchema.safeParse({
          ...validRecord,
          currency,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid date format', () => {
      const result = createFinancialRecordSchema.safeParse({
        ...validRecord,
        date: '01/10/2026',
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid date formats', () => {
      const result = createFinancialRecordSchema.safeParse({
        ...validRecord,
        date: '2026-01-10',
      });
      expect(result.success).toBe(true);
    });
  });
});
