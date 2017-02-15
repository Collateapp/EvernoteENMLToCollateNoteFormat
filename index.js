let enexParser = require('enex-parser')
let fs = require('fs-extra')
let path = require('path')
let md5file = require('md5-file')
let matter = require('gray-matter')
let striptags = require('striptags')

class EvernoteToCollate {
  constructor (enexFile, attachmentsFolder, outputFolder) {
    this.enexFile = enexFile
    this.attachmentsFolder = attachmentsFolder
    this.outputFolder = outputFolder
  }

  convert () {
    this.buildAttachmentHashLookup()
    this.parseEnexFile()
    this.generateCollateCollection()
  }

  buildAttachmentHashLookup () {
    let attachments = fs.readdirSync(this.attachmentsFolder)
    let lookup = {}
    for (let attachment of attachments) {
      let attachmentPath = path.join(this.attachmentsFolder, attachment)
      lookup[md5file.sync(attachmentPath)] = attachmentPath
    }
    this.attachmentsHashLookup = lookup
  }

  parseEnexFile () {
    let enexFileContents = fs.readFileSync(this.enexFile, 'utf8')
    this.enexData = enexParser(enexFileContents)
  }

  generateCollateCollection () {
    // Create initial notebook
    let notebookName = 'evernote-import.notebook'
    let notebookPath = path.join(this.outputFolder,notebookName)
    if (!fs.existsSync(notebookPath)){
      fs.mkdirSync(notebookPath)
    }

    for (let evernote of this.enexData) {
        let noteTitle = evernote.title
        let tags = evernote.tags
        let content = evernote.content
        let attachments = this.getAttachments(evernote.content)

        let noteName = this.titleToFileName(noteTitle, '.note')
        let notePath = path.join(notebookPath, noteName)
        let noteFileName = this.titleToFileName(noteTitle, '.md')
        let noteFilePath = path.join(notePath, noteFileName)
        let attachmentPath = path.join(notePath, 'attachments')

        // Create the note directory
        if (!fs.existsSync(notePath)) {
          fs.mkdirSync(notePath)
        }

        // Create the note file.
        fs.writeFileSync(noteFilePath, matter.stringify(this.stripEvernoteMarkup(content), {
          title: noteTitle,
          tags: tags
        }))

        // Create the attachments dir if necessary
        if (attachments.length > 0) {
          try {
            fs.mkdirSync(attachmentPath)
          } catch (e) {
            console.log('error making attachment directory', e)
          }

          // Copy attachments over
          for (let attachment of attachments) {
            if (typeof attachment !== 'undefined' && attachment) {
              let target = path.join(attachmentPath, path.basename(attachment))
              fs.copySync(attachment, target, {overwrite: true})
            }
          }
        }

    }
  }

  // Given an evernote content string, lookup any media hashes and return an
  // array of attachments
  getAttachments (content) {
    let attachments = []
    let re = /hash="(.*?)"/g
    let match
    while (match = re.exec(content)) {
      // console.log(match[0], match[1])
      // match = match.replace('hash=', '').replace('"', '')
      match = match[1]
      let file = this.attachmentsHashLookup[match]
      if (typeof file !== undefined) {
        attachments.push(file)
      }
    }
    return attachments
  }

  // Strip evernote markup from notes
  stripEvernoteMarkup (content) {
    let whiteList = [
    ]
    content = striptags(content, whiteList)

    return content
  }

  /**
   * Takes a title, cleans out any invalid characters and return snake case with
   * suffix.
   */
  titleToFileName (text, suffix = '') {
    return text
      .replace(/[^a-zA-Z0-9- ]/g, '') // Restrict character set
      .replace(/\s\s+/g, ' ') // Remove any double spaces
      .trim() // Chop off any whitespace off the ends.
      .split(' ').join('-') + suffix // Make snake case & add suffix.
  }

}

function test () {
  const testEnexFile = path.resolve('./test.enex')
  const testOutputFolder = path.resolve('./target/')
  const testAttachmentsFolder = path.resolve('./attachments')

  new EvernoteToCollate(testEnexFile, testAttachmentsFolder, testOutputFolder).convert()
}

test()
