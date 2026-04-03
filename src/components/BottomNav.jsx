import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, IndianRupee, Bell, Users } from 'lucide-react';
import { motion } from "framer-motion";

const items = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/attendance", icon: Calendar, label: "Attendance" },
  { to: "/billing", icon: IndianRupee, label: "Fees" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
  { to: "/students", icon: Users, label: "Students" },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to === "/"}>
          {({ isActive }) => (
            <div className="nav-item" style={{ position: "relative" }}>
              <motion.div
                animate={{ scale: isActive ? 1.15 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
              >
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 44,
                      height: 32,
                      borderRadius: 16,
                      background: "rgba(10,35,81,0.08)",
                      zIndex: -1,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                )}
              </motion.div>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
