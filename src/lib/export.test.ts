import { describe, expect, it } from 'vitest'
import { unzipSync, strFromU8, zipSync, strToU8 } from 'fflate'
import { buildExportData, buildZipFile, exportFilename, parseBackup, validateExportData } from './export'
import type { FileMeta, Settings, TimeEntry } from '../types'

const settings: Settings = {
  requiredHours: 500,
  startDate: '2026-08-01',
  holidays: ['2026-09-07'],
  defaultDailyHours: 8,
}

const entry: TimeEntry = {
  id: 'e1',
  date: '2026-09-18',
  timeIn: '09:00',
  timeOut: '17:00',
  breakMinutes: 60,
  task: 'Training',
  notes: '',
  attachments: [{ id: 'a1', name: 'photo.png', type: 'image/png', size: 3 }],
}

describe('buildExportData', () => {
  it('builds the backup payload with settings and entries', () => {
    const now = new Date('2026-09-19T08:30:00')
    const data = buildExportData(settings, [entry], now)
    expect(data).toEqual({
      app: 'ojt-hours-tracker',
      version: 1,
      exportedAt: now.toISOString(),
      settings,
      entries: [entry],
    })
  })
})

describe('exportFilename', () => {
  it('uses the local date', () => {
    expect(exportFilename(new Date(2026, 8, 19, 23, 59))).toBe('ojt-backup-2026-09-19.zip')
  })
})

describe('buildZipFile', () => {
  it('zips backup.json and attachments under files/<id>/<name>', async () => {
    const data = buildExportData(settings, [entry])
    const meta: FileMeta = entry.attachments![0]
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' })
    const bytes = await buildZipFile(data, [{ meta, blob }])

    const unzipped = unzipSync(bytes)
    expect(Object.keys(unzipped).sort()).toEqual(['backup.json', 'files/a1/photo.png'])
    expect(JSON.parse(strFromU8(unzipped['backup.json']))).toEqual(data)
    expect([...unzipped['files/a1/photo.png']]).toEqual([1, 2, 3])
  })
})

describe('validateExportData', () => {
  it('accepts a valid payload', () => {
    const data = buildExportData(settings, [entry])
    expect(validateExportData(data)).toEqual(data)
  })

  it('rejects wrong app id, version, or missing fields', () => {
    const data = buildExportData(settings, [])
    expect(validateExportData(null)).toBeNull()
    expect(validateExportData({})).toBeNull()
    expect(validateExportData({ ...data, app: 'other' })).toBeNull()
    expect(validateExportData({ ...data, version: 2 })).toBeNull()
    expect(validateExportData({ app: 'ojt-hours-tracker', version: 1 })).toBeNull()
  })
})

describe('parseBackup', () => {
  it('round-trips a zip produced by buildZipFile', async () => {
    const data = buildExportData(settings, [entry])
    const meta: FileMeta = entry.attachments![0]
    const blob = new Blob([new Uint8Array([4, 5, 6])], { type: 'image/png' })
    const zip = await buildZipFile(data, [{ meta, blob }])

    const parsed = parseBackup(zip)
    expect(parsed.data).toEqual(data)
    expect(parsed.files).toEqual([{ meta, bytes: new Uint8Array([4, 5, 6]) }])
  })

  it('throws on a zip without backup.json', () => {
    const zip = zipSync({ 'other.txt': strToU8('x') })
    expect(() => parseBackup(zip)).toThrow()
  })

  it('throws on an invalid payload', () => {
    const zip = zipSync({ 'backup.json': strToU8(JSON.stringify({ nope: true })) })
    expect(() => parseBackup(zip)).toThrow()
  })
})
