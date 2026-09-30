import React from 'react';
import {
  PaperclipIcon,
  XIcon,
  FileTextIcon,
} from './Icons.jsx';

export default function MediaModal({ attachment, onClose }) {
  if (!attachment) return null;

  return (
    <div className="media-modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="media-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="media-modal-header">
          <div className="media-modal-title">
            <PaperclipIcon size={16} color="var(--primary)" />
            <span>{attachment.name || 'Attachment Preview'}</span>
            <span className="media-type-tag">{attachment.fileType}</span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close attachment preview"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="media-modal-body">
          {attachment.fileType === 'image' && (
            <img
              src={attachment.dataUrl}
              alt={attachment.name || 'Attached image'}
              className="media-preview-large"
            />
          )}

          {attachment.fileType === 'video' && (
            <video
              src={attachment.dataUrl}
              controls
              autoPlay
              className="media-preview-video"
            >
              Your browser does not support the video tag.
            </video>
          )}

          {attachment.fileType === 'note' && (
            <div className="note-preview-box">
              <h4 style={{ marginBottom: '0.5rem', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileTextIcon size={16} />
                <span>Attached Memo</span>
              </h4>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{attachment.note || attachment.dataUrl}</p>
            </div>
          )}

          {attachment.fileType === 'document' && (
            <div className="doc-preview-box">
              <div style={{ color: 'var(--text-faint)', marginBottom: '1rem' }}>
                <FileTextIcon size={48} />
              </div>
              <h3>{attachment.name}</h3>
              {attachment.size && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  {(attachment.size / 1024).toFixed(1)} KB
                </p>
              )}
              {attachment.dataUrl && (
                <a
                  href={attachment.dataUrl}
                  download={attachment.name || 'document'}
                  className="btn btn-primary"
                >
                  Download File
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
