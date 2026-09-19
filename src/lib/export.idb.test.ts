import { describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import { unzipSync, strFromU8 } from 'fflate'
import { exportBackup } from './export'
import { saveFile } from './files'
import type { FileMeta, TimeEntry } from '../types'

const entryWith = (metas: FileMeta[]): TimeEntry => ({
  id: 'e1',
  date: '2026-09-18',
  timeIn: '09:00',
  timeOut: '17:00',
  breakMinutes: 60,
  task: 'Training',
  notes: '',
  status: 'draft',
  attachments: metas,
})

describe('exportBackup end-to-end with IndexedDB', () => {
  it('includes saved attachments and reports missing ones', async () => {
    const savedId = 'test-attachment-1'
    await saveFile(savedId, new Blob([new Uint8Array([9, 9, 9])], { type: 'image/png' }))

    const saved: FileMeta = { id: savedId, name: 'photo.png', type: 'image/png', size: 3 }
    const missing: FileMeta = { id: 'gone', name: 'lost.pdf', type: 'application/pdf', size: 5 }
    const entry = entryWith([saved, missing])

    const result = await exportBackup(
      { requiredHours: 0, startDate: '', holidays: [], defaultDailyHours: null },
      [entry],
    )
    const unzipped = unzipSync(result.bytes)
    expect(Object.keys(unzipped)).toContain('files/test-attachment-1/photo.png')
    expect(Object.keys(unzipped)).not.toContain('files/gone/lost.pdf')
    expect(JSON.parse(strFromU8(unzipped['backup.json'])).entries).toHaveLength(1)
    expect(result.missing).toEqual([missing])
  })
})
