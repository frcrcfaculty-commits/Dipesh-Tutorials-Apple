import { supabase } from './supabase';

// ─── AUTH ───────────────────────────────────────────────────
export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    return profile ? { ...user, ...profile } : null;
}

export async function createUser(email, password, name, role) {
    // Admin creates user via edge function or Supabase dashboard
    // For now, use signUp and update profile
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role } }
    });
    if (error) throw error;
    return data;
}

// ─── PROFILES ───────────────────────────────────────────────
export async function getProfiles(role = null) {
    let query = supabase.from('profiles').select('*').eq('is_active', true);
    if (role) query = query.eq('role', role);
    const { data, error } = await query.order('name');
    if (error) throw error;
    return data;
}

export async function updateProfile(id, updates) {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

// ─── STANDARDS & SUBJECTS ──────────────────────────────────
export async function getStandards() {
    const { data, error } = await supabase
        .from('standards')
        .select('*')
        .order('sort_order');
    if (error) throw error;
    return data;
}

export async function getSubjects(standardId = null) {
    let query = supabase.from('subjects').select('*, standards(name)');
    if (standardId) query = query.eq('standard_id', standardId);
    const { data, error } = await query.order('name');
    if (error) throw error;
    return data;
}

// ─── STUDENTS ──────────────────────────────────────────────
export async function getStudents(filters = {}) {
    let query = supabase
        .from('students')
        .select('*, standards(name)')
        .eq('is_active', true);

    if (filters.standardId) query = query.eq('standard_id', filters.standardId);
    if (filters.search) query = query.or(`name.ilike.%${filters.search}%,roll_no.eq.${parseInt(filters.search) || 0}`);

    const { data, error } = await query.order('standard_id').order('roll_no');
    if (error) throw error;
    return data;
}

export async function getStudentById(id) {
    const { data, error } = await supabase
        .from('students')
        .select('*, standards(name)')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
}

export async function getStudentByProfileId(profileId) {
    const { data, error } = await supabase
        .from('students')
        .select('*, standards(name)')
        .eq('profile_id', profileId)
        .single();
    if (error) return null;
    return data;
}

export async function getStudentsByParentProfileId(parentProfileId) {
    const { data, error } = await supabase
        .from('students')
        .select('*, standards(name)')
        .eq('parent_profile_id', parentProfileId)
        .eq('is_active', true);
    if (error) throw error;
    return data;
}

export async function addStudent(student) {
    const { data, error } = await supabase
        .from('students')
        .insert(student)
        .select('*, standards(name)')
        .single();
    if (error) {
        console.error('addStudent failed:', error.message, error.details, error.hint, error.code);
        throw error;
    }
    return data;
}

export async function updateStudent(id, updates) {
    const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select('*, standards(name)')
        .single();
    if (error) throw error;
    return data;
}

export async function deleteStudent(id) {
    const { error } = await supabase
        .from('students')
        .update({ is_active: false })
        .eq('id', id);
    if (error) throw error;
}

// ─── ATTENDANCE ────────────────────────────────────────────
export async function getAttendance(filters = {}) {
    let query = supabase
        .from('attendance')
        .select('*, students(name, roll_no, standard_id, standards(name))');

    if (filters.date) query = query.eq('date', filters.date);
    if (filters.studentId) query = query.eq('student_id', filters.studentId);
    if (filters.standardId) {
        // Supabase JS .in() needs an array, not a query builder
        const { data: stdStudents } = await supabase
            .from('students')
            .select('id')
            .eq('standard_id', filters.standardId);
        const studentIds = (stdStudents || []).map(s => s.id);
        if (studentIds.length === 0) return [];
        query = query.in('student_id', studentIds);
    }

    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;
    return data;
}

export async function getStudentAttendance(studentId, days = 28) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .gte('date', fromDate.toISOString().split('T')[0])
        .order('date');
    if (error) throw error;
    return data;
}

