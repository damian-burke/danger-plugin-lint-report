// Provides dev-time type structures for  `danger` - doesn't affect runtime.
import { DangerDSLType } from "danger"
import { readFileSync } from "fs"
import { scanReport } from "./parse/checkstyle"

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
  const root = process.cwd()
  const git = danger.git

  const files: string[] = await new Promise((resolve, reject) =>
    glob(config.fileMask, (err, result) => (err ? reject(err) : resolve(result)))
  )

  return Promise.all(
    files.map(async fileName => {
      const xmlReport = readFileSync(fileName)

      scanXmlReport(git, xmlReport, root, config.requireLineModification, (msg, file, line, severity) => {
        if (!config.reportSeverity) {
          severity = "info"
        }

        if (config.outputPrefix) {
          msg = config.outputPrefix + msg
        }

        sendViolationBySeverity(msg, file, line, severity)
      })
    })
  )
}

export async function scanXmlReport(
  git,
  xmlReport,
  root,
  requireLineModification,
  messageCallback: (msg, file, line, severity) => void
) {
  const xmlConverter = require("xml-js")
  const report = xmlConverter.xml2js(xmlReport)
  await scanReport(git, report, root, requireLineModification, messageCallback)
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
