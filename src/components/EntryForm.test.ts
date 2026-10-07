import { describe, expect, it } from 'vitest'
import { createEntryDraft } from './EntryForm'

describe('createEntryDraft', () => {
  it('defaults new entries to a 07:00 start time', () => {
    expect(createEntryDraft(8).timeIn).toBe('07:00')
  })
})
