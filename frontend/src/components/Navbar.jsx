import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Wrench, Database, Shield, GraduationCap, HardHat, 
  ChevronDown, LogOut, BarChart3, Layers, UserCheck, CheckCircle
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout, switchDemoUser, demoUsers, dbInfo } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ADMIN':
        return <Shield size={16} className="text-indigo-400" />;
      case 'TECHNICIAN':
        return <HardHat size={16} className="text-amber-400" />;
      case 'STUDENT':
      default:
        return <GraduationCap size={16} className="text-cyan-400" />;
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'badge-assigned';
      case 'TECHNICIAN':
        return 'badge-in_progress';
      case 'STUDENT':
      default:
        return 'badge-open';
    }
  };

  return (
    <nav style={{
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: 1500,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            width: 40,
            height: 40,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)'
          }}>
            <Wrench size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', letterSpacing: '-0.02em' }}>
                CampusFix
              </span>
              <span style={{
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 4,
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}>
                PROJECT P17
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              Maintenance Ticket System (3NF Relational)
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            id="nav-tickets-btn"
            onClick={() => setActiveTab('tickets')}
            className="btn btn-secondary btn-sm"
            style={{
              backgroundColor: activeTab === 'tickets' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              borderColor: activeTab === 'tickets' ? '#6366f1' : 'transparent',
              color: activeTab === 'tickets' ? '#fff' : '#94a3b8'
            }}
          >
            <Layers size={16} />
            <span>Ticket Hub</span>
          </button>

          <button
            id="nav-reports-btn"
            onClick={() => setActiveTab('reports')}
            className="btn btn-secondary btn-sm"
            style={{
              backgroundColor: activeTab === 'reports' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              borderColor: activeTab === 'reports' ? '#6366f1' : 'transparent',
              color: activeTab === 'reports' ? '#fff' : '#94a3b8'
            }}
          >
            <BarChart3 size={16} />
            <span>Campus Analytics</span>
          </button>

          <button
            id="nav-schema-btn"
            onClick={() => setActiveTab('schema')}
            className="btn btn-secondary btn-sm"
            style={{
              backgroundColor: activeTab === 'schema' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              borderColor: activeTab === 'schema' ? '#06b6d4' : 'transparent',
              color: activeTab === 'schema' ? '#38bdf8' : '#94a3b8'
            }}
          >
            <Database size={16} />
            <span>DBMS Schema & 3NF</span>
          </button>
        </div>

        {/* Database Status & User Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Engine indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 9999,
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: '#34d399'
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }}></span>
            {dbInfo.database ? dbInfo.database.toUpperCase() : 'SQLITE'} 3NF
          </div>

          {/* Quick Role Switcher Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              id="role-switcher-dropdown"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '6px 14px',
                borderRadius: 10,
                cursor: 'pointer',
                color: '#fff',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {user && getRoleIcon(user.user_type)}
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    {user?.name || 'Guest'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    {user?.user_type === 'STUDENT' && `Reg: ${user.registration_no || '25BCE0466'}`}
                    {user?.user_type === 'ADMIN' && 'Campus Administrator'}
                    {user?.user_type === 'TECHNICIAN' && (user.specialization || 'Maintenance')}
                  </div>
                </div>
              </div>
              <span className={`badge ${getRoleBadgeClass(user?.user_type)}`} style={{ fontSize: '0.65rem' }}>
                {user?.user_type}
              </span>
              <ChevronDown size={14} color="#94a3b8" />
            </button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '115%',
                width: 320,
                background: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 14,
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.2)',
                padding: '10px',
                zIndex: 200
              }}>
                <div style={{
                  padding: '8px 12px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#64748b',
                  letterSpacing: '0.05em'
                }}>
                  Instant Role Switcher (Evaluation Demo)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {demoUsers.map((u) => {
                    const isSelected = user?.email === u.email;
                    return (
                      <button
                        key={u.user_id}
                        id={`switch-user-${u.user_id}`}
                        onClick={() => {
                          switchDemoUser(u.email);
                          setDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: 8,
                          background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                          border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                          cursor: 'pointer',
                          color: '#fff',
                          textAlign: 'left',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {getRoleIcon(u.user_type)}
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                              {u.name}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                              {u.user_type} {u.registration_no ? `• ${u.registration_no}` : ''} {u.specialization ? `• ${u.specialization}` : ''}
                            </div>
                          </div>
                        </div>
                        {isSelected && <CheckCircle size={14} color="#6366f1" />}
                      </button>
                    );
                  })}
                </div>

                <div style={{
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'transparent',
                      border: 'none',
                      color: '#f43f5e',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      padding: '4px 8px'
                    }}
                  >
                    <LogOut size={13} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
