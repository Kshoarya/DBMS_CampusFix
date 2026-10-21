import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Database, Table, Key, ArrowRight, Play, Terminal, 
  CheckCircle2, FileText, Layers, Shield, Sparkles 
} from 'lucide-react';

const SAMPLE_QUERIES = [
  {
    name: '1. Full Ticket Join (3NF Denormalized View)',
    sql: `SELECT 
    t.ticket_id, t.title, t.priority, t.current_status,
    u.name AS student_name, s.registration_no,
    c.category_name,
    l.building, l.room_or_area
FROM tickets t
JOIN students s ON t.student_id = s.student_id
JOIN users u ON s.user_id = u.user_id
JOIN categories c ON t.category_id = c.category_id
JOIN locations l ON t.location_id = l.location_id
ORDER BY t.ticket_id DESC;`
  },
  {
    name: '2. Reassignment History Audit (Associative Entity)',
    sql: `SELECT 
    a.assignment_id, a.ticket_id, t.title AS ticket_title,
    tech_u.name AS technician_name, tech.specialization,
    adm_u.name AS assigned_by_admin,
    a.assignment_status, a.assigned_at, a.completed_at
FROM assignments a
JOIN tickets t ON a.ticket_id = t.ticket_id
JOIN technicians tech ON a.technician_id = tech.technician_id
JOIN users tech_u ON tech.user_id = tech_u.user_id
JOIN admins adm ON a.assigned_by_admin_id = adm.admin_id
JOIN users adm_u ON adm.user_id = adm_u.user_id
ORDER BY a.ticket_id, a.assigned_at ASC;`
  },
  {
    name: '3. Complete Status Transition Audit Trail',
    sql: `SELECT 
    sh.history_id, sh.ticket_id,
    COALESCE(sh.old_status, 'START') AS from_status,
    sh.new_status AS to_status,
    u.name AS changed_by_user,
    u.user_type AS actor_role,
    sh.remarks,
    sh.changed_at
FROM status_history sh
JOIN users u ON sh.changed_by_user_id = u.user_id
ORDER BY sh.ticket_id, sh.changed_at ASC;`
  },
  {
    name: '4. Total/Disjoint ISA Specialization Hierarchy',
    sql: `SELECT 
    u.user_id, u.name, u.email, u.user_type,
    s.registration_no,
    t.specialization
FROM users u
LEFT JOIN students s ON u.user_id = s.user_id
LEFT JOIN admins a ON u.user_id = a.user_id
LEFT JOIN technicians t ON u.user_id = t.user_id
ORDER BY u.user_type, u.user_id;`
  }
];

