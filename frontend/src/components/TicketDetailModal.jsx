import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { 
  X, MapPin, User, HardHat, Clock, AlertCircle, 
  History, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, FileText
} from 'lucide-react';

export default function TicketDetailModal({ ticketId, onClose, currentUser, onAssign, onUpdateStatus, onAdminAction }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTicket() {
      try {
        setLoading(true);
        const res = await api.getTicketById(ticketId);
        if (res.data) {
          setTicket(res.data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId]);

  if (!ticketId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: 760 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '1rem',
              color: 'var(--primary-light)',
              background: 'rgba(99, 102, 241, 0.15)',
              padding: '4px 10px',
              borderRadius: 8,
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}>
              TICKET #{ticketId}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Relational View & Audit History
            </span>
          </div>

          <button
            id="close-ticket-detail-btn"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              Loading ticket relational records...
            </div>
          ) : error ? (
            <div style={{ color: '#f43f5e', padding: '20px', textAlign: 'center' }}>
              Failed to load ticket: {error}
            </div>
          ) : ticket ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Title & Status Bar */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{
                    color: 'var(--cyan)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {ticket.category_name} • PRIORITY: {ticket.priority}
                  </span>
                  <span className={`badge badge-${ticket.current_status.toLowerCase()}`}>
                    {ticket.current_status.replace('_', ' ')}
                  </span>
                </div>

                <h2 style={{ fontSize: '1.28rem', color: '#fff', marginBottom: 10 }}>
                  {ticket.title}
                </h2>

                <p style={{
                  color: '#cbd5e1',
                  background: 'rgba(0,0,0,0.25)',
                  padding: '14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6
                }}>
                  {ticket.description}
                </p>
              </div>

              {/* Two-Column Entity Breakdown (Student & Location) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 14
              }}>
                {/* Student Master Info */}
                <div style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  <div style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--primary-light)',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <User size={14} />
                    <span>Student Entity Record</span>
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>
                    {ticket.student_name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Registration No: <strong style={{ color: '#e2e8f0' }}>{ticket.registration_no}</strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Email: {ticket.student_email}
                  </div>
                  {ticket.student_phone && (
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Phone: {ticket.student_phone}
                    </div>
                  )}
                </div>

                {/* Location Master Info */}
                <div style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  <div style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--cyan)',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <MapPin size={14} />
                    <span>Location Entity Record</span>
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>
                    {ticket.building}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Floor: <strong style={{ color: '#e2e8f0' }}>{ticket.floor_no}</strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Room / Area: <strong style={{ color: '#e2e8f0' }}>{ticket.room_or_area}</strong>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 4 }}>
                    Created: {new Date(ticket.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Assignment History (Associative Entity) */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: 16
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12
                }}>
                  <div style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <HardHat size={16} />
                    <span>ASSIGNMENTS Table (Reassignment Retention)</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {ticket.assignments?.length || 0} Assignment Records
                  </span>
                </div>

                {(!ticket.assignments || ticket.assignments.length === 0) ? (
                  <div style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '0.82rem',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 8
                  }}>
                    No technician assigned yet. Waiting for administrator review.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {ticket.assignments.map((asg) => (
                      <div
                        key={asg.assignment_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: 8,
                          background: asg.assignment_status === 'ACTIVE' 
                            ? 'rgba(99, 102, 241, 0.1)' 
                            : 'rgba(255, 255, 255, 0.02)',
                          border: asg.assignment_status === 'ACTIVE'
                            ? '1px solid rgba(99, 102, 241, 0.3)'
                            : '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.86rem', color: '#fff' }}>
                              {asg.technician_name}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              ({asg.specialization})
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                            Assigned by Admin: {asg.assigned_by_admin_name} • {new Date(asg.assigned_at).toLocaleString()}
                          </div>
                        </div>

                        <div>
                          <span className={`badge ${
                            asg.assignment_status === 'ACTIVE' ? 'badge-assigned' :
                            asg.assignment_status === 'COMPLETED' ? 'badge-resolved' : 'priority-low'
                          }`} style={{ fontSize: '0.68rem' }}>
                            {asg.assignment_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Transition Audit Trail (STATUS_HISTORY) */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: 16
              }}>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--cyan)',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <History size={16} />
                  <span>STATUS_HISTORY Audit Trail (Non-destructive Log)</span>
                </div>

                <div className="timeline">
                  {ticket.history?.map((hist, idx) => (
                    <div key={hist.history_id || idx} className="timeline-item">
                      <div className="timeline-dot">
                        <div className="timeline-dot-inner"></div>
                      </div>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid rgba(255, 255, 255, 0.04)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                          flexWrap: 'wrap',
                          gap: 6
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {hist.old_status && (
                              <>
                                <span className={`badge badge-${hist.old_status.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                                  {hist.old_status}
                                </span>
                                <ArrowRight size={12} color="#64748b" />
                              </>
                            )}
                            <span className={`badge badge-${hist.new_status.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                              {hist.new_status}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {new Date(hist.changed_at).toLocaleString()}
                          </div>
                        </div>

                        <div style={{ fontSize: '0.84rem', color: '#e2e8f0', marginBottom: 4 }}>
                          {hist.remarks}
                        </div>

                        <div style={{ fontSize: '0.72rem', color: '#818cf8' }}>
                          Action recorded by: <strong>{hist.changed_by_name}</strong> ({hist.changed_by_role})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer with Role Actions */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>

          {/* Admin Assignment Button */}
          {currentUser?.user_type === 'ADMIN' && ticket && (
            <button
              id="modal-assign-btn"
              onClick={() => {
                onClose();
                onAssign(ticket);
              }}
              className="btn btn-primary"
            >
              <HardHat size={16} />
              <span>{ticket.assignments?.length > 0 ? 'Reassign Technician' : 'Assign Technician'}</span>
            </button>
          )}

          {/* Admin Duplicate / Cancellation Action */}
          {currentUser?.user_type === 'ADMIN' && ticket && ticket.current_status !== 'CANCELLED' && (
            <button
              id="modal-admin-status-btn"
              onClick={() => {
                onClose();
                onAdminAction(ticket);
              }}
              className="btn btn-danger"
            >
              <AlertTriangle size={16} />
              <span>Manage / Cancel Ticket</span>
            </button>
          )}

          {/* Technician Status Action */}
          {(currentUser?.user_type === 'TECHNICIAN' || currentUser?.user_type === 'ADMIN') && 
            ticket && ticket.current_status !== 'RESOLVED' && ticket.current_status !== 'CANCELLED' && (
            <button
              id="modal-update-status-btn"
              onClick={() => {
                onClose();
                onUpdateStatus(ticket);
              }}
              className="btn btn-success"
            >
              <CheckCircle2 size={16} />
              <span>Update Progress</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
