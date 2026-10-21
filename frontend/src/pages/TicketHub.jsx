import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import TicketCard from '../components/TicketCard';
import TicketDetailModal from '../components/TicketDetailModal';
import NewTicketModal from '../components/NewTicketModal';
import AssignModal from '../components/AssignModal';
import StatusUpdateModal from '../components/StatusUpdateModal';
import AdminActionModal from '../components/AdminActionModal';
import { 
  Search, Filter, Plus, RefreshCw, AlertCircle, 
  CheckCircle2, Clock, Inbox, Sparkles, Building, Layers
} from 'lucide-react';

export default function TicketHub() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [buildingFilter, setBuildingFilter] = useState('ALL');

  // Modals state
  const [detailTicketId, setDetailTicketId] = useState(null);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [assignTicket, setAssignTicket] = useState(null);
  const [updateStatusTicket, setUpdateStatusTicket] = useState(null);
  const [adminActionTicket, setAdminActionTicket] = useState(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        status: statusFilter,
        priority: priorityFilter,
        category_id: categoryFilter,
        building: buildingFilter,
        search: search.trim() || undefined
      };
      const res = await api.getTickets(params);
      if (res.data) {
        setTickets(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadFilters() {
      try {
        const [catRes, locRes] = await Promise.all([
          api.getCategories(),
          api.getLocations()
        ]);
        if (catRes.data) setCategories(catRes.data);
        if (locRes.data) {
          const uniqueBuildings = Array.from(new Set(locRes.data.map(l => l.building)));
          setLocations(uniqueBuildings);
        }
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    }
    loadFilters();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [user, statusFilter, priorityFilter, categoryFilter, buildingFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTickets();
  };

  // Stats calculation
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.current_status === 'OPEN').length;
  const assignedCount = tickets.filter(t => t.current_status === 'ASSIGNED').length;
  const inProgressCount = tickets.filter(t => t.current_status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter(t => t.current_status === 'RESOLVED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Role Banner / Context */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
        borderRadius: 18,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: user?.user_type === 'ADMIN' ? '#818cf8' : user?.user_type === 'TECHNICIAN' ? '#fbbf24' : '#38bdf8',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {user?.user_type} WORKSPACE
            </span>
            <span style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
              Welcome back, <strong style={{ color: '#fff' }}>{user?.name}</strong>
            </span>
          </div>

          <h1 style={{ fontSize: '1.65rem', color: '#fff', marginBottom: 6 }}>
            {user?.user_type === 'STUDENT' && 'My Campus Maintenance Requests'}
            {user?.user_type === 'ADMIN' && 'Campus Central Dispatch & Ticket Oversight'}
            {user?.user_type === 'TECHNICIAN' && `Assigned Work Orders • ${user?.specialization}`}
          </h1>

          <p style={{ fontSize: '0.86rem', color: '#94a3b8', maxWidth: 700 }}>
            {user?.user_type === 'STUDENT' && 'Log new maintenance complaints, monitor live status transitions, and inspect audit logs.'}
            {user?.user_type === 'ADMIN' && 'Review reported issues, assign qualified technicians with history retention, and manage campus tickets.'}
            {user?.user_type === 'TECHNICIAN' && 'View your active assignments, update field progress, and log mandatory resolution remarks.'}
          </p>
        </div>

        {/* Student Action: Raise Ticket Button */}
        {user?.user_type === 'STUDENT' && (
          <button
            id="raise-ticket-main-btn"
            onClick={() => setIsNewTicketOpen(true)}
            className="btn btn-primary btn-lg"
          >
            <Plus size={18} />
            <span>Raise New Ticket</span>
          </button>
        )}
      </div>

      {/* KPI Stats Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16
      }}>
        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Tickets In View
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>
            {totalCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.74rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700 }}>
            Open / Unassigned
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
            {openCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.74rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 700 }}>
            Underway (Assigned / In Progress)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>
            {assignedCount + inProgressCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.74rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700 }}>
            Resolved
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', marginTop: 4 }}>
            {resolvedCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: 18 }}>
        <form onSubmit={handleSearchSubmit} style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input
              id="ticket-search-input"
              className="input-control"
              style={{ paddingLeft: 38 }}
              placeholder="Search by ticket title, description, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            id="filter-status-select"
            className="select-control"
            style={{ width: 'auto', flex: '0 1 150px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Priority Filter */}
          <select
            id="filter-priority-select"
            className="select-control"
            style={{ width: 'auto', flex: '0 1 140px' }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Category Filter */}
          <select
            id="filter-category-select"
            className="select-control"
            style={{ width: 'auto', flex: '0 1 160px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
          </select>

          {/* Building Filter */}
          <select
            id="filter-building-select"
            className="select-control"
            style={{ width: 'auto', flex: '0 1 170px' }}
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
          >
            <option value="ALL">All Buildings</option>
            {locations.map((bldg) => (
              <option key={bldg} value={bldg}>
                {bldg}
              </option>
            ))}
          </select>

          {/* Refresh button */}
          <button
            id="refresh-tickets-btn"
            type="button"
            onClick={fetchTickets}
            className="btn btn-secondary"
            title="Refresh Tickets"
          >
            <RefreshCw size={16} />
          </button>
        </form>
      </div>

      {/* Tickets Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <div>Loading maintenance tickets from 3NF database...</div>
        </div>
      ) : error ? (
        <div style={{
          padding: 24,
          borderRadius: 12,
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#fb7185',
          textAlign: 'center'
        }}>
          Error loading tickets: {error}
        </div>
      ) : tickets.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(15, 23, 42, 0.4)',
          borderRadius: 16,
          border: '1px dashed rgba(255, 255, 255, 0.1)'
        }}>
          <Inbox size={42} color="#64748b" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: 6 }}>
            No tickets match your filters
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 16 }}>
            {user?.user_type === 'STUDENT'
              ? 'You have not raised any tickets with this criteria yet.'
              : 'No matching maintenance tickets found.'}
          </p>
          {user?.user_type === 'STUDENT' && (
            <button
              onClick={() => setIsNewTicketOpen(true)}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Raise First Ticket</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 20
        }}>
          {tickets.map((t) => (
            <TicketCard
              key={t.ticket_id}
              ticket={t}
              currentUser={user}
              onViewDetails={(id) => setDetailTicketId(id)}
              onAssign={(ticket) => setAssignTicket(ticket)}
              onUpdateStatus={(ticket) => setUpdateStatusTicket(ticket)}
              onAdminAction={(ticket) => setAdminActionTicket(ticket)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {detailTicketId && (
        <TicketDetailModal
          ticketId={detailTicketId}
          currentUser={user}
          onClose={() => setDetailTicketId(null)}
          onAssign={(ticket) => setAssignTicket(ticket)}
          onUpdateStatus={(ticket) => setUpdateStatusTicket(ticket)}
          onAdminAction={(ticket) => setAdminActionTicket(ticket)}
        />
      )}

      {isNewTicketOpen && (
        <NewTicketModal
          onClose={() => setIsNewTicketOpen(false)}
          onSuccess={fetchTickets}
        />
      )}

      {assignTicket && (
        <AssignModal
          ticket={assignTicket}
          onClose={() => setAssignTicket(null)}
          onSuccess={fetchTickets}
        />
      )}

      {updateStatusTicket && (
        <StatusUpdateModal
          ticket={updateStatusTicket}
          onClose={() => setUpdateStatusTicket(null)}
          onSuccess={fetchTickets}
        />
      )}

      {adminActionTicket && (
        <AdminActionModal
          ticket={adminActionTicket}
          onClose={() => setAdminActionTicket(null)}
          onSuccess={fetchTickets}
        />
      )}
    </div>
  );
}
