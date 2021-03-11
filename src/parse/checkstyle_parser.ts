import { exception } from "console"

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
          console.warn(`Compatibility with version ${rootVersion} not tested`)
          return parseCheckstyle8_0(report, root)
        }
      }
    case "issues":
      const rootFormat = report.elements[0].attributes.format
      switch (rootFormat) {
        case "5":
          return parseAndroidLint(report, root)
        default:
          throw new Error(`Lint report format ${rootFormat} is not supported.`)
      }
  }

  throw new Error(`Report with base tag ${rootName} is not supported.`)
}

function parseAndroidLint(report: any, root: string): Violation[] {
  const violations: Violation[] = []

  if (!report.elements[0].elements) {
    return []
  }

  report.elements[0].elements.forEach(issueElement => {
    if (issueElement.name != "issue") {
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

      issueElement.elements.forEach(fileElement => {
        if (fileElement.name != "location") {
            console.log(`Illegal element ${fileElement.name}, expected location. Ignoring.`)
        } else {
          const locationAttributes = fileElement.attributes
          const fileName = locationAttributes.file.replace(root, "").replace(/^\/+/, "")
          const line = +locationAttributes.line
          const column = +locationAttributes.column

          violations.push({
            file: fileName,
            line,
            column,
            severity,
            message: summary,
          })
        }
      })
    }
  })

  return violations
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

  report.elements[0].elements.forEach(fileElement => {
    const fileName = fileElement.attributes.name.replace(root, "").replace(/^\/+/, "")

    fileElement.elements.forEach(errorElement => {
      const attributes = errorElement.attributes
      const line = +attributes.line
      const column = +attributes.column
      const severity = attributes.severity
      const msg = attributes.message

      violations.push({
        file: fileName,
        line,
        column,
        severity,
        message: msg,
      })
    })
  })

  return violations
}
