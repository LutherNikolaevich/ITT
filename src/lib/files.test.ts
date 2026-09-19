import { describe, expect, it } from 'vitest'
import { formatBytes, isImageMeta, isPdfMeta, MAX_FILE_BYTES, validateAttachment } from './files'

const file = (name: string, type: string, size = 100): File => {
  const f = new File(['x'], name, { type })
  Object.defineProperty(f, 'size', { value: size })
  return f
}

describe('validateAttachment', () => {
  it('accepts any image MIME type', () => {
    expect(validateAttachment(file('photo.jpg', 'image/jpeg'))).toBeNull()
    expect(validateAttachment(file('photo.png', 'image/png'))).toBeNull()
    expect(validateAttachment(file('scan.tiff', 'image/tiff'))).toBeNull()
  })

  it('accepts PDFs', () => {
    expect(validateAttachment(file('doc.pdf', 'application/pdf'))).toBeNull()
  })

  it('accepts files with no MIME type but a known extension', () => {
    expect(validateAttachment(file('photo.jpeg', ''))).toBeNull()
    expect(validateAttachment(file('doc.pdf', ''))).toBeNull()
  })

  it('rejects non-image, non-PDF files', () => {
    expect(validateAttachment(file('notes.txt', 'text/plain'))).toBeTruthy()
    expect(validateAttachment(file('clip.mp4', 'video/mp4'))).toBeTruthy()
    expect(validateAttachment(file('evil', 'application/zip'))).toBeTruthy()
  })

  it('rejects files over the size cap', () => {
    const big = file('big.jpg', 'image/jpeg', MAX_FILE_BYTES + 1)
    expect(validateAttachment(big)).toBeTruthy()
    expect(validateAttachment(file('ok.jpg', 'image/jpeg', MAX_FILE_BYTES))).toBeNull()
  })
})

describe('isImageMeta / isPdfMeta', () => {
  it('classifies by MIME type with extension fallback', () => {
    expect(isImageMeta({ id: 'a', name: 'p.jpg', type: 'image/jpeg', size: 1 })).toBe(true)
    expect(isImageMeta({ id: 'b', name: 'p.jpg', type: '', size: 1 })).toBe(true)
    expect(isImageMeta({ id: 'c', name: 'd.pdf', type: 'application/pdf', size: 1 })).toBe(false)
    expect(isPdfMeta({ id: 'd', name: 'd.pdf', type: '', size: 1 })).toBe(true)
  })
})

describe('formatBytes', () => {
  it('formats bytes, KB, and MB', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2 KB')
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB')
  })
})
