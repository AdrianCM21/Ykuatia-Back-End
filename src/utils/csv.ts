export const toCsv = (headers: string[], rows: Array<Array<string | number | null | undefined>>): string => {
  const escape = (value: string | number | null | undefined) => {
    const raw = value == null ? '' : String(value);
    if (/[",\n\r]/.test(raw)) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  };
  const lines = [headers.map(escape).join(',')];
  for (const row of rows) {
    lines.push(row.map(escape).join(','));
  }
  return `\uFEFF${lines.join('\n')}`;
};

export const agingBucket = (dias: number): '0-30' | '31-60' | '61-90' | '90+' => {
  if (dias <= 30) return '0-30';
  if (dias <= 60) return '31-60';
  if (dias <= 90) return '61-90';
  return '90+';
};

export const daysBetween = (from: Date, to: Date = new Date()): number => {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / 86400000));
};
