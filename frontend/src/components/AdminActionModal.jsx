import React, { useState } from 'react';
import { api } from '../api';
import { X, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';

export default function AdminActionModal({ ticket, onClose, onSuccess }) {
  const [status, setStatus] = useState('CANCELLED');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!remarks.trim()) {
      setError('Please provide a reason / audit justification.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.updateAdminStatus(ticket.ticket_id, {
        status,
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
              background: 'rgba(244, 63, 94, 0.15)',
              padding: 6,
              borderRadius: 8,
              color: '#fb7185'
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', color: '#fff' }}>Administrative Ticket Action</h2>
              <p style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Non-destructive Status Override • Audit History Preserved
              </p>
            </div>
          </div>
          <button
            id="close-admin-action-btn"
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
                marginBottom: 16
              }}>
                {error}
              </div>
            )}

            <div style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: 16
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--cyan)', fontWeight: 700 }}>
                TICKET #{ticket.ticket_id} • {ticket.category_name}
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff', marginTop: 2 }}>
                {ticket.title}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>
                Current Status: <strong>{ticket.current_status}</strong>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Select Administrative Action *</label>
              <select
                id="admin-status-select"
                className="select-control"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="CANCELLED" style={{ background: '#0f172a' }}>
                  Mark as CANCELLED (Duplicate / Invalid complaint)
                </option>
                <option value="RESOLVED" style={{ background: '#0f172a' }}>
                  Mark as RESOLVED (Administrative resolution override)
                </option>
                <option value="OPEN" style={{ background: '#0f172a' }}>
                  Reopen as OPEN (Return to unassigned triage)
                </option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Audit Reason / Justification *</label>
              <textarea
                id="admin-status-remarks-input"
                className="textarea-control"
                placeholder="e.g., Duplicate of ticket #101 already being serviced by Ramesh Sharma."
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
              id="confirm-admin-action-btn"
              type="submit"
              disabled={submitting}
              className="btn btn-danger"
            >
              {submitting ? 'Applying...' : 'Apply Status Change'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
