/* ==========================================================================
   MYSTERY ANALYZER // ENGINE 04: ANALYTICS DASHBOARD (analytics.js)
   Real NLP from GlobalManuscriptState + live Upstash Redis global stats.
   Sentiment Arc, Readability, Cosine Similarity — all computed on REAL text.
   ========================================================================== */

const AnalyticsEngine = {
    async render(container) {
        // Pull actual manuscript text from the shared global state
        const text = (window.GlobalManuscriptState && window.GlobalManuscriptState.text)
            ? window.GlobalManuscriptState.text
            : '';

        const hasText = text.trim().length > 30;

        // Run all three NLP algorithms on REAL text
        const readability = window.NLPEngine
            ? window.NLPEngine.calculateReadability(text)
            : { readingEase: 0, gradeLevel: 0, asl: 0, ttr: 0, wordCount: 0 };

        const sentimentArc = window.NLPEngine
            ? window.NLPEngine.calculateSentimentArc(text)
            : [];

        const redundancies = window.NLPEngine
            ? window.NLPEngine.detectRedundancies(text)
            : [];

        container.innerHTML = `
            <div class="engine-workspace">
                <div class="workspace-header">
                    <div class="header-tag">[ENGINE 04 // ANALYTICS // 統計]</div>
                    <h4>PATTERN TELEMETRY &amp; NLP ANALYTICS DASHBOARD</h4>
                    <p>Live Upstash Redis global counters &bull; Local Sentiment Arc &bull; Flesch-Kincaid Readability &bull; Vector Cosine Similarity</p>
                    ${!hasText ? `<div class="no-text-warning">⚠ No manuscript loaded — NLP metrics will compute once you paste or upload text in ANALYZE or CHARACTERS.</div>` : `<div class="text-loaded-ok">✓ Manuscript loaded: ${readability.wordCount} words across ${sentimentArc.length} paragraphs</div>`}
                </div>

                <!-- GLOBAL UPSTASH REDIS STATS GRID (5 real counters) -->
                <div class="analytics-global-stats-grid">
                    <div class="global-stat-card">
                        <div class="gstat-icon">🌐</div>
                        <div class="gstat-number" id="statTotalVisits">—</div>
                        <div class="gstat-label">TOTAL VISITS WORLDWIDE</div>
                    </div>
                    <div class="global-stat-card">
                        <div class="gstat-icon">🔍</div>
                        <div class="gstat-number" id="statTotalAnalyses">—</div>
                        <div class="gstat-label">ANALYSES COMPLETED</div>
                    </div>
                    <div class="global-stat-card">
                        <div class="gstat-icon">⚖️</div>
                        <div class="gstat-number" id="statTotalCompares">—</div>
                        <div class="gstat-label">DRAFTS COMPARED</div>
                    </div>
                    <div class="global-stat-card">
                        <div class="gstat-icon">🧠</div>
                        <div class="gstat-number" id="statCharMaps">—</div>
                        <div class="gstat-label">CHARACTER MAPS GENERATED</div>
                    </div>
                    <div class="global-stat-card">
                        <div class="gstat-icon">📈</div>
                        <div class="gstat-number" id="statTensionArcs">—</div>
                        <div class="gstat-label">TENSION ARCS PRODUCED</div>
                    </div>
                </div>

                <!-- READABILITY & COMPLEXITY SCORECARD (real values) -->
                <div class="readability-scorecard-panel">
                    <div class="panel-header-title">LOCAL TEXT READABILITY &amp; COMPLEXITY SCORECARD</div>
                    ${!hasText
                        ? `<div class="empty-nlp-msg">Load a manuscript to compute Flesch-Kincaid metrics.</div>`
                        : `<div class="readability-metrics-grid">
                            <div class="read-card">
                                <span class="read-label">FLESCH READING EASE</span>
                                <strong class="read-val ${readability.readingEase > 60 ? 'text-green' : readability.readingEase > 30 ? 'text-orange' : 'text-alert-red'}">${readability.readingEase} / 100</strong>
                                <span class="read-sub">${readability.readingEase > 70 ? 'Easy Read' : readability.readingEase > 50 ? 'Standard Thriller' : readability.readingEase > 30 ? 'Academic Dense' : 'Very Complex'}</span>
                            </div>
                            <div class="read-card">
                                <span class="read-label">FLESCH-KINCAID GRADE</span>
                                <strong class="read-val text-orange">GRADE ${readability.gradeLevel}</strong>
                                <span class="read-sub">${readability.gradeLevel < 8 ? 'Mass Market / YA' : readability.gradeLevel < 12 ? 'High School Level' : 'Academic / Technical'}</span>
                            </div>
                            <div class="read-card">
                                <span class="read-label">AVG SENTENCE LENGTH</span>
                                <strong class="read-val text-neon-orange">${readability.asl} words</strong>
                                <span class="read-sub">${readability.asl < 15 ? 'Punchy Pacing' : readability.asl < 25 ? 'Moderate Flow' : 'Dense Prose'}</span>
                            </div>
                            <div class="read-card">
                                <span class="read-label">LEXICAL DIVERSITY (TTR)</span>
                                <strong class="read-val ${readability.ttr > 0.7 ? 'text-green' : readability.ttr > 0.5 ? 'text-orange' : 'text-alert-red'}">${(readability.ttr * 100).toFixed(0)}% UNIQUE</strong>
                                <span class="read-sub">${readability.ttr > 0.7 ? 'Rich Vocabulary' : readability.ttr > 0.5 ? 'Average Range' : 'Repetitive Diction'}</span>
                            </div>
                        </div>`
                    }
                </div>

                <!-- SENTIMENT ARC TENSION GRAPH (real SVG computed from actual text) -->
                <div class="analytics-chart-panel">
                    <div class="chart-header">
                        <span>SENTIMENT TENSION ARC — EMOTIONAL PACING PER PARAGRAPH</span>
                        <span class="text-orange">LOCAL VADER-STYLE NLP ENGINE</span>
                    </div>
                    <div class="sentiment-arc-graph-container">
                        <svg class="sentiment-svg-chart" viewBox="0 0 800 200" id="sentimentSvgChart" preserveAspectRatio="none"></svg>
                    </div>
                    <div class="arc-legend">
                        <span class="text-green">▬ LOW TENSION (CALM / EXPOSITION)</span>
                        <span class="text-alert-red">▬ HIGH TENSION (CLIMAX / SUSPENSE)</span>
                    </div>
                </div>

                <!-- COSINE SIMILARITY REDUNDANCY CHECKER (real vector math) -->
                <div class="vector-similarity-panel">
                    <div class="panel-header-title">LOCAL VECTOR COSINE SIMILARITY — REDUNDANCY DETECTOR</div>
                    <div class="vector-results-list" id="vectorResultsList">
                        ${this.renderRedundanciesHtml(redundancies, hasText)}
                    </div>
                </div>
            </div>
        `;

        // Fetch real Upstash Redis stats
        this.fetchGlobalStats();

        // Render sentiment chart with real computed data
        this.renderSentimentChart(sentimentArc, hasText);
    },

    async fetchGlobalStats() {
        const ids = ['statTotalVisits', 'statTotalAnalyses', 'statTotalCompares', 'statCharMaps', 'statTensionArcs'];
        const els = ids.map(id => document.getElementById(id));

        try {
            const res = await fetch('/api/analytics');
            if (res.ok) {
                const d = await res.json();
                // Map API fields to the 5 stat cards (API should return these keys)
                const values = [
                    this.fmt(d.totalVisits || d.visits || d.pageViews),
                    this.fmt(d.totalAnalyses || d.analyses || d.count),
                    this.fmt(d.totalCompares || d.compares || d.comparisons),
                    this.fmt(d.charMaps || d.characters || d.characterMaps),
                    this.fmt(d.tensionArcs || d.sentimentArcs || d.arcs)
                ];
                els.forEach((el, i) => { if (el) el.innerText = values[i]; });
                return;
            }
        } catch (e) {
            console.log('[Analytics] API unreachable — showing "N/A (Deploy to Vercel)"');
        }

        // If API is unreachable (local preview), show honest "not available" message
        els.forEach(el => {
            if (el) {
                el.innerText = 'N/A';
                el.style.fontSize = '1rem';
                el.title = 'Deploy to Vercel with Redis to see live counts';
            }
        });

        // Show tooltip explanation in the grid
        const grid = document.querySelector('.analytics-global-stats-grid');
        if (grid) {
            const note = document.createElement('div');
            note.className = 'redis-offline-note';
            note.innerText = '⚡ Redis stats require Vercel deployment with REDIS_URL & REDIS_TOKEN configured.';
            grid.after(note);
        }
    },

    fmt(n) {
        if (n === undefined || n === null) return 'N/A';
        return Number(n).toLocaleString();
    },

    renderSentimentChart(arc, hasText) {
        const svg = document.getElementById('sentimentSvgChart');
        if (!svg) return;

        if (!hasText || !arc || arc.length === 0) {
            svg.innerHTML = `
                <text x="400" y="90" fill="#64748b" text-anchor="middle" font-family="monospace" font-size="13">
                    No manuscript loaded.
                </text>
                <text x="400" y="115" fill="#64748b" text-anchor="middle" font-family="monospace" font-size="11">
                    Paste or upload text in ANALYZE or CHARACTERS to compute the Tension Arc.
                </text>`;
            return;
        }

        const W = 800, H = 200, PAD = 28;

        // Create smooth path using cubic bezier curves
        const pts = arc.map((pt, i) => ({
            x: PAD + (i / Math.max(1, arc.length - 1)) * (W - 2 * PAD),
            y: H - PAD - (pt.tension / 100) * (H - 2 * PAD),
            tension: pt.tension,
            para: pt.para
        }));

        // Build smooth polyline path
        let pathD = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
            const prev = pts[i - 1];
            const curr = pts[i];
            const cpx = (prev.x + curr.x) / 2;
            pathD += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
        }

        // Filled area under the curve
        const areaD = pathD + ` L ${pts[pts.length - 1].x} ${H - PAD} L ${pts[0].x} ${H - PAD} Z`;

        let svgHtml = `
            <defs>
                <linearGradient id="tensionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#ff1100" stop-opacity="0.5"/>
                    <stop offset="100%" stop-color="#ff1100" stop-opacity="0.02"/>
                </linearGradient>
                <filter id="glowFilter">
                    <feGaussianBlur stdDeviation="2" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
            </defs>

            <!-- Grid lines -->
            <line x1="${PAD}" y1="${PAD}" x2="${W-PAD}" y2="${PAD}" stroke="rgba(255,255,255,0.07)" stroke-dasharray="4 4"/>
            <line x1="${PAD}" y1="${(H/2)}" x2="${W-PAD}" y2="${H/2}" stroke="rgba(255,255,255,0.07)" stroke-dasharray="4 4"/>
            <line x1="${PAD}" y1="${H-PAD}" x2="${W-PAD}" y2="${H-PAD}" stroke="rgba(255,255,255,0.07)" stroke-dasharray="4 4"/>

            <!-- Y-axis labels -->
            <text x="${PAD-4}" y="${PAD+4}" fill="#64748b" font-size="9" font-family="monospace" text-anchor="end">HIGH</text>
            <text x="${PAD-4}" y="${H-PAD+4}" fill="#64748b" font-size="9" font-family="monospace" text-anchor="end">LOW</text>

            <!-- Area fill -->
            <path d="${areaD}" fill="url(#tensionGradient)"/>

            <!-- Curve line with glow -->
            <path d="${pathD}" fill="none" stroke="#ff1100" stroke-width="2.5" filter="url(#glowFilter)"/>
        `;

        // Data points
        pts.forEach(pt => {
            const isHigh = pt.tension > 70;
            const color = isHigh ? '#ff1100' : pt.tension > 45 ? '#ff5500' : '#00ff66';
            svgHtml += `
                <circle cx="${pt.x}" cy="${pt.y}" r="${isHigh ? 5 : 3.5}" fill="${color}" opacity="0.9"/>
            `;
        });

        // Paragraph labels (only if not too many)
        if (pts.length <= 12) {
            pts.forEach(pt => {
                svgHtml += `
                    <text x="${pt.x}" y="${pt.y - 10}" fill="#94a3b8" font-size="9" font-family="monospace" text-anchor="middle">P${pt.para}</text>
                `;
            });
        }

        svg.innerHTML = svgHtml;
    },

    renderRedundanciesHtml(redundancies, hasText) {
        if (!hasText) {
            return `<div class="empty-nlp-msg">Load a manuscript to run the vector cosine similarity check.</div>`;
        }

        if (!redundancies || redundancies.length === 0) {
            return `
                <div class="vector-clean-alert">
                    <span class="text-green">✓ NO HIGH REDUNDANCY DETECTED</span>
                    <span class="text-secondary"> — All paragraphs have Cosine Similarity below the 65% threshold.</span>
                </div>`;
        }

        return redundancies.map(r => `
            <div class="redundancy-item">
                <div class="red-item-header">
                    <span class="text-alert-red">⚠ REDUNDANCY: Para ${r.p1} ↔ Para ${r.p2}</span>
                    <strong class="text-orange">${r.similarity}% COSINE MATCH</strong>
                </div>
                <div class="red-snippets">
                    <div class="snippet-box"><strong>Para ${r.p1}:</strong> "${r.snippet1}"</div>
                    <div class="snippet-box"><strong>Para ${r.p2}:</strong> "${r.snippet2}"</div>
                </div>
            </div>
        `).join('');
    }
};

window.AnalyticsEngine = AnalyticsEngine;
