import { parseCheckstyle } from "./checkstyle_parser"

describe("parseCheckstyle()", () => {
  it("maps checkstyle 8.0 violations properly", () => {
    const root = "/root/"
    const checkstyle = {
      declaration: { attributes: { version: "1.0", encoding: "utf-8" } },
      elements: [
        {
          type: "element",
          name: "checkstyle",
          attributes: { version: "8.0" },
          elements: [
            {
              type: "element",
              name: "file",
              attributes: {
                name: `${root}app/src/main/java/com/example/app/directory/SomeClass.kt`,
              },
              elements: [
                {
                  type: "element",
                  name: "error",
                  attributes: {
                    line: "1",
                    column: "1",
                    severity: "error",
                    message: "Test error message",
                  },
                },
              ],
            },
          ],
        },
      ],
    }

    const violations = parseCheckstyle(checkstyle, root)

    expect(violations[0].file).toBe("app/src/main/java/com/example/app/directory/SomeClass.kt")
    expect(violations[0].line).toBe(1)
    expect(violations[0].column).toBe(1)
    expect(violations[0].severity).toBe("error")
    expect(violations[0].message).toBe("Test error message")
  })

  it("parses checkstyle 8.0", () => {
    const root = "/root/"
    const checkstyle = {
      declaration: { attributes: { version: "1.0", encoding: "utf-8" } },
      elements: [
        {
          type: "element",
          name: "checkstyle",
          attributes: { version: "8.0" },
          elements: [
            {
              type: "element",
              name: "file",
              attributes: {
                name: `${root}app/src/main/java/com/example/app/directory/SomeClass.kt`,
              },
              elements: [
                {
                  type: "element",
                  name: "error",
                  attributes: {
                    line: "1",
                    column: "1",
                    severity: "error",
                    message: "Test error message",
                  },
                },
                {
                  type: "element",
                  name: "error",
                  attributes: {
                    line: "2",
                    column: "2",
                    severity: "warning",
                    message: "Test second error message",
                  },
                },
              ],
            },
            {
              type: "element",
              name: "file",
              attributes: {
                name: `${root}app/src/main/java/com/example/app/directory/SomeOtherClass.kt`,
              },
              elements: [
                {
                  type: "element",
                  name: "error",
                  attributes: {
                    line: "1",
                    column: "1",
                    severity: "error",
                    message: "Test error message",
                  },
                },
                {
                  type: "element",
                  name: "error",
                  attributes: {
                    line: "2",
                    column: "2",
                    severity: "warning",
                    message: "Test second error message",
                  },
                },
              ],
            },
          ],
        },
      ],
    }

    const violations = parseCheckstyle(checkstyle, root)

    expect(violations).toHaveLength(4)
  })

  it("log warn for untested checkstyle version", () => {
    const root = "/root/"
    const untestedVersion = "7.0"
    const checkstyle = {
      declaration: { attributes: { version: "1.0", encoding: "utf-8" } },
      elements: [
        {
          type: "element",
          name: "checkstyle",
          attributes: { version: untestedVersion },
          elements: [],
        },
      ],
    }
    const spiedConsole = jest.spyOn(global.console, "warn")

    parseCheckstyle(checkstyle, root)

    expect(spiedConsole).toBeCalled()
    const warnLog = spiedConsole.mock.calls[0][0]
    expect(warnLog).toContain(untestedVersion)

    spiedConsole.mockRestore()
  })

  it("parses checkstyle 8.0 without any violations", () => {
    const root = "/root/"
    const checkstyle = {
      declaration: { attributes: { version: "1.0", encoding: "utf-8" } },
      elements: [
        {
          type: "element",
          name: "checkstyle",
          attributes: { version: "8.0" },
          elements: [],
        },
      ],
    }

    expect(parseCheckstyle(checkstyle, root)).toHaveLength(0)
  })

  it("parses checkstyle 8.0 without any violations", () => {
    const root = "/root/"
    const checkstyle = {
      declaration: { attributes: { version: "1.0", encoding: "utf-8" } },
      elements: [
        {
          type: "element",
          name: "checkstyle",
          attributes: { version: "8.0" },
        },
      ],
    }

    expect(parseCheckstyle(checkstyle, root)).toHaveLength(0)
  })
})
