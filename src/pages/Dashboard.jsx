import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../App";
import { getDashboardStats, getStudentAttendance, getNotifications, getFeeSummary } from "../lib/api";
import { Users, CalendarCheck, IndianRupee, Bell, LogOut, ChevronRight, TrendingUp, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
}

function CircularProgress({ value, max, size = 80, stroke = 6, color = 'var(--navy)', label }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-secondary)" strokeWidth={stroke} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: size < 70 ? '1.1rem' : '1.4rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{Math.round(pct)}%</div>
        {label && <div style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)', fontWeight: 500, marginTop: 2 }}>{label}</div>}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color, delay = 0 }) {
  return (
    <motion.div
      className="metric-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileTap={{ scale: 0.97 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="metric-label">{label}</div>
          <div className="metric-value" style={{ color }}>{value}</div>
          {sub && <div className="metric-sub">{sub}</div>}
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} style={{ color }} strokeWidth={2} />
        </div>
      </div>
    </motion.div>
  );
}

function NotificationItem({ n }) {
  const iconColors = { general: 'var(--blue)', fee: 'var(--danger)', attendance: 'var(--warning)', exam: 'var(--navy)', resource: 'var(--success)' };
  const icons = { general: Bell, fee: IndianRupee, attendance: CalendarCheck, exam: TrendingUp, resource: Users };
  const Icon = icons[n.type] || Bell;
  return (
    <motion.div
      className="list-item"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileTap={{ scale: 0.98 }}
      style={{ marginBottom: 8 }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: (iconColors[n.type] || 'var(--blue)') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} style={{ color: iconColors[n.type] || 'var(--blue)' }} />
      </div>
      <div className="list-item-content">
        <div className="list-item-title">{n.title}</div>
        <div className="list-item-sub">{n.message}</div>
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>{formatDate(n.created_at)}</div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalStudents: 0, attendancePercent: 0, totalCollected: 0, pendingFees: 0 });
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attData, setAttData] = useState([]);
  const [feeBalance, setFeeBalance] = useState(null);
  const studentId = user?.students?.[0]?.id;

  useEffect(() => {
    async function load() {
      try {
        const [s, notifs] = await Promise.all([
          getDashboardStats(),
          getNotifications(user?.role, 5),
        ]);
        setStats(s || {});
        setRecentNotifs(notifs || []);
        if (studentId) {
          const [att, fees] = await Promise.all([
            getStudentAttendance(studentId, 14),
            getFeeSummary({ studentIds: [studentId] }),
          ]);
          setAttData(att || []);
          const myFee = (fees || []).find(f => f.student_id === studentId);
          if (myFee) setFeeBalance(myFee.balance || 0);
        }
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [studentId]);

  const present = attData.filter(a => a.status === 'present' || a.status === 'late').length;
  const attPct = attData.length > 0 ? Math.round((present / attData.length) * 100) : 0;

  const roleLabel = { superadmin: 'Administrator', admin: 'Administrator', student: 'Student', parent: 'Parent' };
  const roleGreeting = { superadmin: 'Welcome back', admin: 'Welcome back', student: 'Hello', parent: 'Welcome back' };

  return (
    <>
      {/* Hero Card */}
      <motion.div
        className="hero-card"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ margin: '16px 18px 0', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ opacity: 0.75, fontSize: '0.8rem', marginBottom: 4, fontWeight: 500 }}>{roleGreeting[user?.role] || 'Hello'},</p>
              <h1 style={{ fontSize: '1.6rem', marginBottom: 2 }}>{user?.name}</h1>
              <p style={{ opacity: 0.7, fontSize: '0.8rem' }}>{user?.students?.[0] ? user.students[0].name : roleLabel[user?.role]}</p>
              {user?.students?.[0]?.standards?.name && (
                <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem' }}>
                  {user.students[0].standards.name}
                </div>
              )}
            </div>
            <motion.button
              onClick={logout}
              whileTap={{ scale: 0.9 }}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 12, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
            >
              <LogOut size={16} />
            </motion.button>
          </div>

          {/* Inline attendance ring for students/parents */}
          {(user?.role === 'student' || user?.role === 'parent') && (
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <CircularProgress value={attPct} max={100} color="var(--gold)" label="Attendance" />
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{attPct}%</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Last 14 days</div>
                {feeBalance !== null && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ marginTop: 8, fontSize: '0.8rem', color: feeBalance > 0 ? 'rgba(255,200,100,0.9)' : 'rgba(100,255,150,0.9)' }}
                  >
                    Fee balance: Rs.{parseFloat(feeBalance).toLocaleString('en-IN')}
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Decorative orb */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(182,146,46,0.2)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(182,146,46,0.12)' }} />
      </motion.div>

      <div className="page">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ marginBottom: 20 }}
        >
          <div className="stats-grid">
            <MetricCard icon={Users} label="Total Students" value={loading ? '—' : stats.totalStudents} color="var(--navy)" delay={0.25} />
            <MetricCard icon={CalendarCheck} label="Today's Attendance" value={loading ? '—' : stats.attendancePercent + '%'} color="var(--success)" delay={0.3} />
            <MetricCard icon={IndianRupee} label="Fees Collected" value={loading ? '—' : 'Rs.' + ((stats.totalCollected || 0) / 1000).toFixed(0) + 'K'} color="var(--gold)" delay={0.35} />
            <MetricCard icon={Bell} label="Pending Fees" value={loading ? '—' : 'Rs.' + ((stats.pendingFees || 0) / 1000).toFixed(0) + 'K'} color="var(--danger)" delay={0.4} />
          </div>
        </motion.div>

        {/* Notifications */}
        <AnimatePresence>
          {recentNotifs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="section-header">
                <h3 className="section-title">Recent Notifications</h3>
                <motion.button
                  onClick={() => navigate('/notifications')}
                  whileTap={{ scale: 0.95 }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--navy)', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  View all <ChevronRight size={14} />
                </motion.button>
              </div>
              <AnimatePresence>
                {recentNotifs.slice(0, 3).map((n, i) => (
                  <NotificationItem key={n.id} n={n} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {recentNotifs.length === 0 && !loading && (
          <motion.div
            className="card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ padding: 32, textAlign: 'center', marginBottom: 20 }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>No notifications yet</div>
          </motion.div>
        )}

        {/* Quick Links */}
        {(user?.role === 'admin' || user?.role === 'superadmin') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ marginTop: 8 }}
          >
            <h3 className="section-title" style={{ marginBottom: 12 }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Mark Attendance', icon: CalendarCheck, color: 'var(--navy)', action: () => navigate('/attendance') },
                { label: 'Test Results', icon: TrendingUp, color: 'var(--gold)', action: () => navigate('/test-results') },
                { label: 'Analytics', icon: Users, color: 'var(--success)', action: () => navigate('/analytics') },
                { label: 'Fee Collection', icon: IndianRupee, color: 'var(--warning)', action: () => navigate('/billing') },
              ].map(({ label, icon: Icon, color, action }) => (
                <motion.button
                  key={label}
                  onClick={action}
                  whileTap={{ scale: 0.95 }}
                  style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
