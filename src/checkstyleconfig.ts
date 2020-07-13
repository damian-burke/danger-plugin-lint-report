interface CheckstyleConfig {
  /**
   * File mask used to find XML checkstyle reports.
   */
  fileMask: string

  /**
   * If set to true, the severity will be used to switch between the different message formats (message, warn, fail).
   */
  reportSeverity: boolean

  /**
   * If set to true, only issues will be reported that are contained in the current changeset (line comparison).
   * If set to false, all issues that are in modified files will be reported.
   */
  requireLineModification: boolean
}
