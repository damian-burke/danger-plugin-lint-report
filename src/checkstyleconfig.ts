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

  /**
   * Optional: Sets a prefix foreach violation message.
   * This can be useful if there are multiple reports being parsed to make them distinguishable.
   */
  outputPrefix?: string

  /**
   * Optional: Override the violation formatter to customize the output message.
   */
  violationFormatter?: ViolationFormatter

  /**
   * Optional: Sets the root directory of the project. Defaults to the current working directory.
   */
  projectRoot?: string

  /**
   * Optional: If set to true, it will remove duplicate violations.
   */
  removeDuplicates?: boolean
}
