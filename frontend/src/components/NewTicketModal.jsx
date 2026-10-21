import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { X, PlusCircle, AlertCircle, MapPin, Tag } from 'lucide-react';

export default function NewTicketModal({ onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMaster() {
      try {
        const [catRes, locRes] = await Promise.all([
          api.getCategories(),
          api.getLocations()
        ]);
        if (catRes.data) {
          setCategories(catRes.data);
          if (catRes.data.length > 0) {
            setCategoryId(catRes.data[0].category_id);
            setPriority(catRes.data[0].default_priority || 'MEDIUM');
          }
        }
        if (locRes.data) {
          setLocations(locRes.data);
          if (locRes.data.length > 0) {
            setLocationId(locRes.data[0].location_id);
          }
        }
      } catch (err) {
        setError('Error loading categories and locations: ' + err.message);
      }
    }
    fetchMaster();
  }, []);

  const handleCategoryChange = (e) => {
    const selectedId = Number(e.target.value);
    setCategoryId(selectedId);
    const cat = categories.find(c => c.category_id === selectedId);
    if (cat && cat.default_priority) {
      setPriority(cat.default_priority);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !categoryId || !locationId) {
      setError('Please fill out all required fields.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.createTicket({
        title: title.trim(),
        description: description.trim(),
        category_id: Number(categoryId),
        location_id: Number(locationId),
        priority
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
              <PlusCircle size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', color: '#fff' }}>Raise Maintenance Complaint</h2>
              <p style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Stored in 3NF Tickets Table + Initial Status History Audit
              </p>
            </div>
          </div>
          <button
            id="close-new-ticket-btn"
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

            <div className="input-group">
              <label className="input-label">Complaint Title *</label>
              <input
                id="ticket-title-input"
                className="input-control"
                placeholder="e.g., Short circuit in laboratory power outlet"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="input-group">
                <label className="input-label">Issue Category *</label>
                <select
                  id="ticket-category-select"
                  className="select-control"
                  value={categoryId}
                  onChange={handleCategoryChange}
                >
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id} style={{ background: '#0f172a' }}>
                      {c.category_name} (Default: {c.default_priority})
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Priority Level</label>
                <select
                  id="ticket-priority-select"
                  className="select-control"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="LOW" style={{ background: '#0f172a' }}>Low Priority</option>
                  <option value="MEDIUM" style={{ background: '#0f172a' }}>Medium Priority</option>
                  <option value="HIGH" style={{ background: '#0f172a' }}>High Priority</option>
                  <option value="URGENT" style={{ background: '#0f172a' }}>Urgent Emergency</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Campus Location *</label>
              <select
                id="ticket-location-select"
                className="select-control"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
              >
                {locations.map((loc) => (
                  <option key={loc.location_id} value={loc.location_id} style={{ background: '#0f172a' }}>
                    {loc.building} • {loc.floor_no} • {loc.room_or_area}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Detailed Description *</label>
              <textarea
                id="ticket-desc-input"
                className="textarea-control"
                placeholder="Describe the issue, specific location cues, safety risks, or when it started..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              id="submit-ticket-btn"
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Submitting...' : 'Submit Maintenance Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
