import { describe, expect, it } from 'vitest';
import { toWhatsAppNumber } from '../phone';

describe('toWhatsAppNumber', () => {
  it('adds the Cambodian country code to local numbers', () => {
    expect(toWhatsAppNumber('012 345 678')).toBe('85512345678');
    expect(toWhatsAppNumber('098-765-432')).toBe('85598765432');
    expect(toWhatsAppNumber('12 345 678')).toBe('85512345678');
  });

  it('keeps international numbers', () => {
    expect(toWhatsAppNumber('+855 12 345 678')).toBe('85512345678');
    expect(toWhatsAppNumber('855 12 345 678')).toBe('85512345678');
    expect(toWhatsAppNumber('+84 90 123 4567')).toBe('84901234567');
    expect(toWhatsAppNumber('0084 90 123 4567')).toBe('84901234567');
  });

  it('handles empty input', () => {
    expect(toWhatsAppNumber('')).toBe('');
    expect(toWhatsAppNumber(undefined)).toBe('');
  });
});
