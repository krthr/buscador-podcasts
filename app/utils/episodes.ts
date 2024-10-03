import { Duration } from 'luxon'

export function srtFormatTimestamp(seconds: number | null): string {
  if (seconds) {
    return Duration.fromObject({ seconds }).toFormat('hh:mm:ss')
  }

  return '00:00:00'
}
