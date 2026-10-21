import React, { useState } from 'react';
import { api } from '../api';
import { X, CheckCircle2, PlayCircle, AlertCircle, FileText } from 'lucide-react';

export default function StatusUpdateModal({ ticket, onClose, onSuccess }) {
  const [newStatus, setNewStatus] = useState(
    ticket.current_status === 'ASSIGNED' ? 'IN_PROGRESS' : 'RESOLVED'
  );
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!remarks.trim()) {
      setError('Please provide progress / resolution remarks for the audit trail.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.updateTechStatus(ticket.ticket_id, {
        status: newStatus,
        remarks: remarks.trim()
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              padding: 6,
              borderRadius: 8,
              color: '#34d399'
            }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', color: '#fff' }}>Update Ticket Progress</h2>
              <p style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Ticket #{ticket.ticket_id} • Status Transition & Audit Logging
              </p>
            </div>
          </div>
          <button
            id="close-status-modal-btn"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                padding: '10px 14px',
                borderRadius: 8,
                color: '#fb7185',
                fontSize: '0.84rem',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Ticket Info */}
            <div style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: 16
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
                {ticket.category_name}
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff', marginTop: 2 }}>
                {ticket.title}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>
                Current Status: <strong style={{ color: '#fff' }}>{ticket.current_status}</strong>
              </div>
            </div>

            {/* New Status Selection */}
            <div className="input-group">
              <label className="input-label">New Work Status *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setNewStatus('IN_PROGRESS')}
                  style={{
                    padding: '12px',
                    borderRadius: 8,
                    border: newStatus === 'IN_PROGRESS' 
                      ? '2px solid #f59e0b' 
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    background: newStatus === 'IN_PROGRESS' 
                      ? 'rgba(245, 158, 11, 0.15)' 
                      : 'rgba(255, 255, 255, 0.03)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontWeight: 600
                  }}
                >
                  <PlayCircle size={18} color="#fbbf24" />
                  <span>IN PROGRESS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewStatus('RESOLVED')}
                  style={{
                    padding: '12px',
                    borderRadius: 8,
                    border: newStatus === 'RESOLVED' 
                      ? '2px solid #10b981' 
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    background: newStatus === 'RESOLVED' 
                      ? 'rgba(16, 185, 129, 0.15)' 
                      : 'rgba(255, 255, 255, 0.03)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontWeight: 600
                  }}
                >
                  <CheckCircle2 size={18} color="#34d399" />
                  <span>RESOLVED</span>
                </button>
              </div>
            </div>

            {/* Detailed remarks */}
            <div className="input-group">
              <label className="input-label">
                Technician Work Remarks / Resolution Notes *
              </label>
              <textarea
                id="tech-status-remarks-input"
                className="textarea-control"
                placeholder={
                  newStatus === 'RESOLVED' 
                    ? "Explain what was repaired/replaced and verify the outcome..." 
                    : "Describe current inspection steps, parts ordered, or estimated time..."
                }
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                required
                style={{ minHeight: 90 }}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              id="confirm-tech-status-btn"
              type="submit"
              disabled={submitting}
              className={`btn ${newStatus === 'RESOLVED' ? 'btn-success' : 'btn-primary'}`}
            >
              {submitting ? 'Updating...' : `Commit Transition (${newStatus})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
