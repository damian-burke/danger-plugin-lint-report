type MarkdownString = string

export function reportViolationsForLines(
  violations: Violation[],
  fileDiffs: FileDiff[],
  requireLineModification: boolean,
  violationCallback: (violation: Violation) => void,
) {
  // we got all changed lines in fileDiffs (file => list of line)
  violations.forEach(violation => {
    const file = violation.file
    const line = violation.line

    const diff = fileDiffs.find(element => element.file === file)

    if (diff) {
      if (!requireLineModification || diff.added_lines.includes(line)) {
        violationCallback(violation)
      }
    }
  })
}
