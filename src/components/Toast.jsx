import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";

let toastTimer = null;
let toastMsg = "";
let toastType = "default";
let setToastState = null;

export function showToast(msg, type = "default") {
  toastMsg = msg; toastType = type;
  if (setToastState) setToastState({ msg, type, key: Date.now() });
}

export default function Toast() {
  const [t, setT] = useState(null);
  setToastState = setT;

  useEffect(() => {
    if (!t) return;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setT(null), 3000);
    return () => { if (toastTimer) clearTimeout(toastTimer); };
  }, [t]);

  return (
    <AnimatePresence>
      {t && (
        <motion.div
          key={t.key}
          className="toast show"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          style={t.type === "error" ? { background: "var(--danger)" } : {}}
        >
          {t.msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
