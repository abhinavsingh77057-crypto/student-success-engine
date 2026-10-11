// Student Success & Intervention Engine (SS&IE) - Client Core
document.addEventListener("DOMContentLoaded", () => {
    // State management
    const state = {
        currentPage: 1,
        limit: 10,
        searchQuery: '',
        riskFilter: '',
        sortBy: 'student_id',
        sortOrder: 'asc',
        charts: {}
    };

    // Color definitions aligned with CSS design tokens
    const colors = {
        low: '#2a9d8f',
        med: '#f4a261',
        high: '#e76f51',
        primary: '#4cc9f0',
        violet: '#7209b7',
        navy: '#0d1b2a'
    };

    // Initialize UI elements and events
    initNavigation();
    initModals();
    initDirectoryControls();
    initHistoryControls();
    initInterventionForm();
    
    // Initial data load
    loadExecutiveOverview();
    loadStudentDirectory();
    loadAdvisorQueue();
    loadActionHistory();
    loadEngineAnalytics();

    // Set today's date in header
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const today = new Date();
        dateEl.textContent = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // -------------------------------------------------------------------------
    // Navigation Tabs
    // -------------------------------------------------------------------------
    function initNavigation() {
        const navButtons = document.querySelectorAll('.nav-item');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                if (!targetId) return;

                // Update active nav button
                navButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Switch visible section
                document.querySelectorAll('.app-section').forEach(sec => sec.classList.add('hidden'));
                const activeSec = document.getElementById(targetId);
                if (activeSec) {
                    activeSec.classList.remove('hidden');
                }
            });
        });
    }

    // -------------------------------------------------------------------------
    // Toast Notification Utility
    // -------------------------------------------------------------------------
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const iconClass = type === 'success' 
            ? 'fa-solid fa-circle-check' 
            : (type === 'error' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-info');

        toast.innerHTML = `<i class="${iconClass}"></i><span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // -------------------------------------------------------------------------
    // Executive Overview & Chart.js Rendering
    // -------------------------------------------------------------------------
    async function loadExecutiveOverview() {
        try {
            const res = await fetch('/api/metrics');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            // Populate KPI Cards
            const kpi = data.kpi || {};
            setElementText('kpi-total', kpi.total_students ?? '-');
            setElementText('kpi-gpa', kpi.average_gpa !== undefined ? kpi.average_gpa.toFixed(2) : '-');
            setElementText('kpi-attendance', kpi.mean_attendance !== undefined ? `${kpi.mean_attendance}%` : '-');
            setElementText('kpi-high', kpi.high_risk ?? '-');
            setElementText('kpi-med', kpi.medium_risk ?? '-');
            setElementText('kpi-interv', kpi.action_queue_size ?? '-');

            // Render Charts
            renderRiskDistributionChart(data.risk_distribution || {});
            renderGpaDistributionChart(data.gpa_distribution || {});
            renderScatterChart(data.scatter_points || []);
        } catch (err) {
            console.error('Failed to load executive overview:', err);
            showToast('Failed to load real-time metrics.', 'error');
        }
    }

    function renderRiskDistributionChart(dist) {
        const ctx = document.getElementById('chart-risk-dist');
        if (!ctx) return;
        if (state.charts.riskDist) state.charts.riskDist.destroy();

        state.charts.riskDist = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Low Risk', 'Medium Risk', 'High Risk'],
                datasets: [{
                    data: [dist.Low || 0, dist.Medium || 0, dist.High || 0],
                    backgroundColor: [colors.low, colors.med, colors.high],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                },
                cutout: '65%'
            }
        });
    }

    function renderGpaDistributionChart(bins) {
        const ctx = document.getElementById('chart-gpa-dist');
        if (!ctx) return;
        if (state.charts.gpaDist) state.charts.gpaDist.destroy();

        state.charts.gpaDist = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(bins),
                datasets: [{
                    label: 'Students Count',
                    data: Object.values(bins),
                    backgroundColor: colors.violet,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    function renderScatterChart(points) {
        const ctx = document.getElementById('chart-scatter');
        if (!ctx) return;
        if (state.charts.scatter) state.charts.scatter.destroy();

        const datasets = [
            {
                label: 'High Risk',
                data: points.filter(p => p.risk === 'High').map(p => ({ x: p.x, y: p.y, id: p.id })),
                backgroundColor: colors.high
            },
            {
                label: 'Medium Risk',
                data: points.filter(p => p.risk === 'Medium').map(p => ({ x: p.x, y: p.y, id: p.id })),
                backgroundColor: colors.med
            },
            {
                label: 'Low Risk',
                data: points.filter(p => p.risk === 'Low').map(p => ({ x: p.x, y: p.y, id: p.id })),
                backgroundColor: colors.low
            }
        ];

        state.charts.scatter = new Chart(ctx, {
            type: 'scatter',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `Student #${ctx.raw.id}: GPA ${ctx.raw.y}, Attendance ${ctx.raw.x}%`
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Class Attendance Rate (%)' },
                        min: 50,
                        max: 100
                    },
                    y: {
                        title: { display: true, text: 'Cumulative GPA' },
                        min: 1.8,
                        max: 4.0
                    }
                }
            }
        });
    }

    // -------------------------------------------------------------------------
    // Student Directory & Pagination
    // -------------------------------------------------------------------------
    function initDirectoryControls() {
        const searchInput = document.getElementById('dir-search');
        const riskSelect = document.getElementById('dir-risk-filter');
        const sortBySelect = document.getElementById('dir-sort-by');
        const sortOrderSelect = document.getElementById('dir-sort-order');
        const prevBtn = document.getElementById('btn-prev-page');
        const nextBtn = document.getElementById('btn-next-page');

        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    state.searchQuery = e.target.value;
                    state.currentPage = 1;
                    loadStudentDirectory();
                }, 300);
            });
        }

        if (riskSelect) {
            riskSelect.addEventListener('change', (e) => {
                state.riskFilter = e.target.value;
                state.currentPage = 1;
                loadStudentDirectory();
            });
        }

        if (sortBySelect) {
            sortBySelect.addEventListener('change', (e) => {
                state.sortBy = e.target.value;
                loadStudentDirectory();
            });
        }

        if (sortOrderSelect) {
            sortOrderSelect.addEventListener('change', (e) => {
                state.sortOrder = e.target.value;
                loadStudentDirectory();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (state.currentPage > 1) {
                    state.currentPage--;
                    loadStudentDirectory();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                state.currentPage++;
                loadStudentDirectory();
            });
        }
    }

    async function loadStudentDirectory() {
        const tbody = document.getElementById('directory-table-body');
        if (!tbody) return;

        try {
            const params = new URLSearchParams({
                page: state.currentPage,
                limit: state.limit,
                search: state.searchQuery,
                risk: state.riskFilter,
                sort_by: state.sortBy,
                sort_order: state.sortOrder
            });

            const res = await fetch(`/api/students?${params.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            tbody.innerHTML = '';
            if (!data.students || data.students.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 24px; color: var(--text-muted);">No matching student records found.</td></tr>`;
                updatePaginationStats(0, 0, 1, 1);
                return;
            }

            data.students.forEach(st => {
                const tr = document.createElement('tr');
                const badgeClass = st.risk_level === 'High' ? 'badge-high' : (st.risk_level === 'Medium' ? 'badge-med' : 'badge-low');
                
                tr.innerHTML = `
                    <td><strong>#${st.student_id}</strong></td>
                    <td><span class="badge ${badgeClass}">${st.risk_level.toUpperCase()}</span></td>
                    <td><strong>${st.risk_probability}%</strong></td>
                    <td>${st.gpa.toFixed(2)}</td>
                    <td>${st.attendance.toFixed(1)}%</td>
                    <td>${st.lms_logins}</td>
                    <td>${st.system_interactions}</td>
                    <td>
                        <div class="action-row-buttons">
                            <button class="btn btn-secondary btn-sm btn-view-profile" data-id="${st.student_id}">
                                <i class="fa-solid fa-eye"></i> View
                            </button>
                            <button class="btn btn-primary btn-sm btn-open-intervene" data-id="${st.student_id}">
                                <i class="fa-solid fa-hand-holding-hand"></i> Act
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Bind click handlers to newly created action buttons
            tbody.querySelectorAll('.btn-view-profile').forEach(b => {
                b.addEventListener('click', () => openStudentProfileModal(b.getAttribute('data-id')));
            });

            tbody.querySelectorAll('.btn-open-intervene').forEach(b => {
                b.addEventListener('click', () => openInterventionModal(b.getAttribute('data-id')));
            });

            updatePaginationStats(data.students.length, data.total, data.page, data.total_pages);
        } catch (err) {
            console.error('Failed to load directory:', err);
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px; color: #e76f51;">Error retrieving students directory.</td></tr>`;
        }
    }

    function updatePaginationStats(shown, total, page, totalPages) {
        setElementText('pagination-stats', `Page ${page} of ${totalPages} (${total} total students)`);
        setElementText('current-page-num', page);

        const prevBtn = document.getElementById('btn-prev-page');
        const nextBtn = document.getElementById('btn-next-page');

        if (prevBtn) prevBtn.disabled = (page <= 1);
        if (nextBtn) nextBtn.disabled = (page >= totalPages);
    }

    // -------------------------------------------------------------------------
    // Advisor Priority Queue
    // -------------------------------------------------------------------------
    async function loadAdvisorQueue() {
        const tbody = document.getElementById('queue-table-body');
        if (!tbody) return;

        try {
            const res = await fetch('/api/queue');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            tbody.innerHTML = '';
            const queue = data.queue || [];
            if (queue.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px;">No critical intervention queue items at this time.</td></tr>`;
                return;
            }

            queue.forEach(item => {
                const tr = document.createElement('tr');
                const pClass = item.priority_weight === 'CRITICAL' 
                    ? 'priority-critical' 
                    : (item.priority_weight === 'HIGH' ? 'priority-high' : 'priority-elevated');
                
                const badgeClass = item.risk_level === 'High' ? 'badge-high' : 'badge-med';

                const indicatorTags = item.indicators.map(ind => {
                    const tagClass = ind.includes('Sub-2.5') || ind.includes('Absenteeism') ? '' : 'tag-warning';
                    return `<span class="indicator-tag ${tagClass}">${ind}</span>`;
                }).join(' ');

                tr.innerHTML = `
                    <td><span class="priority-pill ${pClass}">${item.priority_weight}</span></td>
                    <td><strong>#${item.student_id}</strong></td>
                    <td><span class="badge ${badgeClass}">${item.risk_level.toUpperCase()}</span></td>
                    <td><strong>${item.risk_probability}%</strong></td>
                    <td>${indicatorTags}</td>
                    <td>
                        <button class="btn btn-primary btn-sm btn-queue-action" data-id="${item.student_id}">
                            <i class="fa-solid fa-clipboard-check"></i> Intervene Now
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            tbody.querySelectorAll('.btn-queue-action').forEach(b => {
                b.addEventListener('click', () => openInterventionModal(b.getAttribute('data-id')));
            });
        } catch (err) {
            console.error('Failed to load queue:', err);
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: #e76f51;">Error loading priority queue.</td></tr>`;
        }
    }

    // -------------------------------------------------------------------------
    // Action History
    // -------------------------------------------------------------------------
    function initHistoryControls() {
        const filterId = document.getElementById('hist-filter-id');
        const filterStatus = document.getElementById('hist-filter-status');

        if (filterId) {
            let timer;
            filterId.addEventListener('input', (e) => {
                clearTimeout(timer);
                timer = setTimeout(() => loadActionHistory(), 300);
            });
        }

        if (filterStatus) {
            filterStatus.addEventListener('change', () => loadActionHistory());
        }
    }

    async function loadActionHistory() {
        const tbody = document.getElementById('history-table-body');
        if (!tbody) return;

        const idVal = document.getElementById('hist-filter-id')?.value.trim() || '';
        const statusVal = document.getElementById('hist-filter-status')?.value.trim() || '';

        try {
            const params = new URLSearchParams();
            if (idVal) params.append('student_id', idVal);
            if (statusVal) params.append('status', statusVal);

            const res = await fetch(`/api/history?${params.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            tbody.innerHTML = '';
            const history = data.history || [];
            if (history.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color: var(--text-muted);">No action transactions recorded matching criteria.</td></tr>`;
                return;
            }

            history.forEach(h => {
                const tr = document.createElement('tr');
                const statusBadge = h.status === 'Completed' 
                    ? '<span class="badge badge-low">COMPLETED</span>' 
                    : '<span class="badge badge-med">IN PROGRESS</span>';

                tr.innerHTML = `
                    <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.8rem;">${h.timestamp}</td>
                    <td><strong>#${h.student_id}</strong></td>
                    <td><strong>${h.action_type}</strong></td>
                    <td>${h.advisor}</td>
                    <td>${statusBadge}</td>
                    <td style="font-size: 0.85rem; max-width: 300px;">${h.notes}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (err) {
            console.error('Failed to load history:', err);
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: #e76f51;">Error loading action history.</td></tr>`;
        }
    }

    // -------------------------------------------------------------------------
    // Engine Analytics
    // -------------------------------------------------------------------------
    async function loadEngineAnalytics() {
        try {
            const res = await fetch('/api/analytics');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            setElementText('meta-model', data.model_architecture || 'Ensemble');
            setElementText('meta-accuracy', `${data.accuracy}%`);
            setElementText('meta-precision', `${data.precision}% / ${data.recall}%`);
            setElementText('meta-latency', `${data.inference_latency_ms} ms`);

            const list = document.getElementById('feature-importance-list');
            if (list && data.features) {
                list.innerHTML = '';
                data.features.forEach(f => {
                    const div = document.createElement('div');
                    div.className = 'feature-item metric-row';
                    div.innerHTML = `
                        <div class="metric-label-flex">
                            <span><strong>${f.name}</strong></span>
                            <span>${f.weight.toFixed(1)}% Relative Weight</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" style="width: ${f.weight * 2}%; background-color: var(--color-primary);"></div>
                        </div>
                    `;
                    list.appendChild(div);
                });
            }
        } catch (err) {
            console.error('Failed to load engine analytics:', err);
        }
    }

    // -------------------------------------------------------------------------
    // Modal Management & Intervention Action Submission
    // -------------------------------------------------------------------------
    function initModals() {
        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-close');
                const modal = document.getElementById(target);
                if (modal) modal.classList.add('hidden');
            });
        });

        // Close on backdrop click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.add('hidden');
                }
            });
        });
    }

    async function openStudentProfileModal(studentId) {
        try {
            const res = await fetch(`/api/student/${studentId}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const st = await res.json();

            setElementText('modal-student-id', st.student_id);
            setElementText('modal-risk-prob', `Risk Prob: ${st.risk_probability}%`);
            
            const badge = document.getElementById('modal-risk-badge');
            if (badge) {
                badge.className = `badge ${st.risk_level === 'High' ? 'badge-high' : (st.risk_level === 'Medium' ? 'badge-med' : 'badge-low')}`;
                badge.textContent = `${st.risk_level.toUpperCase()} RISK`;
            }

            // Metrics progress
            setElementText('modal-gpa-val', `${st.gpa.toFixed(2)} / 4.0`);
            const gpaBar = document.getElementById('modal-gpa-bar');
            if (gpaBar) gpaBar.style.width = `${(st.gpa / 4.0) * 100}%`;

            setElementText('modal-att-val', `${st.attendance.toFixed(1)}%`);
            const attBar = document.getElementById('modal-att-bar');
            if (attBar) attBar.style.width = `${st.attendance}%`;

            setElementText('modal-lms-val', `${st.lms_logins} Logins (${st.system_interactions} Interactions)`);
            const lmsBar = document.getElementById('modal-lms-bar');
            if (lmsBar) lmsBar.style.width = `${Math.min(100, (st.lms_logins / 60) * 100)}%`;

            // Indicators
            const indList = document.getElementById('modal-indicators-list');
            if (indList) {
                indList.innerHTML = (st.indicators || []).map(ind => {
                    const tagClass = ind.includes('Nominal') ? 'tag-nominal' : (ind.includes('Sub-2.5') || ind.includes('Absenteeism') ? '' : 'tag-warning');
                    return `<span class="indicator-tag ${tagClass}">${ind}</span>`;
                }).join('');
            }

            // Historical actions
            const histList = document.getElementById('modal-history-list');
            if (histList) {
                if (st.history && st.history.length > 0) {
                    histList.innerHTML = st.history.map(h => `
                        <div style="padding: 8px 12px; background: #f8fafc; border-radius: 6px; margin-bottom: 6px; border: 1px solid var(--border-color);">
                            <strong>${h.action_type}</strong> (${h.timestamp}) - <em>${h.status}</em><br>
                            <span style="color: var(--text-main);">${h.notes}</span>
                        </div>
                    `).join('');
                } else {
                    histList.textContent = 'No prior interventions recorded for this student.';
                }
            }

            // Wire up trigger button inside profile modal
            const triggerBtn = document.getElementById('modal-btn-intervene-trigger');
            if (triggerBtn) {
                triggerBtn.onclick = () => {
                    const modal = document.getElementById('student-detail-modal');
                    if (modal) modal.classList.add('hidden');
                    openInterventionModal(st.student_id);
                };
            }

            const modal = document.getElementById('student-detail-modal');
            if (modal) modal.classList.remove('hidden');
        } catch (err) {
            console.error('Failed to load student diagnostic profile:', err);
            showToast(`Could not load details for student #${studentId}`, 'error');
        }
    }

    function openInterventionModal(studentId) {
        setElementText('interv-target-id', studentId);
        const idInput = document.getElementById('interv-input-id');
        if (idInput) idInput.value = studentId;

        const form = document.getElementById('intervention-form');
        if (form) form.reset();
        if (idInput) idInput.value = studentId;

        const modal = document.getElementById('intervention-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function initInterventionForm() {
        const form = document.getElementById('intervention-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const studentId = document.getElementById('interv-input-id')?.value;
            const actionType = document.getElementById('interv-input-type')?.value;
            const advisor = document.getElementById('interv-input-advisor')?.value;
            const status = document.getElementById('interv-input-status')?.value;
            const notes = document.getElementById('interv-input-notes')?.value;

            if (!studentId) {
                showToast('Target Student ID is missing', 'error');
                return;
            }

            try {
                const res = await fetch('/api/intervene', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        student_id: studentId,
                        action_type: actionType,
                        advisor: advisor,
                        status: status,
                        notes: notes
                    })
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();

                if (data.success) {
                    showToast(`Intervention action recorded for Student #${studentId}!`, 'success');
                    const modal = document.getElementById('intervention-modal');
                    if (modal) modal.classList.add('hidden');
                    
                    // Refresh queues and logs
                    loadAdvisorQueue();
                    loadActionHistory();
                }
            } catch (err) {
                console.error('Failed to commit intervention:', err);
                showToast('Failed to commit intervention action.', 'error');
            }
        });
    }

    // Helper function
    function setElementText(id, text) {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    }
});
