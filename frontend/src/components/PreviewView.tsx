import React, { useState } from 'react';
import { FileText, Layers, ArrowRight, RefreshCw } from 'lucide-react';
import type { DocumentMetadata, QuizSourceSelection } from '@quizbuzz/shared';

interface PreviewViewProps {
  document: DocumentMetadata;
  onContinue: (selection: QuizSourceSelection) => void;
  onReset: () => void;
}

export const PreviewView: React.FC<PreviewViewProps> = ({
  document,
  onContinue,
  onReset
}) => {
  const [selectedType, setSelectedType] = useState<'document' | 'section'>('document');
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    document.sections[0]?.id || ''
  );

  const handleContinue = () => {
    if (selectedType === 'document') {
      onContinue({ type: 'document' });
    } else {
      onContinue({ type: 'section', sectionId: selectedSectionId });
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Document Extracted
          </span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '4px' }}>{document.name}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {document.characterCount.toLocaleString()} characters • {document.sections.length} detected section(s)
          </p>
        </div>
        <button id="btn-change-doc" className="btn-secondary" onClick={onReset} style={{ fontSize: '0.85rem' }}>
          <RefreshCw size={14} /> Change File
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Left: Text Preview */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--text-secondary)' }}>
            <FileText size={16} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Extracted Text Preview</span>
          </div>
          <div
            id="text-preview-box"
            style={{
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              height: '340px',
              overflowY: 'auto',
              fontSize: '0.9rem',
              lineHeight: '1.6',
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {document.preview}
          </div>
        </div>

        {/* Right: Section Selection */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
              <Layers size={16} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Source Scope</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${selectedType === 'document' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  background: selectedType === 'document' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="source-type"
                  checked={selectedType === 'document'}
                  onChange={() => setSelectedType('document')}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Whole Document</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Generate from entire text</div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${selectedType === 'section' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  background: selectedType === 'section' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="source-type"
                  checked={selectedType === 'section'}
                  onChange={() => setSelectedType('section')}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Select Specific Section</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Focus on a chapter/slide</div>
                </div>
              </label>

              {selectedType === 'section' && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                    Choose Section
                  </label>
                  <select
                    id="section-select-dropdown"
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      outline: 'none',
                      fontSize: '0.9rem'
                    }}
                  >
                    {document.sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.title} {sec.startPage ? `(p. ${sec.startPage})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button
              id="btn-proceed-to-config"
              className="btn-primary"
              onClick={handleContinue}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Configure Quiz <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
