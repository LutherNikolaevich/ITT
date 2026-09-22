import type { FileMeta } from '../types'

export const MAX_FILE_BYTES = 10 * 1024 * 1024

const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|bmp|heic|heif|avif|svg)$/i
const PDF_EXT_RE = /\.pdf$/i

export interface StagedFile {
  meta: FileMeta
  file: File
}

export function isImageMeta(meta: FileMeta): boolean {
  return meta.type.startsWith('image/') || IMAGE_EXT_RE.test(meta.name)
}

export function isPdfMeta(meta: FileMeta): boolean {
  return meta.type === 'application/pdf' || PDF_EXT_RE.test(meta.name)
}

export function validateAttachment(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) {
    return `"${file.name}" is too large (max 10 MB).`
  }
  const accepted =
    file.type.startsWith('image/') || file.type === 'application/pdf' || IMAGE_EXT_RE.test(file.name) || PDF_EXT_RE.test(file.name)
  if (!accepted) {
    return `"${file.name}" is not an image or PDF.`
  }
  return null
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const DB_NAME = 'ojt-files'
const STORE = 'files'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('Could not open file storage'))
  })
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = run(tx.objectStore(STORE))
    tx.oncomplete = () => {
      db.close()
      resolve(req.result)
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error ?? new Error('File storage error'))
    }
    tx.onabort = () => {
      db.close()
      reject(tx.error ?? new Error('File storage aborted'))
    }
  })
}

export async function saveFile(id: string, blob: Blob): Promise<void> {
  await withStore('readwrite', (store) => store.put(blob, id) as IDBRequest<IDBValidKey>)
}

export async function loadFile(id: string): Promise<Blob | undefined> {
  return withStore<Blob | undefined>('readonly', (store) => store.get(id))
}

export async function deleteFile(id: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(id) as IDBRequest<undefined>)
}

export async function deleteFiles(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => deleteFile(id).catch(() => undefined)))
}

export async function clearAllFiles(): Promise<void> {
  await withStore('readwrite', (store) => store.clear() as IDBRequest<undefined>)
}
