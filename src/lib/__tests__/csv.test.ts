import { describe, expect, it } from 'vitest';
import { csvCell, toCsv } from '../csv';

describe('csvCell', () => {
  it('quotes and escapes', () => {
    expect(csvCell('Tea, "Cafe"')).toBe('"Tea, ""Cafe"""');
    expect(csvCell(undefined)).toBe('""');
    expect(csvCell(42)).toBe('"42"');
  });

  it('neutralises spreadsheet formulas', () => {
    expect(csvCell('=HYPERLINK("http://x")')).toBe('"\'=HYPERLINK(""http://x"")"');
    expect(csvCell('+85512')).toBe('"\'+85512"');
    expect(csvCell('@SUM(A1)')).toBe('"\'@SUM(A1)"');
  });
});

describe('toCsv', () => {
  it('adds a BOM and CRLF rows', () => {
    const csv = toCsv(['Name'], [['សុខា'], ['Dara']]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1)).toBe('"Name"\r\n"សុខា"\r\n"Dara"');
  });
});
