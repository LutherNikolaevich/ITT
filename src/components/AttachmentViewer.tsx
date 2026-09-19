import { useEffect, useState } from 'react'
import type { TimeEntry } from '../types'
import { formatBytes, isImageMeta, loadFile } from '../lib/files'
import { Chip } from './Chip'
import { Dialog } from './Dialog'
import { Icon } from './Icon'

interface AttachmentViewerProps {
  entry: TimeEntry | null
  onClose: () => void
}

export function AttachmentViewer({ entry, onClose }: AttachmentViewerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  const attachments = entry?.attachments ?? []
  const selected = attachments.find((meta) => meta.id === selectedId) ?? attachments[0] ?? null

  useEffect(() => {
    setSelectedId(entry?.attachments?.[0]?.id ?? null)
  }, [entry])

  useEffect(() => {
    if (!selected) return
    let cancelled = false
    let objectUrl: string | null = null
    setState('loading')
    setUrl(null)
    loadFile(selected.id)
      .then((blob) => {
        if (cancelled) return
        if (!blob) {
          setState('error')
          return
        }
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
        setState('ready')
      })
      .catch(() => {
        if (!cancelled) setState('error')
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [selected?.id])

  if (!entry) return null

  return (
    <Dialog open title="Attachments" onClose={onClose} wide>
      {attachments.length > 1 && (
        <div className="md-viewer__tabs" role="tablist" aria-label="Attached files">
          {attachments.map((meta) => (
            <Chip
              key={meta.id}
              icon={isImageMeta(meta) ? 'image' : 'picture_as_pdf'}
              selected={meta.id === selected?.id}
              onClick={() => setSelectedId(meta.id)}
            >
              {meta.name}
            </Chip>
          ))}
        </div>
      )}
      {selected && (
        <>
          <div className="md-viewer__meta">
            <Icon name={isImageMeta(selected) ? 'image' : 'picture_as_pdf'} filled />
            <span className="md-viewer__name" title={selected.name}>
              {selected.name}
            </span>
            <span className="md-viewer__size">{formatBytes(selected.size)}</span>
            {url && (
              <a className="md-btn md-btn--text" href={url} download={selected.name}>
                Download
              </a>
            )}
          </div>
          {state === 'loading' && <p className="md-viewer__status">Loading…</p>}
          {state === 'error' && (
            <p className="md-viewer__status">Could not load this file. It may have been deleted.</p>
          )}
          {state === 'ready' && url && isImageMeta(selected) && (
            <img className="md-viewer__img" src={url} alt={selected.name} />
          )}
          {state === 'ready' && url && !isImageMeta(selected) && (
            <iframe className="md-viewer__frame" src={url} title={selected.name} />
          )}
        </>
      )}
    </Dialog>
  )
}
