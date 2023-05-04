import { maxParallel, scan, scanXmlReport } from "."

const root = "/root"
const expectedAndroidLintViolation1: Violation = {
  issueId: "HardcodedText",
  category: "Internationalization",
  explanation: "Hardcoding text attributes directly in layout files is bad.",
  summary: "Hardcoded text",
  file: "feature/src/main/res/layout/fragment_password_reset.xml",
  line: 13,
  column: 9,
  severity: "Warning",
  message: "Hardcoded string Email Address, should use `@string` resource",
}
const expectedAndroidLintViolation2: Violation = {
  issueId: "HardcodedNumber",
  category: "Maintenance",
  explanation: "Hardcoding numbers directly in layout files is bad.",
  summary: "Hardcoded numbers",
  file: "feature/src/main/res/layout/fragment_password_reset_2.xml",
  line: 14,
  column: 10,
  severity: "Warning",
  message: "Hardcoded number 123.",
}
const xmlReport = `
<?xml version="1.0" encoding="UTF-8"?>
<issues format="5" by="lint 4.2.0-alpha01">

    <issue
        id="${expectedAndroidLintViolation1.issueId}"
        severity="${expectedAndroidLintViolation1.severity}"
        message="${expectedAndroidLintViolation1.message}"
        category="${expectedAndroidLintViolation1.category}"
        priority="5"
        summary="${expectedAndroidLintViolation1.summary}"
        explanation="${expectedAndroidLintViolation1.explanation}"
        errorLine1="        android:hint=&quot;Password&quot;"
        errorLine2="        ~~~~~~~~~~~~~~~~~~~~~~~">
        <location
            file="${root}/${expectedAndroidLintViolation1.file}"
            line="${expectedAndroidLintViolation1.line}"
            column="${expectedAndroidLintViolation1.column}"/>
    </issue>

    <issue
        id="${expectedAndroidLintViolation2.issueId}"
        severity="${expectedAndroidLintViolation2.severity}"
        message="${expectedAndroidLintViolation2.message}"
        category="${expectedAndroidLintViolation2.category}"
        priority="5"
        summary="${expectedAndroidLintViolation2.summary}"
        explanation="${expectedAndroidLintViolation2.explanation}"
        errorLine1="        android:hint=&quot;Email Address&quot;"
        errorLine2="        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~">
        <location
            file="${root}/${expectedAndroidLintViolation2.file}"
            line="${expectedAndroidLintViolation2.line}"
            column="${expectedAndroidLintViolation2.column}"/>
    </issue>

</issues>
`
const eslintXmlReport = `
<?xml version="1.0" encoding="utf-8"?>
<checkstyle version="4.3">
  <file name="${root}/src/components/ComponentNoError.tsx"></file>
  <file name="${root}/src/components/ComponentWithError.tsx">
    <error line="2" column="21" severity="warning" message="&apos;CircularProgress&apos; is defined but never used. (@typescript-eslint/no-unused-vars)" source="eslint.rules.@typescript-eslint/no-unused-vars" />
  </file>
</checkstyle>
`

const mockGlob = jest.fn(() => [] as string[])
const mockFileSync = jest.fn(
  (path: string) => `<?xml version="1.0" encoding="UTF-8"?>
<issues format="5" by="lint 4.2.0-alpha01">

    <issue
        id="${expectedAndroidLintViolation1.issueId}"
        severity="${expectedAndroidLintViolation1.severity}"
        message="${expectedAndroidLintViolation1.message}"
        category="${expectedAndroidLintViolation1.category}"
        priority="5"
        summary="${expectedAndroidLintViolation1.summary}"
        explanation="${expectedAndroidLintViolation1.explanation}"
        errorLine1="        android:hint=&quot;Email Address&quot;"
        errorLine2="        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~">
        <location
            file="${root}/${expectedAndroidLintViolation1.file}"
            line="${expectedAndroidLintViolation1.line}"
            column="${expectedAndroidLintViolation1.column}"/>
    </issue>

</issues>`,
)

const mockFileExistsSync = jest.fn()

jest.mock("glob", () => (_, cb) => cb(null, mockGlob()))
jest.mock("fs", () => ({
  readFileSync: (path: string) => mockFileSync(path),
  existsSync: (path: string) => mockFileExistsSync(path),
}))

