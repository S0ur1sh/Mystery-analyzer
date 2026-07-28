/* ==========================================================================
   MYSTERY ANALYZER // NERV MAGI MAIN CONTROLLER (main.js)
   Global Manuscript State + Modal Router + Homepage Live Stats Fetch.
   ========================================================================== */

// ─── GLOBAL SHARED MANUSCRIPT STATE ────────────────────────────────────────
// Any module that reads/writes text MUST use this object.
// Analyse, Characters, and Analytics all share it for full continuity.
window.GlobalManuscriptState = {
    text: '',
    fileName: '',
    lastUpdated: null
};

document.addEventListener('DOMContentLoaded', () => {
    initCustomCursor();
    initNavigation();
    initTerminalInteractions();
    initModalRouter();
    initScanlineToggle();
    initNervAudioSynthesizer();
    initMagiVotingSimulator();
    fetchHomepageStats();       // Pull live Upstash Redis stats for homepage counters
    initWaveformBars();         // Animated neural waveform bars in HUD
});

/* ─── 1. CUSTOM CROSSHAIR CURSOR ──────────────────────────────────────────── */
function initCustomCursor() {
    const cursor = document.getElementById('customCursor');
    const dot = document.getElementById('customCursorDot');
    if (!cursor || !dot) return;

    window.addEventListener('mousemove', (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top  = `${e.clientY}px`;
        dot.style.left    = `${e.clientX}px`;
        dot.style.top     = `${e.clientY}px`;
    });

    document.querySelectorAll('a, button, input, .system-card, .subject-item').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.transform  = 'translate(-50%, -50%) scale(1.5) rotate(45deg)';
            cursor.style.borderColor = '#ff1100';
        });
        el.addEventListener('mouseleave', () => {
            cursor.style.transform  = 'translate(-50%, -50%) scale(1) rotate(0deg)';
            cursor.style.borderColor = '#ff5500';
        });
    });
}

/* ─── 2. NAVIGATION & MOBILE MENU ────────────────────────────────────────── */
function initNavigation() {
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const navLinks  = document.getElementById('navLinks');

    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => navLinks.classList.toggle('active'));
    }

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const key = item.dataset.module;
            if (key && window.openModuleModal) {
                e.preventDefault();
                window.openModuleModal(key);
            }
        });
    });
}

/* ─── 3. HOMEPAGE LIVE STATS FETCH ───────────────────────────────────────── */
async function fetchHomepageStats() {
    // IDs matching the 5 stat counters in index.html
    const ids = {
        totalVisits:   'hpStatVisits',
        totalAnalyses: 'hpStatAnalyses',
        totalCompares: 'hpStatCompares',
        charMaps:      'hpStatCharMaps',
        tensionArcs:   'hpStatArcs'
    };

    const els = {};
    Object.entries(ids).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (el) { els[key] = el; el.innerText = '—'; }
    });

    try {
        const res = await fetch('/api/analytics');
        if (res.ok) {
            const d = await res.json();
            const map = {
                totalVisits:   d.totalVisits   || d.visits     || d.pageViews,
                totalAnalyses: d.totalAnalyses || d.analyses   || d.count,
                totalCompares: d.totalCompares || d.compares   || d.comparisons,
                charMaps:      d.charMaps      || d.characters || d.characterMaps,
                tensionArcs:   d.tensionArcs   || d.sentimentArcs || d.arcs
            };
            Object.entries(map).forEach(([key, val]) => {
                if (els[key]) els[key].innerText = val !== undefined ? Number(val).toLocaleString() : 'N/A';
            });
            return;
        }
    } catch (e) {
        console.log('[Homepage Stats] API offline — values not available in local preview.');
    }

    // Honest fallback — don't show fake numbers
    Object.values(els).forEach(el => {
        el.innerText = 'N/A';
        el.title = 'Deploy to Vercel with Redis credentials to see live counts';
    });
}

/* ─── 4. ANIMATED WAVEFORM BARS (HUD VISUALIZER) ─────────────────────────── */
function initWaveformBars() {
    const container = document.getElementById('waveformBars');
    if (!container) return;

    container.innerHTML = '';
    for (let i = 0; i < 18; i++) {
        const bar = document.createElement('div');
        bar.className = 'waveform-bar';
        bar.style.animationDelay = `${(i * 0.07).toFixed(2)}s`;
        bar.style.animationDuration = `${0.8 + Math.random() * 0.6}s`;
        container.appendChild(bar);
    }
}

