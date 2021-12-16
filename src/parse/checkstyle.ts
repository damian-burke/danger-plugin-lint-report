import { GitDSL } from "danger"
import { getChangedLinesByFile, isFileInChangeset } from "../file/file"
import { reportViolationsForLines } from "../report/report"
import { parseCheckstyle } from "./checkstyle_parser"

type MarkdownString = string

const fileDiffs: FileDiff[] = []

/**
 *
 * @param git Git object used to access changesets
 * @param report JavaScript object representation of the lint report
 * @param root Root directory to sanitize absolute paths
 */
export async function scanReport(
  git: GitDSL,
  report: any,
  root: string,
  requireLineModification: boolean,
  violationCallback: (violation: Violation) => void,
) {
  const violations = parseCheckstyle(report, root)
  const files: string[] = []

  violations.forEach(violation => {
    const file = violation.file
    if (!files.includes(file)) {
      if (isFileInChangeset(git, file)) {
        files.push(file)
      }
    }
  })

  // parse each file, wait for all to finish
  for (const file of files) {
    let lineDiff: number[] = []
    if (requireLineModification) {
      lineDiff = await getChangedLinesByFile(git, file)
    }

    fileDiffs.push({
      file,
      added_lines: lineDiff,
    })
  }

  reportViolationsForLines(violations, fileDiffs, requireLineModification, violationCallback)
}
