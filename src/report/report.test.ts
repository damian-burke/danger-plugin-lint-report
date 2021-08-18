import { reportViolationsForLines } from "./report"

declare const global: any

describe("reportViolationsForLines()", () => {
  it("Reporting violation that is not in line diff", () => {
    const violations: Violation[] = [{ file: "/file/2", line: 2, column: 1, severity: "info", message: "Test" }]
    const fileDiffs: FileDiff[] = [{ file: "/file/1", added_lines: [1, 2, 3] }]
    const messageCallback = jest.fn()

    reportViolationsForLines(violations, fileDiffs, true, messageCallback)

    expect(messageCallback).toHaveBeenCalledTimes(0)
  })

  it("Reporting violation that is in file and line diff", () => {
    const violations: Violation[] = [{ file: "/file/1", line: 2, column: 1, severity: "info", message: "Test" }]
    const fileDiffs: FileDiff[] = [
      { file: "/file/1", added_lines: [1, 2, 3] },
      { file: "/file/2", added_lines: [1, 2, 3] },
      { file: "/file/3", added_lines: [1, 2, 3] },
    ]
    const messageCallback = jest.fn()

    reportViolationsForLines(violations, fileDiffs, true, messageCallback)

    expect(messageCallback).toHaveBeenCalledTimes(1)
  })

  it("Not reporting violation that is in file but not line diff", () => {
    const violations: Violation[] = [{ file: "/file/1", line: 4, column: 1, severity: "info", message: "Test" }]
    const fileDiffs: FileDiff[] = [
      { file: "/file/1", added_lines: [1, 2, 3] },
      { file: "/file/2", added_lines: [1, 2, 3] },
      { file: "/file/3", added_lines: [1, 2, 3] },
    ]
    const messageCallback = jest.fn()

    reportViolationsForLines(violations, fileDiffs, true, messageCallback)

    expect(messageCallback).toHaveBeenCalledTimes(0)
  })

  it("Not reporting violation that is not in file but in line diff", () => {
    const violations: Violation[] = [{ file: "/file/4", line: 1, column: 1, severity: "info", message: "Test" }]
    const fileDiffs: FileDiff[] = [
      { file: "/file/1", added_lines: [1, 2, 3] },
      { file: "/file/2", added_lines: [1, 2, 3] },
      { file: "/file/3", added_lines: [1, 2, 3] },
    ]
    const messageCallback = jest.fn()

    reportViolationsForLines(violations, fileDiffs, true, messageCallback)

    expect(messageCallback).toHaveBeenCalledTimes(0)
  })

  it("Reporting violation that is in file but not in line diff with require modification set to false", () => {
    const violations: Violation[] = [{ file: "/file/3", line: 7, column: 1, severity: "info", message: "Test" }]
    const fileDiffs: FileDiff[] = [
      { file: "/file/1", added_lines: [1, 2, 3] },
      { file: "/file/2", added_lines: [1, 2, 3] },
      { file: "/file/3", added_lines: [1, 2, 3] },
    ]
    const messageCallback = jest.fn()

    reportViolationsForLines(violations, fileDiffs, false, messageCallback)

    expect(messageCallback).toHaveBeenCalledTimes(1)
  })
})
