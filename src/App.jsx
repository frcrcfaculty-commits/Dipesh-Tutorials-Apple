import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from "./lib/supabase";
import BottomNav from "./components/BottomNav";
import Toast from "./components/Toast";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Billing from "./pages/Billing";
import Notifications from "./pages/Notifications";
import Students from "./pages/Students";
import TestResults from "./pages/TestResults";
import Analytics from "./pages/Analytics";
import { showToast } from "./utils";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem("dt_user") || "null"); }
        catch { return null; }
    });
    const [loading, setLoading] = useState(true);
    const fetchingRef = useRef(false);

    async function fetchProfile(authUser) {
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        try {
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 10000);
            const { data: profile } = await supabase
                .from("profiles")
                .select("*, as_student:students!students_profile_id_fkey(id,name,roll_no,standards(name,id),profile_id,parent_profile_id), as_parent:students!students_parent_profile_id_fkey(id,name,roll_no,standards(name,id),profile_id,parent_profile_id)")
                .eq("id", authUser.id).abortSignal(ctrl.signal).single();
            clearTimeout(tid);
            if (profile) {
                const userData = { uid: authUser.id, email: authUser.email, ...profile, students: [...(profile.as_student||[]),...(profile.as_parent||[])] };
                delete userData.as_student; delete userData.as_parent;
                setUser(userData);
                localStorage.setItem("dt_user", JSON.stringify(userData));
            }
        } catch(e) { console.error(e); }
        finally { fetchingRef.current = false; setLoading(false); }
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) fetchProfile(session.user);
            else { setLoading(false); }
        }).catch(() => setLoading(false));

        const { data: { subscription } } = supabase.auth.onAuthStateChange((e, session) => {
            if (e === "SIGNED_OUT" || !session) {
                setUser(null); localStorage.removeItem("dt_user"); setLoading(false);
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: error.message };
        if (data?.user) await fetchProfile(data.user);
        return { success: true };
    };

    const logout = async () => { await supabase.auth.signOut(); setUser(null); localStorage.removeItem("dt_user"); };

    return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>;
}

function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth();
    if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh"}}><div className="spinner dark" /></div>;
    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
    return children;
}

function AppRoutes() {
    const { user } = useAuth();
    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute roles={["parent","admin","superadmin"]}><Billing /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute roles={["admin","superadmin"]}><Students /></ProtectedRoute>} />
            <Route path="/test-results" element={<ProtectedRoute roles={["admin","superadmin"]}><TestResults /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute roles={["admin","superadmin"]}><Analytics /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <HashRouter>
            <AuthProvider>
                <div className="app-shell">
                    <AppRoutes />
                    <BottomNav />
                    <Toast />
                </div>
            </AuthProvider>
        </HashRouter>
    );
}
