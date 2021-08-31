import { maxParallel, scan, scanXmlReport } from "."

const root = "/root/"
const xmlReport = `
<?xml version="1.0" encoding="UTF-8"?>
<issues format="5" by="lint 4.2.0-alpha01">

    <issue
        id="HardcodedText"
        severity="Warning"
        message="Hardcoded string &quot;Password&quot;, should use \`@string\` resource"
        category="Internationalization"
        priority="5"
        summary="Hardcoded text"
        explanation="Hardcoding text attributes directly in layout files is bad for several reasons:&#xA;&#xA;* When creating configuration variations (for example for landscape or portrait) you have to repeat the actual text (and keep it up to date when making changes)&#xA;&#xA;* The application cannot be translated to other languages by just adding new translations for existing string resources.&#xA;&#xA;There are quickfixes to automatically extract this hardcoded string into a resource lookup."
        errorLine1="        android:hint=&quot;Password&quot;"
        errorLine2="        ~~~~~~~~~~~~~~~~~~~~~~~">
        <location
        file="/root/feature/src/main/res/layout/fragment_password_reset_2.xml"
            line="25"
            column="9"/>
    </issue>

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
            file="/root/feature/src/main/res/layout/fragment_password_reset.xml"
            line="13"
            column="9"/>
    </issue>

</issues>
`

const mockGlob = jest.fn(() => [] as string[])
const mockFileSync = jest.fn(
  (path: string) => `<?xml version="1.0" encoding="UTF-8"?>
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
            file="feature/src/main/res/layout/fragment_password_reset.xml"
            line="13"
            column="9"/>
    </issue>

</issues>`,
)

const mockFiles: string[] = []
const mockFileExistsSync = (path: string) => mockFiles.includes(path)

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
      modified_files: ["feature/src/main/res/layout/fragment_password_reset.xml"],
      created_files: [],
      structuredDiffForFile: async () =>
        new Promise((res) => setTimeout(() => res({ chunks: [{ changes: [{ type: "add", ln: 13 }] }] }), 100)),
    }
    global.danger = { git }
    global.warn = jest.fn()

    mockGlob.mockImplementation(() => ["feature/src/main/res/layout/fragment_password_reset.xml"])

    await scan({
      fileMask: "",
      reportSeverity: true,
      requireLineModification: true,
    })

    expect(global.warn).toHaveBeenCalled()
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
                file="feature/src/main/res/layout/fragment_password_reset.xml"
                line="13"
                column="9"/>
        </issue>

    </issues>`
    })

    await scan({
      fileMask: "",
      reportSeverity: true,
      requireLineModification: true,
    })

    expect(mockFileSync).toHaveBeenCalledTimes(123)
    expect(highMark).toBeLessThanOrEqual(maxParallel)
  })
})

describe("scanXmlReport()", () => {
  it("works across multiple files with require line modification turned off", async () => {
    const git = {
      modified_files: [
        "feature/src/main/res/layout/fragment_password_reset.xml",
        "feature/src/main/res/layout/fragment_password_reset_2.xml",
      ],
      created_files: [],
    }

    const messageCallback = jest.fn()

    await scanXmlReport(git, xmlReport, root, false, messageCallback)

    expect(messageCallback).toHaveBeenCalledTimes(2)
  })

  it("returns correct violation data and file path with line modification turned off", async () => {
    const git = {
      modified_files: ["feature/src/main/res/layout/fragment_password_reset.xml"],
      created_files: [],
    }

    const messageCallback = jest.fn()

    await scanXmlReport(git, xmlReport, root, false, messageCallback)

    const msg = "Hardcoded text"
    const file = "feature/src/main/res/layout/fragment_password_reset.xml"
    const line = 13
    const severity = "Warning"
    expect(messageCallback).toBeCalledWith(msg, file, line, severity)
  })

  it("returns correct file location when root is different", async () => {
    const git = {
      modified_files: ["feature/src/main/res/layout/fragment_password_reset.xml"],
      created_files: [],
    }

    mockFiles.push("/otherRoot/feature/src/main/res/layout/fragment_password_reset_2.xml")

    const messageCallback = jest.fn()

    await scanXmlReport(git, xmlReport, "/otherRoot/", false, messageCallback)

    const msg = "Hardcoded text"
    const file = "feature/src/main/res/layout/fragment_password_reset.xml"
    const line = 13
    const severity = "Warning"
    expect(messageCallback).toBeCalledWith(msg, file, line, severity)
  })
})
