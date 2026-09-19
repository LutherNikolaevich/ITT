export type EntryStatus = 'draft' | 'submitted'

export type View = 'dashboard' | 'timesheet' | 'settings'

export interface Settings {
  requiredHours: number
  startDate: string
  holidays: string[]
  defaultDailyHours: number | null
}

export interface FileMeta {
  id: string
  name: string
  type: string
  size: number
}

export interface TimeEntry {
  id: string
  date: string
  timeIn: string
  timeOut: string
  breakMinutes: number
  task: string
  notes: string
  status: EntryStatus
  attachments?: FileMeta[]
}

export interface RequirementsDraft {
  requiredHours: string
  startDate: string
  holidays: string[]
  defaultDailyHours: string
}

export interface EntryDraft {
  date: string
  timeIn: string
  timeOut: string
  breakMinutes: string
  task: string
  notes: string
  attachments: FileMeta[]
}
