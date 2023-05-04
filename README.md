# danger-plugin-lint-report

[![Build Status](https://github.com/damian-burke/danger-plugin-lint-report/actions/workflows/test.yml/badge.svg)](https://github.com/damian-burke/danger-plugin-lint-report/actions/workflows/test.yml)
[![npm version](https://badge.fury.io/js/danger-plugin-lint-report.svg)](https://badge.fury.io/js/danger-plugin-lint-report)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

> This plugin reads checkstyle / lint reports and posts issues and violations as inline comments in pull requests.

Screenshot of an issue posted as inline comment in a GitHub pull request:

![inline comment](/screenshots/screenshot-inline-comment.png?raw=true "Inline Comment")


## Requirements

The plugin does not execute any linter. 

Instead, the plugin will search the file tree for lint reports according to the specified file mask and parse them.

The plugin requires a configuration object with a file mask to search for XML reports.

### Supported Reports

If you encounter a format that is missing, feel free to add a pull request or open an issue with a sample report attached.

- Checkstyle 4.3
- Checkstyle 8.0
- Android Lint (Format 5)

## Usage

Install:

```sh
yarn add danger-plugin-lint-report --dev
```

At a glance:

```js
// dangerfile.js
import { schedule } from 'danger'

const reporter = require("danger-plugin-lint-report")
schedule(reporter.scan({
    fileMask: "**/reports/lint-results.xml",
    reportSeverity: true,
    requireLineModification: true,
}))
```

Configuration:
```js
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
   * Optional: If set to true, it will remove duplicate violations.
   */
  removeDuplicates?: boolean
}
```
## Changelog

See the GitHub [release history](https://github.com/damian-burke/danger-plugin-lint-report/releases).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
