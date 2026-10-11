import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import officeParser from 'officeparser';
import pdfParse from 'pdf-parse';
import { AppError } from '../middleware/error.middleware.js';
import type { DocumentMetadata, DocumentSection } from '@quizbuzz/shared';

export interface ExtractedDocumentResult {
  metadata: DocumentMetadata;
  fullText: string;
}

export class DocumentService {
  async processFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<ExtractedDocumentResult> {
    const ext = path.extname(originalName).toLowerCase();
    const sanitizedName = path.basename(originalName);

    if (!['.pdf', '.docx', '.txt', '.pptx'].includes(ext)) {
      throw new AppError(
        400,
        'UNSUPPORTED_FILE_TYPE',
        `Unsupported format (${ext}). QuizBuzz AI supports PDF, DOCX, TXT, and PPTX files.`
      );
    }

    let fullText = '';
    let sections: DocumentSection[] = [];
    let detectedPages: number | undefined;

    try {
      if (ext === '.pdf') {
        const parsed = await this.parsePdf(fileBuffer);
        fullText = parsed.text;
        detectedPages = parsed.pages;
        sections = parsed.sections;
      } else if (ext === '.docx') {
        const parsed = await this.parseDocx(fileBuffer);
        fullText = parsed.text;
        sections = parsed.sections;
      } else if (ext === '.txt') {
        const parsed = this.parseTxt(fileBuffer);
        fullText = parsed.text;
        sections = parsed.sections;
      } else if (ext === '.pptx') {
        const parsed = await this.parsePptx(fileBuffer);
        fullText = parsed.text;
        sections = parsed.sections;
      }
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      console.warn('[DocParser] Parse exception for', ext, err.message);
      throw new AppError(
        400,
        'INVALID_FILE',
        `Failed to parse document: ${err.message || 'Corrupted or malformed file.'}`
      );
    }

    fullText = fullText.trim();

    if (!fullText || fullText.length < 50) {
      throw new AppError(
        400,
        'NO_EXTRACTABLE_TEXT',
        ext === '.pdf'
          ? 'No readable text could be extracted from this PDF. It appears to be scanned or image-only. QuizBuzz AI does not support OCR.'
          : 'The uploaded document contains no readable text.'
      );
    }

    // If section detection found no distinct sections, provide the whole document section
    if (sections.length === 0) {
      sections.push({
        id: 'section-full',
        title: 'Full Document',
        startOffset: 0,
        endOffset: fullText.length,
        ...(detectedPages ? { startPage: 1, endPage: detectedPages } : {})
      });
    }

    // Bounded preview (max 2000 chars)
    const preview = fullText.slice(0, 2000) + (fullText.length > 2000 ? '...' : '');

    return {
      metadata: {
        name: sanitizedName,
        characterCount: fullText.length,
        sections,
        preview
      },
      fullText
    };
  }

  private async parsePdf(buffer: Buffer): Promise<{ text: string; pages: number; sections: DocumentSection[] }> {
    const data = await pdfParse(buffer);
    const pages = data.numpages || 1;
    const rawText = data.text || '';

    // Conservative heading/section detector
    const sections: DocumentSection[] = [];
    const lines = rawText.split('\n');
    let currentOffset = 0;
    let sectionIdx = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineLen = lines[i].length + 1; // + newline

      // Heuristic: Short non-empty line with heading indicator or all-caps
      const isHeader =
        line.length > 3 &&
        line.length < 80 &&
        (/^(Chapter|Section|Unit|Module|Part|\d+\.)/i.test(line) ||
          (line === line.toUpperCase() && /[A-Z]/.test(line)));

      if (isHeader) {
        // Estimate page number roughly if available
        const estimatedPage = Math.min(pages, Math.max(1, Math.floor((currentOffset / (rawText.length || 1)) * pages) + 1));
        sections.push({
          id: `section-${sectionIdx++}`,
          title: line,
          startOffset: currentOffset,
          startPage: estimatedPage
        });
      }
      currentOffset += lineLen;
    }

    // Calculate endOffsets and endPages
    for (let j = 0; j < sections.length; j++) {
      sections[j].endOffset = j + 1 < sections.length ? sections[j + 1].startOffset : rawText.length;
      sections[j].endPage = j + 1 < sections.length ? sections[j + 1].startPage : pages;
    }

    return { text: rawText, pages, sections };
  }

  private async parseDocx(buffer: Buffer): Promise<{ text: string; sections: DocumentSection[] }> {
    const rawResult = await mammoth.extractRawText({ buffer });
    const fullText = rawResult.value || '';

    const sections: DocumentSection[] = [];
    const lines = fullText.split('\n');
    let currentOffset = 0;
    let sectionIdx = 1;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      const lineLen = rawLine.length + 1;

      if (
        line.length > 3 &&
        line.length < 80 &&
        (/^(Chapter|Section|Unit|Module|\d+\.)/i.test(line) ||
          (line === line.toUpperCase() && /[A-Z]/.test(line)))
      ) {
        sections.push({
          id: `section-${sectionIdx++}`,
          title: line,
          startOffset: currentOffset
        });
      }
      currentOffset += lineLen;
    }

    for (let j = 0; j < sections.length; j++) {
      sections[j].endOffset = j + 1 < sections.length ? sections[j + 1].startOffset : fullText.length;
    }

    return { text: fullText, sections };
  }

  private parseTxt(buffer: Buffer): { text: string; sections: DocumentSection[] } {
    const fullText = buffer.toString('utf-8');
    const sections: DocumentSection[] = [];
    const lines = fullText.split(/\r?\n/);
    let currentOffset = 0;
    let sectionIdx = 1;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      const lineLen = rawLine.length + 1;

      if (
        line.length > 3 &&
        line.length < 80 &&
        (/^(Chapter|Section|Unit|\d+\.)/i.test(line) || (line === line.toUpperCase() && /[A-Z]/.test(line)))
      ) {
        sections.push({
          id: `section-${sectionIdx++}`,
          title: line,
          startOffset: currentOffset
        });
      }
      currentOffset += lineLen;
    }

    for (let j = 0; j < sections.length; j++) {
      sections[j].endOffset = j + 1 < sections.length ? sections[j + 1].startOffset : fullText.length;
    }

    return { text: fullText, sections };
  }

  private async parsePptx(buffer: Buffer): Promise<{ text: string; sections: DocumentSection[] }> {
    return new Promise((resolve, reject) => {
      officeParser.parseOffice(buffer, (data: any, err: any) => {
        if (err) return reject(err);

        const fullText = (typeof data === 'string' ? data : JSON.stringify(data)) || '';
        const sections: DocumentSection[] = [];

        // PPTX slide detection if available
        const slideChunks = fullText.split(/(?:Slide\s*\d+|--- Slide \d+ ---)/i);
        if (slideChunks.length > 1) {
          let offset = 0;
          for (let i = 1; i < slideChunks.length; i++) {
            const chunk = slideChunks[i];
            const slideNum = i;
            sections.push({
              id: `slide-${slideNum}`,
              title: `Slide ${slideNum}`,
              startOffset: offset,
              endOffset: offset + chunk.length,
              slideNumber: slideNum
            });
            offset += chunk.length;
          }
        }

        resolve({ text: fullText, sections });
      });
    });
  }
}

export const documentService = new DocumentService();
