interface Violation {
  file: string
  line: number
  column: number
  /**
   * Possible severity values:
   * - info
   * - warning
   * - error
   * - fatal
   */
  severity: string
  message: string

  // The following attributes are optional, i.e. they may not be present in all scans.
  category?: string
  summary?: string
  explanation?: string
  issueId?: string
}
