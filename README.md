# EvernoteENMLToCollateNoteFormat
Test node script to convert Evernote ENML file to Collate Note Format (including attachments)

This is an example script to convert Evernote ENML Files to Collate Note Format.

This script creates the note structure needed by Collate from an Evernote ENML file.  It will parse the ENML file and convert it to an object, then take any attachments in the attachments folder and hash the binary, then it will parse the Evernote content for attachment hashes and copy over any attachments.

Due to the way Evernote's export works, if you want to retain your notebook structure, you'll need to export each notebook separately.  Othewise you can export all your notes at once. Separately, if you want to keep your attachments, Evernote only allows you to export ALL your attachments at once into one big folder.  

It's recommended to sacrifice the notebook format and just export all the notes.