export async function markAttendance(recordsOrStudentId, dateOrUndefined, statusOrUndefined) {
    // Support both calling conventions:
    // - markAttendance([{ student_id, date, status, ... }]) — array of records
    // - markAttendance(studentId, date, status) — single student (called from Attendance.jsx)
    let records;
    if (Array.isArray(recordsOrStudentId)) {
        records = recordsOrStudentId;
    } else {
        // Called as markAttendance(studentId, date, status)
        records = [{ student_id: recordsOrStudentId, date: dateOrUndefined, status: statusOrUndefined }];
    }

    const cleanRecords = records.map(r => ({
        ...r,
        marked_by: r.marked_by || null,
    }));
    const { data, error } = await supabase
        .from('attendance')
        .upsert(cleanRecords, { onConflict: 'student_id,date' })
        .select();
    if (error) {
        console.error('markAttendance failed:', error.message, error.details, error.hint, error.code);
        throw error;
    }
    return data;
}

export async function getAttendanceByDate(date, standardId = null) {
    // Two-query approach for reliability (avoids embedded join edge cases)
    let studentQuery = supabase
        .from('students')
        .select('id, name, roll_no, standard_id, standards(name)')
        .eq('is_active', true);
    if (standardId) studentQuery = studentQuery.eq('standard_id', standardId);

    const { data: students, error: sErr } = await studentQuery.order('standard_id').order('roll_no');
    if (sErr) throw sErr;
    if (!students || students.length === 0) return [];

    const { data: attendance, error: aErr } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', date)
        .in('student_id', students.map(s => s.id));
    if (aErr) throw aErr;

    const attMap = {};
    (attendance || []).forEach(a => { attMap[a.student_id] = a; });

    return students.map(s => ({ ...s, attendance: attMap[s.id] ? [attMap[s.id]] : [] }));
}

// ─── TESTS & RESULTS ──────────────────────────────────────
export async function getTests(standardId = null) {
    let query = supabase.from('tests').select('*, standards(name)');
    if (standardId) query = query.eq('standard_id', standardId);
    const { data, error } = await query.order('test_date', { ascending: false });
    if (error) throw error;
    return data;
}

export async function createTest(test) {
    const cleanTest = { ...test, created_by: test.created_by || null };
    const { data, error } = await supabase
        .from('tests')
        .insert(cleanTest)
        .select()
        .single();
    if (error) {
        console.error('createTest failed:', error.message, error.details, error.hint, error.code);
        throw error;
    }
    return data;
}

