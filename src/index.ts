// Provides dev-time type structures for  `danger` - doesn't affect runtime.
import { DangerDSLType } from "danger"
import { readFileSync } from "fs"
import { scanReport } from "./parse/checkstyle"
import { findFirstViolationFilename } from "./parse/checkstyle_parser"
import path from "path"
import fs from "fs"

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
  const root = process.cwd()
  const git = danger.git

  const files: string[] = await new Promise((resolve, reject) =>
    glob(config.fileMask, (err, result) => (err ? reject(err) : resolve(result))),
  )

  for (const batch of Array.from({ length: Math.ceil(files.length / maxParallel) }, (_, batchIdx) =>
    files.slice(batchIdx * maxParallel, (batchIdx + 1) * maxParallel),
  )) {
    await Promise.all(
      batch.map(async (fileName) => {
        const xmlReport = readFileSync(fileName)

        await scanXmlReport(git, xmlReport, root, config.requireLineModification, (msg, file, line, severity) => {
          if (!config.reportSeverity) {
            severity = "info"
          }

          if (config.outputPrefix) {
            msg = config.outputPrefix + msg
          }

          sendViolationBySeverity(msg, file, line, severity)
        })
      }),
    )
  }
}

export async function scanXmlReport(
  git,
  xmlReport,
  root,
  requireLineModification,
  messageCallback: (msg, file, line, severity) => void,
) {
  const xmlConverter = require("xml-js")
  const report = xmlConverter.xml2js(xmlReport)
  const improvedRoot = calculateRootFolder(report, root)
  await scanReport(git, report, improvedRoot, requireLineModification, messageCallback)
}

function calculateRootFolder(report: any, root: string): string {
  const file = findFirstViolationFilename(report)
  if (!file) {
    return root
  }

  const components = file.split(path.sep)
  for (let i = 1; i < components.length; i++) {
    const suffixComponents = components.slice(-i)
    const candidateFile = path.resolve(root, ...suffixComponents)
    if (fs.existsSync(candidateFile)) {
      const relativePath = suffixComponents.join(path.sep)
      return file.replace(relativePath, "")
    }
  }
  return root
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
