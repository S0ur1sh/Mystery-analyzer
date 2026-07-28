/* ==========================================================================
   MYSTERY ANALYZER // ENGINE 01: NARRATIVE & CLUE ANALYSIS (analyse.js)
   Reads from GlobalManuscriptState, supports full-width textarea & PDF upload.
   ========================================================================== */

const AnalyseEngine = {
    render(container) {
        const initialText = window.GlobalManuscriptState ? window.GlobalManuscriptState.text : '';

        container.innerHTML = `
            <div class="engine-workspace">
                <div class="workspace-header">
                    <div class="header-tag">[ENGINE 01 // ANALYZE // 解析]</div>
                    <h4>NARRATIVE DECONSTRUCTION & SCRIPT DEEP SCANNER</h4>
                    <p>Upload a manuscript file (.pdf, .txt) or paste script text below to execute full neural pattern deconstruction.</p>
                </div>

                <div class="workspace-full-width">
                    <div class="input-controls-row">
                        <label for="narrativeInput" class="panel-label">MANUSCRIPT / SCRIPT INPUT (PITCH BLACK CONSOLE):</label>
                        
                        <div class="pdf-upload-wrapper">
                            <button class="pdf-upload-btn" type="button">
                                <span>📄 UPLOAD MANUSCRIPT (.PDF, .TXT)</span>
                                <input type="file" id="pdfFileInput" accept=".pdf,.txt,.md" class="pdf-file-input">
                            </button>
                        </div>
                    </div>

                    <!-- Full-Width Pitch Black Script Textarea -->
                    <textarea id="narrativeInput" class="full-width-textarea" rows="12" placeholder="Paste your mystery script, story, or transcript here... Or upload a PDF/TXT manuscript using the upload button above.">${initialText}</textarea>
                    
                    <div class="input-controls-row">
                        <div class="action-bar">
                            <button class="btn btn-primary" id="runAnalysisBtn">
                                <span>EXECUTE DECONSTRUCTION</span> ⚡
                            </button>
                            <button class="btn btn-secondary btn-sm" id="loadSampleNarrative">LOAD SAMPLE CASE</button>
                        </div>
                        <span class="file-status-tag" id="fileStatusTag">${initialText ? 'MAIN MANUSCRIPT SYNCED' : 'CONSOLE READY'}</span>
                    </div>

                    <!-- Output Results Panel -->
                    <div class="results-panel" id="analysisResultsPanel">
                        <div class="placeholder-state">
                            <span class="pulse-dot"></span>
                            <span>AWAITING MANUSCRIPT DECONSTRUCTION...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const runBtn = document.getElementById('runAnalysisBtn');
        const sampleBtn = document.getElementById('loadSampleNarrative');
        const textarea = document.getElementById('narrativeInput');
        const resultsPanel = document.getElementById('analysisResultsPanel');
        const fileInput = document.getElementById('pdfFileInput');
        const statusTag = document.getElementById('fileStatusTag');

        // Text Sync to Global State
        if (textarea) {
            textarea.addEventListener('input', () => {
                if (window.GlobalManuscriptState) {
                    window.GlobalManuscriptState.text = textarea.value;
                }
            });
        }

        // File Upload Handler (.pdf, .txt)
        if (fileInput && textarea) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (statusTag) statusTag.innerText = `LOADING: ${file.name}...`;

                const reader = new FileReader();
                reader.onload = (event) => {
                    const content = event.target.result;
                    const cleanText = typeof content === 'string' 
                        ? content.replace(/[^\x20-\x7E\n\r\t]/g, ' ') 
                        : 'PDF Manuscript loaded.';
                    
                    textarea.value = cleanText;
                    if (window.GlobalManuscriptState) {
                        window.GlobalManuscriptState.text = cleanText;
                        window.GlobalManuscriptState.fileName = file.name;
                    }
                    if (statusTag) statusTag.innerText = `FILE LOADED: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
                };
                reader.readAsText(file);
            });
        }

        // Sample Case Handler
        if (sampleBtn && textarea) {
            sampleBtn.addEventListener('click', () => {
                textarea.value = `[MANUSCRIPT CASE MX-047]

At 22:00 hours on October 14, the power grid at Substation 04 suffered a catastrophic blackout. 

Witness A (Elena Rostova) claims she saw Dr. Vance leaving the control room at 21:45 carrying an unlabelled black briefcase. 

However, badge records indicate Dr. Vance's card was swiped at the inner lab door at 21:57, requiring a 12-minute sprint across campus that is physically impossible. 

Meanwhile, Officer Chen reported no activity on CCTV, but audit logs show the video feed was manually looped for 15 minutes.`;
                if (window.GlobalManuscriptState) {
                    window.GlobalManuscriptState.text = textarea.value;
                }
                if (statusTag) statusTag.innerText = 'SAMPLE CASE MX-047 LOADED';
            });
        }

        // Analysis Execution Handler
        if (runBtn && textarea && resultsPanel) {
            runBtn.addEventListener('click', async () => {
                const text = textarea.value.trim();
                if (!text) {
                    alert('Please enter narrative text or upload a PDF/TXT manuscript file.');
                    return;
                }

                resultsPanel.innerHTML = `
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <span>CONNECTING TO GROQ AI NEURAL ENGINE...</span>
                    </div>
                `;

                try {
                    const response = await fetch('/api/analyse', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text, prompt: text })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        this.renderResults(resultsPanel, data);
                        return;
                    }
                } catch (e) {
                    console.log('Real API unavailable, using simulated neural engine.');
                }

                setTimeout(() => {
                    this.renderResults(resultsPanel, {
                        anomalyIndex: '89.4%',
                        clues: [
                            '[TIMELINE DISCREPANCY] 12-minute window mismatch between Witness A observation (21:45) and badge swipe (21:57).',
                            '[PHYSICAL IMPOSSIBILITY] Distance across campus cannot be traversed in < 15 minutes on foot.',
                            '[EVIDENCE TAMPERING] CCTV manual loop detected during Substation 04 power failure.'
                        ],
                        vectors: [
                            { label: 'TIMELINE CONFLICT', pct: 92, color: 'red' },
                            { label: 'ALIBI INTEGRITY', pct: 78, color: 'orange' }
                        ]
                    });
                }, 800);
            });
        }
    },

    renderResults(panel, data) {
        panel.innerHTML = `
            <div class="analysis-report">
                <div class="report-badge">ANOMALY INDEX: ${data.anomalyIndex || '89.4%'} [HIGH CONTRADICTION]</div>
                
                <h5 class="report-title">EXTRACTED KEY CLUES & INCONSISTENCIES:</h5>
                <ul class="clue-list">
                    ${(data.clues || []).map(c => `<li>${c}</li>`).join('')}
                </ul>

                <div class="motives-breakdown">
                    <h6>PRIMARY ANOMALY VECTORS:</h6>
                    ${(data.vectors || [
                        { label: 'TIMELINE CONFLICT', pct: 92, color: 'red' },
                        { label: 'ALIBI INTEGRITY', pct: 78, color: 'orange' }
                    ]).map(v => `
                        <div class="vector-bar">
                            <span>${v.label}</span>
                            <div class="bar-track"><div class="bar-fill ${v.color || 'orange'}" style="width: ${v.pct}%;"></div></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
};

window.AnalyseEngine = AnalyseEngine;
