import type { BackupFile } from './studyData'

export interface BackupDownloadEnvironment {
  document: Document
  url: Pick<typeof URL, 'createObjectURL' | 'revokeObjectURL'>
  schedule: typeof window.setTimeout
}

export function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string,
  environment: BackupDownloadEnvironment = {
    document,
    url: URL,
    schedule: (callback, delay) => window.setTimeout(callback, delay),
  },
): string {
  const anchor = environment.document.createElement('a')
  const objectUrl = environment.url.createObjectURL(new Blob([content], { type: mimeType }))
  anchor.href = objectUrl
  anchor.download = filename

  try {
    environment.document.body.appendChild(anchor)
    anchor.click()
  } catch (error) {
    anchor.remove()
    environment.url.revokeObjectURL(objectUrl)
    throw error
  }

  anchor.remove()
  environment.schedule(() => environment.url.revokeObjectURL(objectUrl), 1000)
  return filename
}

export function downloadBackupFile(
  backup: BackupFile,
  environment: BackupDownloadEnvironment = {
    document,
    url: URL,
    schedule: (callback, delay) => window.setTimeout(callback, delay),
  },
): string {
  const filename = `dashboard-estudos-backup-${backup.exportedAt.replace(/[:.]/g, '-')}.json`
  return downloadTextFile(JSON.stringify(backup, null, 2), filename, 'application/json', environment)
}
