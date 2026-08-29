function formatIcsDate(iso: string): string {
  // Wydarzenie całodniowe, format YYYYMMDD
  return iso.slice(0, 10).replace(/-/g, '');
}

function escapeIcsText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildServiceIcs(params: { title: string; date: string; note?: string; vehicleLabel: string }): Blob {
  const { title, date, note, vehicleLabel } = params;
  const dtStart = formatIcsDate(date);
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  const dtEnd = formatIcsDate(nextDay.toISOString());
  const uid = `carlog-${Date.now()}@carlog.local`;
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const descriptionParts = [vehicleLabel, note].filter(Boolean);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CarLog//PL',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${escapeIcsText(`Serwis: ${title}`)}`,
    ...(descriptionParts.length ? [`DESCRIPTION:${escapeIcsText(descriptionParts.join(' - '))}`] : []),
    'BEGIN:VALARM',
    'TRIGGER:-PT9H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcsText(`Serwis: ${title}`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
}
