import {danger, fail, message, warn} from 'danger'

const reporter = require("danger-plugin-lint-report")

// Scan ktlint reports
schedule(reporter.scan({
    fileMask: "tslint-report.xml",
    reportSeverity: true,
    requireLineModification: true,
}))