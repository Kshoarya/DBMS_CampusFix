import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import TicketHub from './pages/TicketHub';
import ReportsPage from './pages/ReportsPage';
import SchemaPage from './pages/SchemaPage';
import { Wrench, Shield, GraduationCap, HardHat, Lock, ArrowRight, Sparkles } from 'lucide-react';

function MainApp() {
  const { user, login, demoUsers, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('tickets');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);
    const res = await login(email, password);
    setIsLoggingIn(false);
    if (!res.success) {
      setAuthError(res.message);
    }
  };

  const handleFastDemoLogin = async (demoEmail) => {
    setAuthError(null);
    setIsLoggingIn(true);
    await login(demoEmail, 'password123');
    setIsLoggingIn(false);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Wrench size={24} color="#fff" />
        </div>
        <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
          Connecting to 3NF Campus Maintenance Database...
        </div>
      </div>
    );
  }

  // If user is not logged in, show elegant login & demo accounts screen
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}>
        <div style={{
          width: '100%',
          maxWidth: 960,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: 24
        }}>
          {/* Left: Project Branding & EER Overview */}
          <div className="glass-card" style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Wrench size={24} color="#fff" />
                </div>
                <div>
                  <h1 style={{ fontSize: '1.35rem', color: '#fff' }}>CampusFix</h1>
                  <span style={{ fontSize: '0.74rem', color: '#818cf8', fontWeight: 700 }}>
                    PROJECT P17 • DBMS PHASE 1
                  </span>
                </div>
              </div>

              <h2 style={{ fontSize: '1.15rem', color: '#e2e8f0', marginBottom: 10 }}>
                Campus Maintenance Ticket System
              </h2>
              <p style={{ fontSize: '0.86rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: 20 }}>
                A database-driven application where students report infrastructure issues, administrators assign technicians, 
                and technicians log work updates in a strictly normalized 3NF schema.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8' }}>
                  <Sparkles size={16} />
                  <span>Total, Disjoint ISA Specialization (User → Student, Admin, Technician)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fbbf24' }}>
                  <Sparkles size={16} />
                  <span>Associative Assignment entity preserving reassignment history</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399' }}>
                  <Sparkles size={16} />
                  <span>Audit entity preserving complete status transition logs</span>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.76rem',
              color: '#64748b'
            }}>
              Team: Shardul Parag Rawal (25BCE2548) • Tapan (25BCE2947) • Kshoarya Atul Hirawat (25BCE0466)
            </div>
          </div>

          {/* Right: Fast Demo Login / Evaluation Hub */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: 6 }}>
              Quick Evaluation Access
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 16 }}>
              Select a pre-seeded campus account to evaluate role permissions:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {/* Student */}
              <button
                id="login-student-demo-btn"
                onClick={() => handleFastDemoLogin('kshoarya@campus.edu')}
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', padding: '12px 16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <GraduationCap size={18} color="#38bdf8" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>
                      Kshoarya Atul Hirawat
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Student • Reg: 25BCE0466
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} color="#38bdf8" />
              </button>

              {/* Admin */}
              <button
                id="login-admin-demo-btn"
                onClick={() => handleFastDemoLogin('admin@campus.edu')}
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', padding: '12px 16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Shield size={18} color="#818cf8" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>
                      Shardul Parag Rawal
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Administrator (Assign & Triage)
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} color="#818cf8" />
              </button>

              {/* Technician */}
              <button
                id="login-tech-demo-btn"
                onClick={() => handleFastDemoLogin('ramesh.tech@campus.edu')}
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', padding: '12px 16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <HardHat size={18} color="#fbbf24" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>
                      Ramesh Sharma
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Technician (Electrical & Power Systems)
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} color="#fbbf24" />
              </button>
            </div>

            {/* Custom Credentials Form */}
            <form onSubmit={handleLoginSubmit}>
              <div style={{
                position: 'relative',
                textAlign: 'center',
                margin: '18px 0',
                fontSize: '0.72rem',
                color: '#64748b'
              }}>
                <span style={{ background: '#0f172a', padding: '0 10px', position: 'relative', zIndex: 1 }}>
                  OR SIGN IN MANUALLY
                </span>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: 1,
                  background: 'rgba(255, 255, 255, 0.08)'
                }}></div>
              </div>

              {authError && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: 'rgba(244, 63, 94, 0.12)',
                  color: '#fb7185',
                  fontSize: '0.8rem',
                  marginBottom: 12
                }}>
                  {authError}
                </div>
              )}

              <div className="input-group">
                <input
                  id="login-email-input"
                  className="input-control"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <input
                  id="login-password-input"
                  type="password"
                  className="input-control"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                id="submit-login-btn"
                type="submit"
                disabled={isLoggingIn}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {isLoggingIn ? 'Authenticating...' : 'Sign In with Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ flexDirection: 'column' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {activeTab === 'tickets' && <TicketHub />}
        {activeTab === 'reports' && <ReportsPage />}
        {activeTab === 'schema' && <SchemaPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
