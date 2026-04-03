import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from "../App";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email"); return; }
    if (!password) { setError("Please enter your password"); return; }
    setError(""); setLoading(true);
    const result = await login(email.trim(), password);
    if (!result.success) setError(result.error || "Login failed");
    setLoading(false);
  };

  return (
    <div className="login-page">
      <motion.div
        className="login-logo"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, var(--navy-deep), var(--navy))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: "0 8px 24px rgba(10,35,81,0.3)" }}
        >
          <span style={{ color: "white", fontWeight: 800, fontSize: "1.8rem" }}>DT</span>
        </motion.div>
        <h1>Dipesh Tutorials</h1>
        <p>Your coaching companion</p>
      </motion.div>

      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
      >
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Email</label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
              <input className="input" style={{ paddingLeft: 44 }} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" autoComplete="email" />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
              <input className="input" style={{ paddingLeft: 44, paddingRight: 44 }} type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" autoComplete="current-password" />
              <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", display: "flex", padding: 4 }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              style={{ color: "var(--danger)", fontSize: "0.85rem", padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: "var(--radius-md)", textAlign: "center" }}
            >
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            style={{ marginTop: 4 }}
          >
            {loading ? <><div className="spinner" /> Signing in...</> : "Sign In"}
          </motion.button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.78rem", color: "var(--text-tertiary)" }}>
          Contact admin if you forgot your password
        </p>
      </motion.div>

      <div style={{ textAlign: "center", marginTop: 32, paddingBottom: 32 }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
          Powered by Dipesh Tutorials &middot; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