export async function getTestResults(filters = {}) {
    let query = supabase
        .from('test_results')
        .select('*, students(name, roll_no, standard_id, standards(name)), subjects(name), tests(name, test_date)');

    if (filters.testId) query = query.eq('test_id', filters.testId);
    if (filters.studentId) query = query.eq('student_id', filters.studentId);
    if (filters.subjectId) query = query.eq('subject_id', filters.subjectId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function upsertTestResults(results) {
    // Make entered_by optional
    const cleanResults = results.map(r => ({
        ...r,
        entered_by: r.entered_by || null,
    }));
    const { data, error } = await supabase
        .from('test_results')
        .upsert(cleanResults, { onConflict: 'test_id,student_id,subject_id' })
        .select();
    if (error) {
        console.error('upsertTestResults failed:', error.message, error.details, error.hint, error.code);
        throw error;
    }
    return data;
}

// ─── FEES ──────────────────────────────────────────────────
export async function getFeeSummary(filters = {}) {
    // Use the view — standardName filters by standard_name (e.g. "11th Science")
    let query = supabase.from('student_fee_summary').select('*');
    if (filters.standardName) {
        query = query.eq('standard_name', filters.standardName);
    }
    if (filters.studentIds && filters.studentIds.length > 0) {
        query = query.in('student_id', filters.studentIds);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
}

export async function getFeePayments(studentId) {
    const { data, error } = await supabase
        .from('fee_payments')
        .select('*, profiles(name)')
        .eq('student_id', studentId)
        .order('payment_date', { ascending: false });
    if (error) throw error;
    return data;
}

export async function getAllFeePayments() {
    const { data, error } = await supabase
        .from('fee_payments')
        .select('*')
        .order('payment_date', { ascending: false });
    if (error) throw error;
    return data;
}

export async function getFeeStructures() {
    const { data, error } = await supabase
        .from('fee_structures')
        .select('*');
    if (error) throw error;
    return data;
}

export async function getFeeStructureByStandard(standardId) {
    const { data, error } = await supabase
        .from('fee_structures')
        .select('*')
        .eq('standard_id', standardId)
        .single();
    if (error) return null;
    return data;
}

export async function recordPayment(payment) {
    // Make recorded_by optional
    const cleanPayment = {
        ...payment,
        recorded_by: payment.recorded_by || null,
    };
    const { data, error } = await supabase
        .from('fee_payments')
        .insert(cleanPayment)
        .select()
        .single();
    if (error) {
        console.error('recordPayment failed:', error.message, error.details, error.hint, error.code);
        throw error;
    }
    return data;
}

// ─── NOTIFICATIONS ─────────────────────────────────────────
export async function getNotifications(userRole, limit = 50) {
    const { data, error } = await supabase
        .from('notifications')
        .select('*, profiles(name)')
        .contains('target_roles', [userRole])
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) throw error;
    return data;
}

export async function createNotification(notification) {
    // Make sent_by optional
    const cleanNotif = {
        ...notification,
        sent_by: notification.sent_by || null,
    };
    const { data, error } = await supabase
        .from('notifications')
        .insert(cleanNotif)
        .select()
        .single();
    if (error) {
        console.error('createNotification failed:', error.message, error.details, error.hint, error.code);
        throw error;
    }
    return data;
}

export async function markNotificationRead(notificationId, profileId) {
    const { error } = await supabase
        .from('notification_reads')
        .upsert({ notification_id: notificationId, profile_id: profileId }, { onConflict: 'notification_id,profile_id' });
    if (error) throw error;
}

export async function getReadNotificationIds(profileId) {
    const { data, error } = await supabase
        .from('notification_reads')
        .select('notification_id')
        .eq('profile_id', profileId);
    if (error) throw error;
    return (data || []).map(r => r.notification_id);
}

// ─── RESOURCES ─────────────────────────────────────────────
export async function getResources(filters = {}) {
    let query = supabase
        .from('resources')
        .select('*, subjects(name), standards(name), profiles(name)');

    if (filters.standardId) query = query.eq('standard_id', filters.standardId);
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.isMissedLecture) query = query.eq('is_missed_lecture', true);
    if (filters.search) query = query.or(`title.ilike.%${filters.search}%,tags.cs.{${filters.search}}`);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function uploadResource(resource) {
    const cleanResource = { ...resource, uploaded_by: resource.uploaded_by || null };
    const { data, error } = await supabase
        .from('resources')
        .insert(cleanResource)
        .select()
        .single();
    if (error) {
        console.error('uploadResource failed:', error.message, error.details, error.hint, error.code);
        throw error;
    }
    return data;
}

export async function uploadFile(bucket, path, file) {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });
    if (error) {
        if (error.message?.includes('not found') || error.statusCode === 404) {
            throw new Error(`Storage bucket "${bucket}" not found. Ask admin to create it in Supabase Dashboard > Storage.`);
        }
        throw error;
    }
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return urlData.publicUrl;
}

// ─── DASHBOARD STATS ───────────────────────────────────────
export async function getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];

    const [studentsRes, todayAttRes, notifRes, feesRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('attendance').select('status').eq('date', today),
        supabase.from('notifications').select('id', { count: 'exact', head: true }),
        supabase.from('student_fee_summary').select('total_fees, paid_fees'),
    ]);

    const totalStudents = studentsRes.count || 0;
    const todayAttendance = todayAttRes.data || [];
    const presentToday = todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const totalToday = todayAttendance.length || 1;

    const allFees = feesRes.data || [];
    const totalCollected = allFees.reduce((s, f) => s + parseFloat(f.paid_fees || 0), 0);
    const totalDemand = allFees.reduce((s, f) => s + parseFloat(f.total_fees || 0), 0);

    return {
        totalStudents,
        attendancePercent: Math.round((presentToday / totalToday) * 100),
        totalNotifications: notifRes.count || 0,
        totalCollected,
        pendingFees: totalDemand - totalCollected,
    };
}

// ─── STUDENT STATS (for PDF reports) ──────────────────────
export async function getStudentStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: attendance } = await supabase
        .from('attendance')
        .select('student_id, status')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

    const stats = {};
    (attendance || []).forEach(a => {
        if (!stats[a.student_id]) stats[a.student_id] = { total: 0, present: 0 };
        stats[a.student_id].total++;
        if (a.status === 'present' || a.status === 'late') stats[a.student_id].present++;
    });

    return stats; // { studentId: { total, present } }
}