export default function SchemaPage() {
  const [schemaData, setSchemaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('tables'); // 'tables', 'normalization', 'console'
  
  // Console state
  const [queryInput, setQueryInput] = useState(SAMPLE_QUERIES[0].sql);
  const [queryResult, setQueryResult] = useState(null);
  const [runningQuery, setRunningQuery] = useState(false);
  const [queryError, setQueryError] = useState(null);

  useEffect(() => {
    async function loadSchema() {
      try {
        setLoading(true);
        const res = await api.getSchemaInfo();
        if (res.data) {
          setSchemaData(res.data);
        }
      } catch (err) {
        console.error('Failed to load schema data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSchema();
  }, []);

  const handleRunQuery = async (sqlToRun = queryInput) => {
    try {
      setRunningQuery(true);
      setQueryError(null);
      const res = await api.runSqlQuery(sqlToRun);
      setQueryResult(res);
    } catch (err) {
      setQueryError(err.message);
      setQueryResult(null);
    } finally {
      setRunningQuery(false);
    }
  };

  const handleSelectSample = (sample) => {
    setQueryInput(sample.sql);
    handleRunQuery(sample.sql);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)',
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
              color: 'var(--cyan)',
              background: 'rgba(6, 182, 212, 0.12)',
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid rgba(6, 182, 212, 0.3)'
            }}>
              PROJECT P17 • DBMS EVALUATION
            </span>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              Engine: <strong style={{ color: '#34d399' }}>{schemaData?.dbEngine?.toUpperCase() || 'SQLITE'}</strong>
            </span>
          </div>

          <h1 style={{ fontSize: '1.65rem', color: '#fff', marginBottom: 6 }}>
            Relational Data Model & 3NF Architecture
          </h1>

          <p style={{ fontSize: '0.86rem', color: '#94a3b8', maxWidth: 850 }}>
            Strict implementation of the Conceptual EER Diagram and Logical ER Model with Total/Disjoint ISA Specialization, 
            Audit Trail preservation, and 3NF normalization eliminating insertion/deletion anomalies.
          </p>

          <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            {schemaData?.teamMembers?.map((m) => (
              <span key={m.id} style={{
                fontSize: '0.76rem',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '3px 10px',
                borderRadius: 6,
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                {m.name} ({m.id})
              </span>
            ))}
          </div>
        </div>

        {/* Sub-tab navigation */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActiveSubTab('tables')}
            className="btn btn-secondary btn-sm"
            style={{
              background: activeSubTab === 'tables' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
              borderColor: activeSubTab === 'tables' ? '#6366f1' : 'transparent',
              color: activeSubTab === 'tables' ? '#fff' : '#94a3b8'
            }}
          >
            <Table size={15} />
            <span>9 Normalized Tables</span>
          </button>

          <button
            onClick={() => setActiveSubTab('normalization')}
            className="btn btn-secondary btn-sm"
            style={{
              background: activeSubTab === 'normalization' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
              borderColor: activeSubTab === 'normalization' ? '#6366f1' : 'transparent',
              color: activeSubTab === 'normalization' ? '#fff' : '#94a3b8'
            }}
          >
            <Sparkles size={15} />
            <span>3NF Normalization</span>
          </button>

          <button
            onClick={() => setActiveSubTab('console')}
            className="btn btn-primary btn-sm"
          >
            <Terminal size={15} />
            <span>Interactive SQL Terminal</span>
          </button>
        </div>
      </div>

      {/* SubTab 1: 9 Tables & Data Dictionary */}
      {activeSubTab === 'tables' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 16
          }}>
            {schemaData?.tables?.map((tbl) => {
              const stat = schemaData.tableStats?.find(s => s.table_name === tbl.name);
              const rowCount = stat ? stat.row_count : 0;

              return (
                <div key={tbl.name} className="glass-card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Table size={18} color="#6366f1" />
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: '#fff'
                      }}>
                        {tbl.name}
                      </span>
                    </div>

                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#34d399',
                      padding: '2px 8px',
                      borderRadius: 9999,
                      border: '1px solid rgba(16, 185, 129, 0.25)'
                    }}>
                      {rowCount} rows
                    </span>
                  </div>

                  <div style={{
                    fontSize: '0.74rem',
                    color: 'var(--cyan)',
                    fontWeight: 600,
                    marginBottom: 10,
                    textTransform: 'uppercase'
                  }}>
                    {tbl.type}
                  </div>

                  {/* Primary Key */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.78rem',
                    color: '#fbbf24',
                    marginBottom: 8
                  }}>
                    <Key size={13} />
                    <span>PRIMARY KEY: <strong>{tbl.primaryKey}</strong></span>
                  </div>

                  {/* Foreign Keys */}
                  {tbl.foreignKeys?.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>
                        Foreign Keys:
                      </div>
                      {tbl.foreignKeys.map((fk, idx) => (
                        <div key={idx} style={{
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          color: '#a5b4fc',
                          marginLeft: 8
                        }}>
                          ↳ {fk.column} → {fk.references}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Column list */}
                  <div style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 4 }}>
                      Columns:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {tbl.columns.map((col) => (
                        <span key={col} style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.7rem',
                          background: 'rgba(255, 255, 255, 0.03)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          color: col === tbl.primaryKey ? '#fbbf24' : '#cbd5e1'
                        }}>
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SubTab 2: Normalization Process (UNF -> 3NF) */}
      {activeSubTab === 'normalization' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {schemaData?.normalizationSteps?.map((step, idx) => (
            <div key={idx} className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: '#fff'
                }}>
                  {idx + 1}
                </span>
                <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>
                  {step.stage}
                </h3>
              </div>

              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: '0.78rem', color: '#f43f5e', fontWeight: 700, textTransform: 'uppercase' }}>
                  Anomaly / Dependency Addressed:
                </span>
                <p style={{ fontSize: '0.88rem', color: '#cbd5e1', marginTop: 2 }}>
                  {step.issue}
                </p>
              </div>

              <div style={{
                background: 'rgba(0, 0, 0, 0.35)',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.06)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.84rem',
                color: 'var(--cyan)'
              }}>
                {step.design}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SubTab 3: Interactive SQL Terminal Console */}
      {activeSubTab === 'console' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Sample Query Clickers */}
          <div className="glass-card" style={{ padding: 16 }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 10 }}>
              Pre-built Evaluation Queries (Click to load & execute):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SAMPLE_QUERIES.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(s)}
                  className="btn btn-secondary btn-sm"
                  style={{ textAlign: 'left' }}
                >
                  <Play size={12} color="#6366f1" />
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SQL Editor Area */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Terminal size={18} color="#34d399" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                  SQL Query Console (SELECT only)
                </span>
              </div>

              <button
                id="run-sql-btn"
                onClick={() => handleRunQuery()}
                disabled={runningQuery}
                className="btn btn-primary btn-sm"
              >
                <Play size={14} />
                <span>{runningQuery ? 'Executing...' : 'Run Query'}</span>
              </button>
            </div>

            <textarea
              id="sql-query-input"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              style={{
                width: '100%',
                minHeight: 140,
                background: '#090d16',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 8,
                padding: '14px',
                color: '#38bdf8',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.86rem',
                lineHeight: 1.5,
                outline: 'none',
                resize: 'vertical'
              }}
            />

            {queryError && (
              <div style={{
                marginTop: 12,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#fb7185',
                fontSize: '0.84rem'
              }}>
                {queryError}
              </div>
            )}
          </div>

          {/* Query Results Table */}
          {queryResult && (
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                  Query Output ({queryResult.rowCount} rows returned)
                </span>
                <span style={{ fontSize: '0.72rem', color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                  Status: 200 OK
                </span>
              </div>

              {queryResult.rowCount === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  0 rows returned.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', maxHeight: 420 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#0f172a' }}>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)', color: '#94a3b8' }}>
                        {Object.keys(queryResult.rows[0]).map((key) => (
                          <th key={key} style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.rows.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          {Object.values(row).map((val, cIdx) => (
                            <td key={cIdx} style={{
                              padding: '10px 14px',
                              color: val === null ? '#64748b' : '#cbd5e1',
                              fontFamily: 'var(--font-mono)'
                            }}>
                              {val === null ? 'NULL' : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
