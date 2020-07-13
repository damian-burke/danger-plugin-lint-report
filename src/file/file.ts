import { GitDSL } from "danger"

/**
 * If a git object is supplied, this function checks if a given relative file path
 * is within the changeset (modified + created files).
 * @param git Git object
 * @param relativeFilePath Sanitized file path to match with the changeset
 */
export function isFileInChangeset(git: GitDSL | undefined, relativeFilePath: string): boolean {
  if (git) {
    const isModified = git.modified_files.includes(relativeFilePath)
    const isAdded = git.created_files.includes(relativeFilePath)

    if (isModified || isAdded) {
      // get changed lines
      return true
    }
  } else {
    return true
  }
  return false
}

export function getChangedLinesByFile(git: GitDSL, relativeFilePath: string): Promise<number[]> {
  return git.structuredDiffForFile(relativeFilePath).then(diff => {
    const lines: number[] = []

    if (diff) {
      diff.chunks.forEach(chunk => {
        chunk.changes.forEach(change => {
          if (change.type === "add") {
            // is addition
            lines.push(change.ln)
          }
        })
      })
    }

    return lines
  })
}
