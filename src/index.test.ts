import { scanXmlReport } from "."


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
            modified_files: [
                "feature/src/main/res/layout/fragment_password_reset.xml",
            ],
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
})
