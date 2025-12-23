
/**
 * Parses duration strings like "1w 2d 5h 30m 10s 500ms" into total seconds.
 */
export const parseDurationToSeconds = (durationStr: string): number => {
  if (!durationStr || durationStr === '0s' || durationStr === '0' || durationStr.trim() === '') return 0;
  
  const regex = /(\d+)\s*(w|d|h|m|s|ms)/g;
  let totalSeconds = 0;
  let match;

  while ((match = regex.exec(durationStr)) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'w': totalSeconds += value * 604800; break;
      case 'd': totalSeconds += value * 86400; break;
      case 'h': totalSeconds += value * 3600; break;
      case 'm': totalSeconds += value * 60; break;
      case 's': totalSeconds += value; break;
      case 'ms': totalSeconds += value * 0.001; break;
    }
  }
  return totalSeconds;
};

/**
 * Formats seconds back to a human-readable duration (HH:MM:SS).
 */
export const formatSecondsToTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds <= 0) return '00:00:00';
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const h = hrs < 10 ? '0' + hrs : hrs;
  const m = mins < 10 ? '0' + mins : mins;
  const s = secs < 10 ? '0' + secs : secs;

  return `${h}:${m}:${s}`;
};

/**
 * Parses the raw CSV text provided by the user.
 */
export const parseCSVData = (csvText: string) => {
  if (!csvText) return [];
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];
  
  return lines.slice(1)
    .filter(line => line.trim() !== '' && line.includes(';'))
    .map(line => {
      const values = line.split(';');
      if (values.length < 8) return null;

      const dataStr = values[4] ? values[4].trim() : '';
      let dateObj: Date;

      try {
        if (dataStr.includes('-')) {
          dateObj = new Date(dataStr.replace(' ', 'T'));
        } else if (dataStr.includes('/')) {
          const [datePart, timePart] = dataStr.split(' ');
          const [d, m, y] = datePart.split('/');
          dateObj = new Date(`${y}-${m}-${d}T${timePart || '00:00:00'}`);
        } else {
          dateObj = new Date(NaN);
        }
      } catch (e) {
        dateObj = new Date(NaN);
      }

      return {
        plataforma: (values[0] || '').toUpperCase() as 'FRESH' | 'BLIP',
        numeroTicket: values[1] || 'N/A',
        fila: values[2] || '',
        agente: values[3] || 'Desconhecido',
        dataOriginal: dataStr,
        dataObj: dateObj,
        categoria: values[5] || 'SEM CATEGORIA',
        ahtOriginal: values[6] || '0s',
        frtOriginal: values[7] || '0s',
        ahtSeconds: parseDurationToSeconds(values[6]),
        frtSeconds: parseDurationToSeconds(values[7]),
        cliente: values[8] || ''
      };
    })
    .filter(item => item !== null && !isNaN(item.dataObj.getTime()));
};
