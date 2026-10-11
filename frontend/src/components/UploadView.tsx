import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';
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

    // Validate size (100 MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('File exceeds maximum upload limit of 100 MB.');
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
    <div className="animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <img
          src="/logo.png"
          alt="QuizBuzz AI Logo"
          style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            display: 'block',
            borderRadius: '14px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
          }}
        />
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px' }}>
          Upload Document
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Select a document to automatically generate your quiz.
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
            <Loader2 className="animate-spin" size={30} />
          ) : (
            <Upload size={30} />
          )}
        </div>

        <h3 style={{ fontSize: '1.2rem', marginBottom: '6px', fontWeight: 600 }}>
          {loading ? 'Processing document...' : 'Click to upload or drag & drop'}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          PDF, DOCX, TXT, PPTX (up to 100 MB)
        </p>
      </div>

      {error && (
        <div
          id="upload-error-alert"
          style={{
            marginTop: '20px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--error-bg)',
            border: '1px solid #fecaca',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <AlertCircle size={18} color="var(--error)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{error}</span>
        </div>
      )}
    </div>
  );
};
