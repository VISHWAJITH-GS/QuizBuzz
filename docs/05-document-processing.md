# 05 --- Document Processing

## 1. Supported formats

-   PDF
-   DOCX
-   TXT
-   PPTX

Maximum upload size: 10 MB.

## 2. Processing pipeline

1.  Enforce request/body and file-size limits before expensive parsing.
2.  Validate extension, MIME type, and file signature where practical.
3.  Assign a random temporary filename; never use a user-provided
    filename as a filesystem path.
4.  Parse using a format-specific library.
5.  Normalize line endings and whitespace while preserving meaningful
    paragraph and heading boundaries.
6.  Capture page/slide boundaries when the parser supports reliable
    mapping.
7.  Detect headings/chapters using document structure and conservative
    heuristics.
8.  Reject empty or unusable extraction with a clear error.
9.  Return a bounded preview and section metadata.
10. Keep the original file and extracted text temporary and clean them
    up at deletion/expiry.

## 3. Format considerations

### PDF

-   Extract text page by page when possible.
-   If the PDF has no meaningful extractable text and appears
    scanned/image-only, reject it with an explanation that OCR is not
    supported.
-   Do not claim OCR capability.

### DOCX

-   Preserve paragraph order and heading styles where available.
-   Page numbers may not be reliable because DOCX pagination depends on
    rendering; omit source page numbers unless a dependable mapping is
    available.

### TXT

-   Preserve line/paragraph boundaries where useful.
-   Do not invent page numbers.
-   Provide whole-document selection and, if useful, a fallback based on
    detected headings or text ranges.

### PPTX

-   Extract slide text in slide order.
-   Preserve slide boundaries and use slide references if the UI
    supports them. Do not label a slide number as a page number.

## 4. Section detection and selection

-   Prefer explicit heading styles and structural markers.
-   Avoid overconfidently labeling every short line as a heading.
-   Give each detected section a stable ID for the active document
    session.
-   Store start/end offsets and available page/slide references in
    temporary state.
-   If detection fails, allow whole-document selection and a fallback
    such as page range where supported.

## 5. Long documents and context limits

Do not send arbitrarily large extracted text to the model. Establish a
source-text budget based on the selected model's benchmarked context
length. If the selection is too long: - split it into bounded chunks
with source offsets, - generate candidate questions per chunk or
selected section, - merge candidates, - deduplicate, - validate source
support, - limit final count to the requested count or fewer if the
source cannot support it.

Avoid cutting in the middle of a sentence where practical. Preserve the
mapping from every chunk back to the original source.

## 6. Security and robustness

-   Treat every uploaded file as untrusted.
-   Apply request timeouts and memory limits.
-   Catch parser exceptions and return safe error messages.
-   Do not log extracted content or include it in telemetry.
-   Ensure temporary files are removed after failures as well as
    success.
-   Test malformed files, oversized files, empty documents, unusual
    encodings, and documents with no detected headings.
