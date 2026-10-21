import React from 'react';
import { 
  MapPin, Clock, User, HardHat, AlertCircle, 
  ArrowRight, CheckCircle2, ShieldAlert, Sparkles 
} from 'lucide-react';

export default function TicketCard({ ticket, currentUser, onViewDetails, onAssign, onUpdateStatus, onAdminAction }) {
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'URGENT': return 'priority-urgent';
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      case 'LOW': default: return 'priority-low';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'OPEN': return 'badge-open';
      case 'ASSIGNED': return 'badge-assigned';
      case 'IN_PROGRESS': return 'badge-in_progress';
      case 'RESOLVED': return 'badge-resolved';
      case 'CANCELLED': default: return 'badge-cancelled';
    }
  };

  const isTechnicianAssigned = currentUser?.user_type === 'TECHNICIAN' && 
    ticket.technician_name && 
    ticket.technician_name.includes(currentUser.name);

  return (
    <div 
      className="glass-card glass-card-hover"
      id={`ticket-card-${ticket.ticket_id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Status & Priority Bar */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          gap: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: 'var(--primary-light)',
              background: 'rgba(99, 102, 241, 0.1)',
              padding: '2px 8px',
              borderRadius: 6,
              border: '1px solid rgba(99, 102, 241, 0.25)'
            }}>
              #{ticket.ticket_id}
            </span>
            <span className={`badge ${getPriorityClass(ticket.priority)}`}>
              {ticket.priority}
            </span>
          </div>

          <span className={`badge ${getStatusClass(ticket.current_status)}`}>
            {ticket.current_status.replace('_', ' ')}
          </span>
        </div>

        {/* Title & Category */}
        <h3 style={{
          fontSize: '1.05rem',
          lineHeight: 1.4,
          marginBottom: 8,
          color: '#ffffff',
          fontWeight: 600
        }}>
          {ticket.title}
        </h3>

        <div style={{
          fontSize: '0.76rem',
          color: 'var(--cyan)',
          fontWeight: 600,
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          {ticket.category_name}
        </div>

        {/* Description snippet */}
        <p style={{
          fontSize: '0.85rem',
          color: '#94a3b8',
          lineHeight: 1.5,
          marginBottom: 16,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {ticket.description}
        </p>

        {/* Location & Details Info */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: '12px',
          background: 'rgba(0, 0, 0, 0.25)',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: '0.8rem',
          border: '1px solid rgba(255, 255, 255, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1' }}>
            <MapPin size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
            <span>
              <strong>{ticket.building}</strong> • {ticket.floor_no}, {ticket.room_or_area}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
            <User size={14} color="#818cf8" style={{ flexShrink: 0 }} />
            <span>
              Reported by: <strong>{ticket.student_name}</strong> ({ticket.registration_no || 'Student'})
            </span>
          </div>

          {ticket.technician_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fbbf24' }}>
              <HardHat size={14} color="#fbbf24" style={{ flexShrink: 0 }} />
              <span>
                Assigned Tech: <strong>{ticket.technician_name}</strong>
              </span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.74rem' }}>
            <Clock size={13} style={{ flexShrink: 0 }} />
            <span>{new Date(ticket.created_at).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        paddingTop: 12,
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <button
          id={`view-details-${ticket.ticket_id}`}
          onClick={() => onViewDetails(ticket.ticket_id)}
          className="btn btn-secondary btn-sm"
          style={{ flex: 1 }}
        >
          <span>View Audit History</span>
          <ArrowRight size={14} />
        </button>

        {/* Admin Assignment Trigger */}
        {currentUser?.user_type === 'ADMIN' && (
          <button
            id={`admin-assign-${ticket.ticket_id}`}
            onClick={() => onAssign(ticket)}
            className="btn btn-primary btn-sm"
          >
            <HardHat size={14} />
            <span>{ticket.technician_name ? 'Reassign' : 'Assign'}</span>
          </button>
        )}

        {/* Technician Progress Trigger */}
        {(currentUser?.user_type === 'TECHNICIAN' || currentUser?.user_type === 'ADMIN') && 
          ticket.current_status !== 'RESOLVED' && 
          ticket.current_status !== 'CANCELLED' && (
          <button
            id={`update-status-${ticket.ticket_id}`}
            onClick={() => onUpdateStatus(ticket)}
            className="btn btn-success btn-sm"
          >
            <CheckCircle2 size={14} />
            <span>Update Status</span>
          </button>
        )}
      </div>
    </div>
  );
}
