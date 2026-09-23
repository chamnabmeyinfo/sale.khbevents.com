/**
 * One CSV cell: quoted, with quotes doubled. Cells that a spreadsheet would
 * treat as a formula (=, +, -, @, tab, CR) get a leading apostrophe so a lead
 * named "=HYPERLINK(...)" is shown as text instead of executed.
 */
export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * A complete CSV document. Starts with a UTF-8 byte-order mark so Excel reads
 * Khmer text correctly, and uses CRLF line endings as Excel expects.
 */
export function toCsv(headers: string[], rows: unknown[][]): string {
  return '﻿' + [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}
