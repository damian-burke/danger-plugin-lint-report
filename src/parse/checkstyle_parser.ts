import fs from "fs"
import path from "path"

export function parseCheckstyle(report: any, root: string): Violation[] {
  if (!report.elements || !report.elements[0]) {
    throw new Error(`Can not parse input.`)
  }

  const rootName = report.elements[0].name

  switch (rootName) {
    case "checkstyle":
      const rootVersion = report.elements[0].attributes.version

      switch (rootVersion) {
        case "8.0":
        case "4.3":
          return parseCheckstyle8_0(report, root)
        default: {
          console.warn(`Compatibility with version ${rootVersion} not tested.`)
          return parseCheckstyle8_0(report, root)
        }
      }
    case "issues":
      const rootFormat = report.elements[0].attributes.format
      switch (rootFormat) {
        case "5":
          return parseAndroidLint(report, root)
        default:
          console.warn(`Compatibility with version ${rootFormat} not tested.`)
          return parseAndroidLint(report, root)
      }
  }

  throw new Error(`Report with base tag ${rootName} is not supported.`)
}

function parseAndroidLint(report: any, root: string): Violation[] {
  const violations: Violation[] = []

  if (!report.elements[0].elements) {
    return []
  }

  report.elements[0].elements.forEach((issueElement) => {
    if (issueElement.name !== "issue") {
      console.log(`Illegal element: ${issueElement.name}, expected issue. Ignoring.`)
    } else {
      const attributes = issueElement.attributes
      const issueId = attributes.id
      const severity = attributes.severity
      const message = attributes.message
      const category = attributes.category
      const priority = +attributes.priority
      const summary = attributes.summary
      const explanation = attributes.explanation
      const errorLine1 = attributes.errorLine1
      const errorLine2 = attributes.errorLine2

      issueElement.elements.forEach((fileElement) => {
        if (fileElement.name !== "location") {
          console.warn(`Illegal element ${fileElement.name}, expected location. Ignoring.`)
        } else {
          const locationAttributes = fileElement.attributes
          const fileName = calculateRelativeFileName(locationAttributes.file, root)
          const line = +locationAttributes.line
          const column = +locationAttributes.column

          violations.push({
            file: fileName,
            line: line,
            column: column,
            severity: severity,
            summary: summary,
            category: category,
            message: message,
            explanation: explanation,
            issueId: issueId,
          })
        }
      })
    }
  })

  return violations
}

/**
 * Calculates the relative filename by checking the existance of `file` in `root`
 * @param file the absolute file present in the lint report
 * @param root current folder
 * @returns relative filename in `root` or filename with `root` removed if the file was not found
 */
function calculateRelativeFileName(file: string, root: string) {
  const components = file.split(path.sep)
  for (let i = 1; i < components.length; i++) {
    const suffixComponents = components.slice(i)
    const candidateFile = path.resolve(root, ...suffixComponents)
    if (fs.existsSync(candidateFile)) {
      return path.relative(root, candidateFile)
    }
  }
  return file.replace(root, "").replace(/^\/+/, "")
}

/**
 *
 * @param report Checktyle report as JavaScript object
 * @param root Project root path
 */
function parseCheckstyle8_0(report: any, root: string): Violation[] {
  const violations: Violation[] = []

  if (!report.elements[0].elements) {
    return []
  }

  report.elements[0].elements?.forEach((fileElement) => {
    const fileName = calculateRelativeFileName(fileElement.attributes.name, root)

    fileElement.elements?.forEach((errorElement) => {
      const attributes = errorElement.attributes
      const line = +attributes.line
      const column = +attributes.column
      const severity = attributes.severity
      const msg = attributes.message

      violations.push({
        file: fileName,
        line: line,
        column: column,
        severity: severity,
        message: msg,
      })
    })
  })

  return violations
}
