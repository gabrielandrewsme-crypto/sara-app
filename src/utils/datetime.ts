const pad = (n: number) => String(n).padStart(2, '0');

export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEKDAY_FULL = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];

export function todayWeekday(): number {
  return new Date().getDay();
}

export function parseDateTimeLocal(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?$/.exec(trimmed);
  if (!m) return null;
  const [, y, mo, d, h = '00', mi = '00'] = m;
  return `${y}-${pad(Number(mo))}-${pad(Number(d))}T${pad(Number(h))}:${mi}:00`;
}

export function formatDateTimeLocal(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDateBR(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatDateTimeBR(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return `${formatDateBR(value)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 5);
}

export function parseTime(input: string): string | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(input.trim());
  if (!m) return null;
  return `${pad(Number(m[1]))}:${m[2]}:00`;
}

export function formatCurrencyBRL(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}R$ ${formatted}`;
}
