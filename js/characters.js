/* ==========================================================================
   MYSTERY ANALYZER // ENGINE 02: CHARACTER DOSSIER & PROFILING (characters.js)
   Syncs with GlobalManuscriptState so text persists across all module popouts.
   ========================================================================== */

const CharactersEngine = {
    render(container) {
        // Pull shared manuscript text from global state (set by analyze or hero upload)
        const initialText = (window.GlobalManuscriptState && window.GlobalManuscriptState.text)
            ? window.GlobalManuscriptState.text
            : '';
        const fileName = (window.GlobalManuscriptState && window.GlobalManuscriptState.fileName)
            ? window.GlobalManuscriptState.fileName
            : '';

        container.innerHTML = `
            <div class="engine-workspace">
                <div class="workspace-header">
                    <div class="header-tag">[ENGINE 02 // CHARACTERS // 人物]</div>
                    <h4>PSYCHOLOGICAL CHARACTER MATRIX &amp; MOTIVE SCANNER</h4>
                    <p>Manuscript text is shared across all modules. Upload or paste here — it will stay available when you open ANALYZE or ANALYTICS too.</p>
                </div>

                <div class="workspace-full-width">
                    <div class="input-controls-row">
                        <label for="charNarrativeInput" class="panel-label">
                            CHARACTER DOSSIER / MANUSCRIPT INPUT:
                            ${fileName ? `<span class="file-loaded-badge">📄 ${fileName}</span>` : ''}
                        </label>

                        <div class="pdf-upload-wrapper">
                            <button class="pdf-upload-btn" type="button">
                                <span>📄 UPLOAD MANUSCRIPT (.PDF, .TXT)</span>
                                <input type="file" id="charPdfFileInput" accept=".pdf,.txt,.md" class="pdf-file-input">
                            </button>
                        </div>
                    </div>

                    <!-- Full-Width Pitch Black Textarea — pre-filled from global state -->
                    <textarea id="charNarrativeInput" class="full-width-textarea" rows="10"
                        placeholder="Paste character descriptions, witness statements, or a full manuscript here. Text is shared with ANALYZE and ANALYTICS popouts.">${initialText}</textarea>

                    <div class="input-controls-row">
                        <div class="action-bar">
                            <button class="btn btn-primary" id="runCharAnalysisBtn">
                                <span>ANALYZE CHARACTERS &amp; MOTIVES</span> ⚡
                            </button>
                            <button class="btn btn-secondary btn-sm" id="loadSampleCharText">LOAD SAMPLE SUSPECTS</button>
                        </div>
                        <span class="file-status-tag" id="charFileStatusTag">
                            ${initialText ? '✓ MANUSCRIPT SYNCED FROM GLOBAL STATE' : 'CONSOLE READY'}
                        </span>
                    </div>

                    <div class="character-dossier-grid" id="charResultsGrid" style="margin-top: 1.5rem;">
                        <div class="placeholder-state" style="grid-column: 1 / -1;">
                            <span class="pulse-dot"></span>
                            <span>AWAITING CHARACTER ANALYSIS EXECUTION...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const runBtn = document.getElementById('runCharAnalysisBtn');
        const sampleBtn = document.getElementById('loadSampleCharText');
        const textarea = document.getElementById('charNarrativeInput');
        const fileInput = document.getElementById('charPdfFileInput');
        const statusTag = document.getElementById('charFileStatusTag');
        const gridPanel = document.getElementById('charResultsGrid');

        // Keep GlobalManuscriptState in sync when user edits the textarea here
        if (textarea) {
            textarea.addEventListener('input', () => {
                if (window.GlobalManuscriptState) {
                    window.GlobalManuscriptState.text = textarea.value;
                }
            });
        }

        // File Upload — load and share to global state
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
                        : 'Manuscript loaded.';

                    textarea.value = cleanText;
                    if (window.GlobalManuscriptState) {
                        window.GlobalManuscriptState.text = cleanText;
                        window.GlobalManuscriptState.fileName = file.name;
                    }
                    if (statusTag) statusTag.innerText = `✓ FILE LOADED & SHARED: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
                };
                reader.readAsText(file);
            });
        }

        // Sample Suspects
        if (sampleBtn && textarea) {
            sampleBtn.addEventListener('click', () => {
                const sample = `[SUSPECT 01: Dr. Arthur Vance]
Director of Advanced Bio-Neural Research. High financial debt. Research project slated for termination. Claims to be in private study room at 21:50.

[SUSPECT 02: Elena Rostova]
Senior Lab Analyst & Key Witness. Discovered unauthorized telemetry access logs. Confirmed present in West Wing hallway at 21:45.

[SUSPECT 03: Officer David Chen]
Head of Facility Security. Off-book payments received via untraceable crypto wallet. CCTV manual loop detected during Substation 04 blackout.`;

                textarea.value = sample;
                if (window.GlobalManuscriptState) {
                    window.GlobalManuscriptState.text = sample;
                }
                if (statusTag) statusTag.innerText = '✓ SAMPLE CASE MX-047 LOADED & SHARED';
            });
        }

        // Run Analysis
        if (runBtn && textarea && gridPanel) {
            runBtn.addEventListener('click', async () => {
                const text = textarea.value.trim();
                if (!text) {
                    alert('Please enter character text or upload a manuscript file.');
                    return;
                }

                // Ensure global state is current
                if (window.GlobalManuscriptState) {
                    window.GlobalManuscriptState.text = text;
                }

                gridPanel.innerHTML = `
                    <div class="loading-state" style="grid-column: 1 / -1;">
                        <div class="spinner"></div>
                        <span>EXTRACTING CHARACTER PROFILES &amp; MOTIVE VECTORS...</span>
                    </div>
                `;

                try {
                    const response = await fetch('/api/characters', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chapters: [text] })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        this.renderDossiers(gridPanel, data);
                        return;
                    }
                } catch (e) {
                    console.log('Characters API offline — local profiler active.');
                }

                // Local fallback profiler — extracts names from text heuristically
                setTimeout(() => {
                    const localChars = this.localExtractCharacters(text);
                    this.renderDossiers(gridPanel, { characters: localChars });
                }, 600);
            });
        }
    },

    // Simple heuristic character extractor for local fallback
    localExtractCharacters(text) {
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 10);

        // Try to detect named sections like [SUSPECT 01: Name]
        const sectionPattern = /\[(?:SUSPECT|CHARACTER|SUBJECT)\s*\d*[:\-–]?\s*([^\]]+)\]/gi;
        const sections = [];
        let match;
        while ((match = sectionPattern.exec(text)) !== null) {
            const name = match[1].trim();
            const start = match.index + match[0].length;
            const nextMatch = sectionPattern.exec(text);
            sectionPattern.lastIndex = match.index + match[0].length; // Reset lookahead
            const excerpt = text.slice(start, start + 300).trim();
            const sentimentScore = this.scoreSentiment(excerpt);
            sections.push({
                name,
                role: this.guessRole(excerpt),
                motive: this.extractMotive(excerpt),
                alibi: this.extractAlibi(excerpt),
                traits: this.extractTraits(excerpt),
                threat: `${sentimentScore}% [${sentimentScore > 75 ? 'CRITICAL SUSPECT' : sentimentScore > 50 ? 'PERSON OF INTEREST' : 'KEY WITNESS'}]`,
                threatClass: sentimentScore > 75 ? 'text-alert-red' : sentimentScore > 50 ? 'text-orange' : 'text-neon-orange'
            });
        }

        if (sections.length > 0) return sections;

        // Fallback: treat each paragraph as a "character"
        return paragraphs.slice(0, 4).map((para, i) => {
            const nameMatch = para.match(/^([A-Z][a-z]+(?: [A-Z][a-z]+)?)/);
            const score = this.scoreSentiment(para);
            return {
                name: nameMatch ? nameMatch[0] : `Subject ${String.fromCharCode(65 + i)}`,
                role: 'Extracted from Manuscript',
                motive: para.slice(0, 120).replace(/\n/g, ' '),
                alibi: 'Under investigation — no explicit alibi detected.',
                traits: ['Manuscript Subject', 'Requires Groq AI for Full Profile'],
                threat: `${score}% [PATTERN DETECTED]`,
                threatClass: score > 65 ? 'text-alert-red' : 'text-orange'
            };
        });
    },

    scoreSentiment(text) {
        const negWords = ['debt', 'threat', 'tampered', 'loop', 'blackout', 'encrypted', 'kill', 'body', 'weapon', 'danger', 'suspect', 'illegal', 'crime', 'fraud', 'bribery', 'corrupt', 'off-book'];
        const words = text.toLowerCase().split(/\W+/);
        const hits = words.filter(w => negWords.includes(w)).length;
        return Math.min(98, 30 + hits * 14);
    },

    guessRole(text) {
        if (/director|chief|head|manager/i.test(text)) return 'Senior Official';
        if (/analyst|researcher|scientist/i.test(text)) return 'Technical Specialist';
        if (/officer|security|guard/i.test(text)) return 'Security Personnel';
        if (/witness|saw|observed/i.test(text)) return 'Key Witness';
        return 'Person of Interest';
    },

    extractMotive(text) {
        const motiveMatch = text.match(/(?:debt|motive|reason|goal|intent)[^.]*\./i);
        return motiveMatch ? motiveMatch[0].trim() : text.slice(0, 100).replace(/\n/g, ' ') + '...';
    },

    extractAlibi(text) {
        const alibiMatch = text.match(/(?:claims|alibi|present|at \d{1,2}:\d{2}|was in)[^.]*\./i);
        return alibiMatch ? alibiMatch[0].trim() : 'No verified alibi statement found.';
    },

    extractTraits(text) {
        const traitMap = {
            'debt': 'Financial Pressure', 'threat': 'Threatening Behavior',
            'tampered': 'Evidence Tampering', 'loop': 'Video Manipulation',
            'encrypted': 'Data Concealment', 'access': 'System Access',
            'crypto': 'Untraceable Funds', 'witness': 'Key Witness',
            'tactical': 'Tactical Mindset', 'secretive': 'Secretive'
        };
        const words = text.toLowerCase().split(/\W+/);
        const found = [...new Set(words.filter(w => traitMap[w]).map(w => traitMap[w]))];
        return found.length > 0 ? found.slice(0, 4) : ['Requires Full Analysis'];
    },

    renderDossiers(container, data) {
        const chars = data.characters || [];
        if (chars.length === 0) {
            container.innerHTML = `<div class="placeholder-state" style="grid-column: 1/-1;"><span>No characters found. Try loading the sample case or uploading a manuscript.</span></div>`;
            return;
        }

        container.innerHTML = `
            <div class="character-selector-list">
                ${chars.map((c, idx) => `
                    <button class="char-tab-btn ${idx === 0 ? 'active' : ''}" data-index="${idx}">
                        <span class="char-role">${c.role}</span>
                        <span class="char-name">${c.name}</span>
                        <span class="char-badge red">${c.threat}</span>
                    </button>
                `).join('')}
            </div>
            <div class="character-profile-view" id="dynCharView">
                ${this.getProfileHtml(chars[0] || {})}
            </div>
        `;

        const btns = container.querySelectorAll('.char-tab-btn');
        const view = container.querySelector('#dynCharView');

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const idx = parseInt(btn.dataset.index);
                if (view && chars[idx]) view.innerHTML = this.getProfileHtml(chars[idx]);
            });
        });
    },

    getProfileHtml(c) {
        return `
            <div class="profile-card">
                <div class="profile-header">
                    <h3>${c.name || 'Subject'}</h3>
                    <span class="profile-role">${c.role || 'Unspecified Role'}</span>
                </div>
                <div class="profile-threat-banner">
                    <span>ASSESSED RISK LEVEL:</span>
                    <strong class="${c.threatClass || 'text-alert-red'}">${c.threat || '85%'}</strong>
                </div>
                <div class="profile-details">
                    <div class="detail-block">
                        <strong>PRIMARY MOTIVE:</strong>
                        <p>${c.motive || 'Under investigation.'}</p>
                    </div>
                    <div class="detail-block">
                        <strong>CLAIMED ALIBI / TIMELINE:</strong>
                        <p>${c.alibi || 'No verified alibi.'}</p>
                    </div>
                    <div class="detail-block">
                        <strong>PSYCHOLOGICAL TRAITS:</strong>
                        <div class="trait-tags">
                            ${(c.traits || ['Analyzed']).map(t => `<span class="trait-tag">${t}</span>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};

window.CharactersEngine = CharactersEngine;
