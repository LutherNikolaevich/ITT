import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import type { FileMeta, Settings, TimeEntry } from '../types'
import { loadFile } from './files'

const APP_ID = 'ojt-hours-tracker'
const EXPORT_VERSION = 1

export interface ExportData {
  app: string
  version: number
  exportedAt: string
  settings: Settings
  entries: TimeEntry[]
}

export function buildExportData(settings: Settings, entries: TimeEntry[], now = new Date()): ExportData {
  return {
    app: APP_ID,
    version: EXPORT_VERSION,
    exportedAt: now.toISOString(),
    settings,
    entries,
  }
}

export function exportFilename(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `ojt-backup-${y}-${m}-${d}.zip`
}

export async function buildZipFile(
  data: ExportData,
  files: { meta: FileMeta; blob: Blob }[],
): Promise<Uint8Array> {
  const zipped: Record<string, Uint8Array> = {
    'backup.json': strToU8(JSON.stringify(data, null, 2)),
  }
  for (const { meta, blob } of files) {
    zipped[`files/${meta.id}/${meta.name}`] = new Uint8Array(await blob.arrayBuffer())
  }
  return zipSync(zipped)
}

export async function exportBackup(settings: Settings, entries: TimeEntry[]): Promise<Uint8Array> {
  const data = buildExportData(settings, entries)
  const metas = entries.flatMap((entry) => entry.attachments ?? [])
  const files = await Promise.all(
    metas.map(async (meta) => ({ meta, blob: (await loadFile(meta.id)) ?? null })),
  )
  return buildZipFile(
    data,
    files.filter((f): f is { meta: FileMeta; blob: Blob } => f.blob !== null),
  )
}

export function downloadBlob(bytes: BlobPart, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([bytes], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function validateExportData(json: unknown): ExportData | null {
  if (typeof json !== 'object' || json === null) return null
  const data = json as Record<string, unknown>
  if (data.app !== APP_ID || data.version !== EXPORT_VERSION) return null
  if (typeof data.settings !== 'object' || data.settings === null) return null
  if (!Array.isArray(data.entries)) return null
  return data as unknown as ExportData
}

export interface ParsedBackup {
  data: ExportData
  files: { meta: FileMeta; bytes: Uint8Array }[]
}

export function parseBackup(bytes: Uint8Array): ParsedBackup {
  const unzipped = unzipSync(bytes)
  const raw = unzipped['backup.json']
  if (!raw) throw new Error('backup.json missing')
  const data = validateExportData(JSON.parse(strFromU8(raw)))
  if (!data) throw new Error('invalid backup payload')

  const metaById = new Map(
    data.entries.flatMap((entry) => entry.attachments ?? []).map((meta) => [meta.id, meta]),
  )
  const files: ParsedBackup['files'] = []
  for (const [path, content] of Object.entries(unzipped)) {
    if (path === 'backup.json') continue
    const meta = metaById.get(path.split('/')[1] ?? '')
    if (meta) files.push({ meta, bytes: content })
  }
  return { data, files }
}
