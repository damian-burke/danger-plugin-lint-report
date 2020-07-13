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
}
