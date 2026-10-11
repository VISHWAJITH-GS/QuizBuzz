import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../api/client.js';
import type { DocumentMetadata } from '@quizbuzz/shared';

interface UploadViewProps {
  onDocumentUploaded: (doc: DocumentMetadata) => void;
}

export const UploadView: React.FC<UploadViewProps> = ({ onDocumentUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    // Validate size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File exceeds maximum upload limit of 10 MB.');
      return;
    }

    const validExtensions = ['.pdf', '.docx', '.txt', '.pptx'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setError('Unsupported file type. Please upload a PDF, DOCX, TXT, or PPTX file.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.uploadDocument(file);
      onDocumentUploaded(res.document);
    } catch (err: any) {
      const msg = err?.error?.message || 'Failed to upload and parse document. Please check the file.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '12px' }}>
          Turn your notes into smart quizzes
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Upload your lecture slides, notes, or textbooks. QuizBuzz generates strictly grounded questions with instant feedback.
        </p>
      </div>

      <div
        id="upload-dropzone"
        className={`dropzone ${isDragging ? 'drag-active' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !loading && fileInputRef.current?.click()}
      >
        <input
          type="file"
          id="file-upload-input"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".pdf,.docx,.txt,.pptx"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="dropzone-icon">
          {loading ? (
            <Loader2 className="animate-spin" size={32} />
          ) : (
            <Upload size={32} />
          )}
        </div>

        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 600 }}>
          {loading ? 'Processing document...' : 'Click to upload or drag & drop'}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Supported formats: PDF, DOCX, TXT, PPTX (up to 10 MB)
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={14} color="var(--accent-primary)" /> Text-based PDFs only (no OCR)
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={14} color="var(--accent-primary)" /> Zero permanent storage
          </span>
        </div>
      </div>

      {error && (
        <div
          id="upload-error-alert"
          style={{
            marginTop: '20px',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--error-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <AlertCircle size={20} color="var(--error)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.95rem' }}>{error}</span>
        </div>
      )}
    </div>
  );
};