declare global {
  namespace NodeJS {
    interface Global {
      danger: any
      warn: any
    }
  }
}

describe("scan()", () => {
  it("scans multiple files and exits after all are finished", async () => {
    const git = {
      modified_files: [expectedAndroidLintViolation1.file],
      created_files: [],
      structuredDiffForFile: async () =>
        new Promise((res) => setTimeout(() => res({ chunks: [{ changes: [{ type: "add", ln: 13 }] }] }), 100)),
    }
    global.danger = { git }
    global.warn = jest.fn()

    mockGlob.mockImplementation(() => [expectedAndroidLintViolation1.file])

    await scan({
      fileMask: "",
      reportSeverity: true,
      requireLineModification: true,
      projectRoot: root,
    })

    expect(global.warn).toHaveBeenCalled()
  })

  it("uses ViolationFormatter to map Violation to string", async () => {
    let formatFn = jest.fn(violation => {
      return violation.message;
    })
    let violationFormatter: ViolationFormatter = {
      format: formatFn,
    }


    const git = {
      modified_files: [expectedAndroidLintViolation1.file],
      created_files: [],
      structuredDiffForFile: async () =>
        new Promise((res) => setTimeout(() => res({ chunks: [{ changes: [{ type: "add", ln: expectedAndroidLintViolation1.line }] }] }), 100)),
    }
    global.danger = { git }
    global.warn = jest.fn()

    mockGlob.mockImplementation(() => [expectedAndroidLintViolation1.file])

    await scan({
      fileMask: "",
      reportSeverity: true,
      requireLineModification: true,
      projectRoot: root,
      violationFormatter: violationFormatter,
    })

    expect(formatFn).toBeCalledWith(expectedAndroidLintViolation1)
    expect(global.warn).toBeCalledWith(formatFn(expectedAndroidLintViolation1), expectedAndroidLintViolation1.file, expectedAndroidLintViolation1.line)
  })


  it(`removes duplicate violations if option is enabled`, async () => {
    const git = {
      modified_files: ["feature/src/main/res/layout/fragment_password_reset.xml"],
      created_files: [],
      structuredDiffForFile: async () => ({ chunks: [{ changes: [{ type: "add", ln: 13 }] }] }),
    }
    let counter = 0
    let highMark = 0
    global.danger = { git }
    global.warn = jest.fn(() => ++counter)

    mockGlob.mockImplementation(() =>
      Array.from({ length: 123 }, () => "feature/src/main/res/layout/fragment_password_reset.xml"),
    )
    mockFileSync.mockReset().mockImplementation((path: string) => {
      return `<?xml version="1.0" encoding="UTF-8"?>
    <issues format="5" by="lint 4.2.0-alpha01">

        <issue
            id="HardcodedText"
            severity="Warning"
            message="Hardcoded string &quot;Email Address&quot;, should use \`@string\` resource"
            category="Internationalization"
            priority="5"
            summary="Hardcoded text"
            explanation="Hardcoding text attributes directly in layout files is bad for several reasons:&#xA;&#xA;* When creating configuration variations (for example for landscape or portrait) you have to repeat the actual text (and keep it up to date when making changes)&#xA;&#xA;* The application cannot be translated to other languages by just adding new translations for existing string resources.&#xA;&#xA;There are quickfixes to automatically extract this hardcoded string into a resource lookup."
            errorLine1="        android:hint=&quot;Email Address&quot;"
            errorLine2="        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~">
            <location
                file="${root}/feature/src/main/res/layout/fragment_password_reset.xml"
                line="13"
                column="9"/>
        </issue>

    </issues>`
    })

    await scan({
      fileMask: "",
      reportSeverity: true,
      requireLineModification: true,
      projectRoot: root,
      removeDuplicates: true,
    })

    expect(counter).toEqual(1)
  })

  it(`scans maximum ${maxParallel} files in parallel to prevent OoM exceptions`, async () => {
    const git = {
      modified_files: ["feature/src/main/res/layout/fragment_password_reset.xml"],
      created_files: [],
      structuredDiffForFile: async () => ({ chunks: [{ changes: [{ type: "add", ln: 13 }] }] }),
    }
    let counter = 0
    let highMark = 0
    global.danger = { git }
    global.warn = jest.fn(() => --counter)

    mockGlob.mockImplementation(() =>
      Array.from({ length: 123 }, () => "feature/src/main/res/layout/fragment_password_reset.xml"),
    )
    mockFileSync.mockReset().mockImplementation((path: string) => {
      ++counter
      if (counter > highMark) {
        highMark = counter
      }
      return `<?xml version="1.0" encoding="UTF-8"?>
    <issues format="5" by="lint 4.2.0-alpha01">

        <issue
            id="HardcodedText"
            severity="Warning"
            message="Hardcoded string &quot;Email Address&quot;, should use \`@string\` resource"
            category="Internationalization"
            priority="5"
            summary="Hardcoded text"
            explanation="Hardcoding text attributes directly in layout files is bad for several reasons:&#xA;&#xA;* When creating configuration variations (for example for landscape or portrait) you have to repeat the actual text (and keep it up to date when making changes)&#xA;&#xA;* The application cannot be translated to other languages by just adding new translations for existing string resources.&#xA;&#xA;There are quickfixes to automatically extract this hardcoded string into a resource lookup."
            errorLine1="        android:hint=&quot;Email Address&quot;"
            errorLine2="        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~">
            <location
                file="${root}/feature/src/main/res/layout/fragment_password_reset.xml"
                line="13"
                column="9"/>
        </issue>

    </issues>`
    })

    await scan({
      fileMask: "",
      reportSeverity: true,
      requireLineModification: true,
      projectRoot: root,
    })

    expect(mockFileSync).toHaveBeenCalledTimes(123)
    expect(highMark).toBeLessThanOrEqual(maxParallel)
  })
})

