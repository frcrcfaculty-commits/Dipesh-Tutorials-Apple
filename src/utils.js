// Utility functions for the Dipesh Tutorials app

/**
 * Export data as a CSV file download
 */
export function exportCSV(filename, headers, rows) {
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Show a toast notification (non-blocking)
 */
export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; bottom: 24px; right: 24px; z-index: 9999;
        padding: 12px 24px; border-radius: 8px; font-size: 0.9rem; font-weight: 600;
        color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: fadeSlideUp 0.3s ease;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#0A2351'};
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

/**
 * Wrap a promise with a timeout. Rejects if not resolved within `ms` milliseconds.
 */
export function withTimeout(promise, ms = 10000) {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out. Please check your connection and try again.')), ms)
    );
    return Promise.race([promise, timeout]);
}

// Web Audio API notification tone (no external dependency)
export function playNotificationTone() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
        oscillator.frequency.setValueAtTime(1108, ctx.currentTime + 0.1); // C#6
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
        // Silently fail if Web Audio not available
    }
}
