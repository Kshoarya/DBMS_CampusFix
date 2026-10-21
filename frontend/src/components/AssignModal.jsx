import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { X, HardHat, AlertCircle, UserCheck } from 'lucide-react';

export default function AssignModal({ ticket, onClose, onSuccess }) {
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTechs() {
      try {
        const res = await api.getTechnicians();
        if (res.data) {
          setTechnicians(res.data);
          if (res.data.length > 0) {
            setSelectedTechId(res.data[0].technician_id);
          }
        }
      } catch (err) {
        setError('Failed to load technicians: ' + err.message);
      }
    }
    fetchTechs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTechId) {
      setError('Please select a technician.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.assignTicket(ticket.ticket_id, {
        technician_id: Number(selectedTechId),
        remarks: remarks.trim() || undefined
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
              background: 'rgba(99, 102, 241, 0.15)',
              padding: 6,
              borderRadius: 8,
              color: 'var(--primary-light)'
            }}>
              <HardHat size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', color: '#fff' }}>
                {ticket.technician_name ? 'Reassign Technician' : 'Assign Technician'}
              </h2>
              <p style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Ticket #{ticket.ticket_id} • Inserts into ASSIGNMENTS & STATUS_HISTORY
              </p>
            </div>
          </div>
          <button
            id="close-assign-modal-btn"
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

            {/* Ticket Summary Card */}
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
                {ticket.building} • {ticket.floor_no}, {ticket.room_or_area}
              </div>
              {ticket.technician_name && (
                <div style={{ fontSize: '0.78rem', color: '#fbbf24', marginTop: 4 }}>
                  Currently Assigned: <strong>{ticket.technician_name}</strong>
                </div>
              )}
            </div>

            {/* Select Technician */}
            <div className="input-group">
              <label className="input-label">Select Qualified Technician *</label>
              <select
                id="assign-tech-select"
                className="select-control"
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
              >
                {technicians.map((t) => (
                  <option key={t.technician_id} value={t.technician_id} style={{ background: '#0f172a' }}>
                    {t.name} — {t.specialization} ({t.active_assignments_count} active tickets)
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Assignment Note / Reason */}
            <div className="input-group">
              <label className="input-label">Assignment Remarks / Instructions (Recorded in Audit Trail)</label>
              <textarea
                id="assign-remarks-input"
                className="textarea-control"
                placeholder="e.g., Priority service needed before 3 PM. Tools required: Multimeter."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                style={{ minHeight: 80 }}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              id="confirm-assign-btn"
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              <UserCheck size={16} />
              <span>{submitting ? 'Assigning...' : 'Confirm Assignment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