describe("scanXmlReport()", () => {
  it("works across multiple files with require line modification turned off", async () => {
    const git = {
      modified_files: [
        expectedAndroidLintViolation1.file,
        expectedAndroidLintViolation2.file,
      ],
      created_files: [],
    }

    const violationCallback = jest.fn()

    await scanXmlReport(git, xmlReport, root, false, violationCallback)

    expect(violationCallback).toHaveBeenCalledTimes(2)
  })

  it("returns correct violation data and file path with line modification turned off", async () => {
    const git = {
      modified_files: [expectedAndroidLintViolation1.file],
      created_files: [],
    }

    const violationCallback = jest.fn()

    await scanXmlReport(git, xmlReport, root, false, violationCallback)

    expect(violationCallback).toBeCalledWith(expectedAndroidLintViolation1)
    expect(violationCallback).toBeCalledWith(expectedAndroidLintViolation2)
  })

  it("returns correct file location when root is different", async () => {
    const git = {
      modified_files: [expectedAndroidLintViolation1.file],
      created_files: [],
    }
    mockFileExistsSync.mockImplementation((path) =>
      [
        "/otherRoot/" + expectedAndroidLintViolation1.file,
        expectedAndroidLintViolation1.file.substring(expectedAndroidLintViolation1.file.indexOf("/", 1)),
      ].includes(path),
    )

    const violationCallback = jest.fn()

    await scanXmlReport(git, xmlReport, "/otherRoot", false, violationCallback)

    expect(violationCallback).toBeCalledWith(expectedAndroidLintViolation1)
  })

  it("returns correct violation data for checkstyle report with files without messages", async () => {
    const git = {
      modified_files: ["src/components/ComponentNoError.tsx", "src/components/ComponentWithError.tsx"],
      created_files: [],
    }

    const messageCallback = jest.fn()

    await scanXmlReport(git, eslintXmlReport, root, false, messageCallback)

    const msg = "'CircularProgress' is defined but never used. (@typescript-eslint/no-unused-vars)"
    const file = "src/components/ComponentWithError.tsx"
    const line = 2
    const column = 21
    const severity = "warning"
    const expectedViolation = {
      file: file,
      line: line,
      column: column,
      severity: severity,
      message: msg,
    }
    expect(messageCallback).toBeCalledTimes(1)
    expect(messageCallback).toBeCalledWith(expectedViolation)
  })
})
