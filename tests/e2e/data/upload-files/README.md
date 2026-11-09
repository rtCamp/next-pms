# Files the upload tests use

Paste the file to upload into the matching folder. The tests take the first file
they find there (README and dotfiles are ignored).

| Folder | Used by | Put here |
|---|---|---|
| `valid/` | TC132 (Growth: upload and list a file) | a file the app should accept |
| `disallowed/` | TC127 (Growth: reject a disallowed type) | a file type the app should reject, e.g. an `.exe` |

`valid/` is required: TC132 is skipped, with a message, while it is empty.
`disallowed/` is optional: without a file, TC127 uploads a generated `.exe`.