/* ─── 5. TERMINAL INTERACTIONS (CASE MX-047 DEMO) ────────────────────────── */
function initTerminalInteractions() {
    const slider        = document.getElementById('anomalySensitivity');
    const sensVal       = document.getElementById('sensitivityVal');
    const metricAnomalies = document.getElementById('metricAnomalies');
    const metricConfidence = document.getElementById('metricConfidence');
    const logStream     = document.getElementById('terminalLogStream');
    const subjectItems  = document.querySelectorAll('.subject-item');
    const labels        = ['Very Low', 'Low', 'Medium', 'High', 'Maximum'];

    if (slider && sensVal) {
        slider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            sensVal.innerText = labels[val - 1];
            if (metricAnomalies) metricAnomalies.innerText = `${(val * 2 - 1).toString().padStart(2, '0')} DETECTED`;
            if (metricConfidence) metricConfidence.innerText = `${95 - val * 4}%`;
            if (logStream) {
                const line = document.createElement('div');
                line.className = 'log-line warning';
                line.innerText = `[${new Date().toTimeString().split(' ')[0]}] THRESHOLD LEVEL 0${val}. PATTERN BLUE WAVE UPDATED.`;
                logStream.appendChild(line);
                logStream.scrollTop = logStream.scrollHeight;
            }
        });
    }

    subjectItems.forEach(item => {
        item.addEventListener('click', () => {
            subjectItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            if (logStream) {
                const line = document.createElement('div');
                line.className = 'log-line success';
                line.innerText = `[${new Date().toTimeString().split(' ')[0]}] MAGI DELIBERATING SUBJECT ${item.dataset.subject}. THREAT PROFILE VERIFIED.`;
                logStream.appendChild(line);
                logStream.scrollTop = logStream.scrollHeight;
            }
        });
    });
}

/* ─── 6. MODAL ROUTER ────────────────────────────────────────────────────── */
function initModalRouter() {
    const modal      = document.getElementById('moduleModal');
    const closeBtn   = document.getElementById('modalCloseBtn');
    const closeFooter = document.getElementById('modalCloseFooter');
    const modalTitle = document.getElementById('modalTitle');
    const modalBadge = document.getElementById('modalBadge');
    const modalBody  = document.getElementById('modalBody');

    // Engine configs — looked up at call-time so scripts are guaranteed loaded
    const moduleConfig = {
        analyze:   { title: 'ANALYZE // 特務機関 MAGI-01 PARSER',       badge: 'ENGINE_01', key: 'AnalyseEngine' },
        characters:{ title: 'CHARACTERS // 思考形態 PSYCH MATRIX',      badge: 'ENGINE_02', key: 'CharactersEngine' },
        compare:   { title: 'COMPARE // 比較 DIFFERENTIAL MATRIX',      badge: 'ENGINE_03', key: 'CompareEngine' },
        analytics: { title: 'ANALYTICS // 統計 TELEMETRY DASHBOARD',    badge: 'ENGINE_04', key: 'AnalyticsEngine' }
    };

    window.openModuleModal = function(moduleKey) {
        const cfg = moduleConfig[moduleKey] || moduleConfig.analyze;
        if (!modal || !modalBody) return;

        if (modalTitle) modalTitle.innerText = cfg.title;
        if (modalBadge) modalBadge.innerText = cfg.badge;

        // Look up engine at call-time (not at DOMContentLoaded)
        const engine = window[cfg.key];
        if (engine && typeof engine.render === 'function') {
            engine.render(modalBody);
        } else {
            modalBody.innerHTML = `<div class="placeholder-state"><span>Engine not loaded. Refresh and try again.</span></div>`;
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        modal && modal.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (closeBtn)    closeBtn.addEventListener('click', closeModal);
    if (closeFooter) closeFooter.addEventListener('click', closeModal);

    // Close on backdrop click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Close on Escape
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    document.querySelectorAll('.open-module-btn').forEach(btn => {
        btn.addEventListener('click', () => window.openModuleModal(btn.dataset.module));
    });

    document.getElementById('heroPrimaryCta')?.addEventListener('click', () => window.openModuleModal('analyze'));
    document.getElementById('finalCtaBtn')?.addEventListener('click',    () => window.openModuleModal('analyze'));
}

/* ─── 7. SCANLINE TOGGLE ─────────────────────────────────────────────────── */
function initScanlineToggle() {
    const btn     = document.getElementById('scanlineToggleBtn');
    const overlay = document.querySelector('.scanlines-overlay');
    if (!btn || !overlay) return;

    btn.addEventListener('click', () => {
        overlay.classList.toggle('disabled');
        btn.innerText = overlay.classList.contains('disabled') ? 'ENABLE SCANLINES' : 'TOGGLE SCANLINES';
    });
}

/* ─── 8. NERV AUDIO SYNTHESIZER ──────────────────────────────────────────── */
function initNervAudioSynthesizer() {
    let audioCtx = null;

    function beep(f1 = 880, f2 = 1200, dur = 0.06) {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const t = audioCtx.currentTime;
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.04, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            gain.connect(audioCtx.destination);
            [['sawtooth', f1], ['square', f2]].forEach(([type, freq]) => {
                const osc = audioCtx.createOscillator();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, t);
                osc.connect(gain);
                osc.start(t); osc.stop(t + dur);
            });
        } catch (e) {}
    }

    document.querySelectorAll('button, .nav-item, .system-card').forEach(el => {
        el.addEventListener('click', () => beep(960, 1440, 0.05));
    });
}

/* ─── 9. MAGI SYNC RATE TICKER ───────────────────────────────────────────── */
function initMagiVotingSimulator() {
    setInterval(() => {
        const el = document.getElementById('syncRateVal');
        if (el) el.innerText = `${(99.5 + Math.random() * 0.45).toFixed(1)}%`;
    }, 3000);
}
