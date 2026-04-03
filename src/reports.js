import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ─── Student Report ────────────────────────────────────────────────
export function generateStudentReportPDF(students, filters = {}) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(10, 35, 81);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Dipesh Tutorials', 14, 18);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Student Report', 14, 26);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 14, 18, { align: 'right' });

    // Summary stats
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text(`Total Students: ${students.length}`, 14, 44);
    if (filters.standard) doc.text(`Standard: ${filters.standard}`, 70, 44);
    if (filters.feeStatus) doc.text(`Fee Status: ${filters.feeStatus}`, 120, 44);

    // Table
    doc.autoTable({
        startY: 50,
        head: [['ID', 'Name', 'Standard', 'Roll No', 'Attendance', 'Fee Status', 'Contact']],
        body: students.map(s => [
            s.id || s.studentId || '—',
            s.name || '—',
            s.standard || '—',
            s.rollNo || '—',
            `${s.attendancePercent || s.attendance || '—'}%`,
            (s.feeStatus || 'pending').toUpperCase(),
            s.parentPhone || s.phone || '—',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [10, 35, 81], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 14, right: 14 },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount} — Dipesh Tutorials — Confidential`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`student-report-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ─── Attendance Report ─────────────────────────────────────────────
export function generateAttendanceReportPDF(records, standard = 'All') {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(12, 139, 81);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Dipesh Tutorials', 14, 18);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Attendance Report', 14, 26);
    doc.text(`Standard: ${standard} | ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 14, 18, { align: 'right' });

    doc.setTextColor(0);
    doc.setFontSize(10);
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    doc.text(`Present: ${present} | Absent: ${absent} | Late: ${late}`, 14, 44);

    doc.autoTable({
        startY: 50,
        head: [['Date', 'Student', 'Standard', 'Status', 'Arrival Time']],
        body: records.map(r => [
            r.date || '—',
            r.studentName || r.name || '—',
            r.standard || '—',
            (r.status || 'present').toUpperCase(),
            r.arrivalTime || '—',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [12, 139, 81], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
            3: { cellWidth: 25 },
        },
        didParseCell: (data) => {
            if (data.column.index === 3 && data.section === 'body') {
                const status = data.cell.raw;
                if (status === 'PRESENT') doc.setTextColor(12, 139, 81);
                else if (status === 'LATE') doc.setTextColor(244, 191, 0);
                else if (status === 'ABSENT') doc.setTextColor(239, 68, 68);
            }
        },
        margin: { left: 14, right: 14 },
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount} — Dipesh Tutorials`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`attendance-report-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ─── Fee Report ────────────────────────────────────────────────────
export function generateFeeReportPDF(fees, standard = 'All') {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(182, 146, 46);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Dipesh Tutorials', 14, 18);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Fee Collection Report', 14, 26);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 14, 18, { align: 'right' });

    doc.setTextColor(0);
    doc.setFontSize(10);
    const total = fees.reduce((sum, f) => sum + (f.total_fees || 0), 0);
    const paid = fees.reduce((sum, f) => sum + (f.paid_fees || 0), 0);
    const pending = total - paid;
    doc.text(`Total Demand: ₹${total.toLocaleString('en-IN')} | Collected: ₹${paid.toLocaleString('en-IN')} | Pending: ₹${pending.toLocaleString('en-IN')}`, 14, 44);

    doc.autoTable({
        startY: 50,
        head: [['Student', 'Standard', 'Total Fees', 'Paid', 'Pending', 'Status']],
        body: fees.map(f => [
            f.student_name || '—',
            f.standard_name || '—',
            `₹${(f.total_fees || 0).toLocaleString('en-IN')}`,
            `₹${(f.paid_fees || 0).toLocaleString('en-IN')}`,
            `₹${(f.balance || 0).toLocaleString('en-IN')}`,
            (f.status || 'pending').toUpperCase(),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [182, 146, 46], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 14, right: 14 },
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount} — Dipesh Tutorials — Confidential`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`fee-report-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ─── Test Result Report ────────────────────────────────────────────
export function generateTestResultReportPDF(results, standard = 'All') {
    const doc = new jsPDF('l');
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(78, 73, 161);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Dipesh Tutorials', 14, 18);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Test Results Report', 14, 26);
    doc.text(`Standard: ${standard} | ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 14, 18, { align: 'right' });

    const passed = results.filter(r => (r.percentage || 0) >= 35).length;
    const failed = results.length - passed;
    const avgScore = results.length > 0 ? Math.round(results.reduce((s, r) => s + (r.percentage || 0), 0) / results.length) : 0;
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed} | Avg Score: ${avgScore}%`, 14, 44);

    doc.autoTable({
        startY: 50,
        head: [['Student', 'Test', 'Subject', 'Score', 'Max', 'Percentage', 'Grade']],
        body: results.map(r => {
            const pct = r.percentage || 0;
            const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 35 ? 'D' : 'F';
            return [
                r.studentName || r.name || '—',
                r.testName || r.test || '—',
                r.subject || '—',
                r.score || 0,
                r.maxScore || 100,
                `${pct}%`,
                grade,
            ];
        }),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [78, 73, 161], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 14, right: 14 },
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount} — Dipesh Tutorials — Confidential`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`test-results-report-${new Date().toISOString().split('T')[0]}.pdf`);
}
