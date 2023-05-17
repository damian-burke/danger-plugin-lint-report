// Provides dev-time type structures for  `danger` - doesn't affect runtime.
import { DangerDSLType } from "danger"
import { readFileSync } from "fs"
import { scanReport } from "./parse/checkstyle"

export const maxParallel = 10

declare var danger: DangerDSLType
type MarkdownString = string

export declare function message(message: MarkdownString, file?: string, line?: number): void
export declare function warn(message: string, file?: string, line?: number): void
export declare function fail(message: string, file?: string, line?: number): void
export declare function markdown(message: string, file?: string, line?: number): void

/**
 * This plugin reads checkstyle reports (XML) and posts inline comments in pull requests.
 */
export async function scan(config: CheckstyleConfig) {
  const glob = require("glob")
  const root = config.projectRoot ?? process.cwd()
  const git = danger.git

  let accumulated: { [id: string] : Violation; } = {}

  const files: string[] = await new Promise((resolve, reject) =>
    glob(config.fileMask, (err, result) => (err ? reject(err) : resolve(result))),
  )
  const violationFormatter: ViolationFormatter = config.violationFormatter || defaultViolationFormatter

  for (const batch of Array.from({ length: Math.ceil(files.length / maxParallel) }, (_, batchIdx) =>
    files.slice(batchIdx * maxParallel, (batchIdx + 1) * maxParallel),
  )) {
    await Promise.all(
      batch.map(async (fileName) => {
        const xmlReport = readFileSync(fileName)

        await scanXmlReport(git, xmlReport, root, config.requireLineModification, (violation: Violation) => {
          if (!config.reportSeverity) {
            violation.severity = "info"
          }

          if (config.removeDuplicates) {
            let id = `${ violation.issueId }_${ violation.file }:${ violation.line }.${ violation.column }`
            accumulated[id] = violation
          } else {
            generateMessageAndReport(violation, violationFormatter, config.outputPrefix)
          }
        })
      }),
    )
  }

  for (let id in accumulated) {
    let violation = accumulated[id]
    generateMessageAndReport(violation, violationFormatter, config.outputPrefix)
  }
}

function generateMessageAndReport(violation: Violation, violationFormatter: ViolationFormatter, outputPrefix?: string) {
  let msg = violationFormatter.format(violation)
  if (outputPrefix) {
    msg = outputPrefix + msg
  }
  sendViolationBySeverity(msg, violation.file, violation.line, violation.severity)
}

export async function scanXmlReport(
  git,
  xmlReport,
  root,
  requireLineModification,
  violationCallback: (violation: Violation) => void,
) {
  const xmlConverter = require("xml-js")
  const report = xmlConverter.xml2js(xmlReport)
  await scanReport(git, report, root, requireLineModification, violationCallback)
}

function sendViolationBySeverity(msg: MarkdownString, fileName: string, line: number, severity: string) {
  switch (severity.toLowerCase()) {
    case "information":
    case "info":
      message(msg, fileName, line)
      break
    case "warning":
    case "warn":
      warn(msg, fileName, line)
      break
    case "error":
      fail(msg, fileName, line)
      break
    case "fatal":
      fail(msg, fileName, line)
      break
  }
}

let defaultViolationFormatter: ViolationFormatter = {
  format: (violation: Violation): string => {
    return violation.message
  }
}
