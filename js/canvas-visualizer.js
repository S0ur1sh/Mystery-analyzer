/* ==========================================================================
   MYSTERY ANALYZER // NERV TARGET RESOLUTION CANVAS VISUALIZER
   Renders character nodes, hexagonal AT-Field barriers, and sweep radar.
   ========================================================================== */

class HeroVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        this.nodes = [];
        this.scanAngle = 0;
        this.selectedNodeIndex = 0;
        
        this.initCanvas();
        this.createNodes();
        this.initWaveform();
        this.bindEvents();
        this.animate();
    }

    initCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width || 600;
        this.canvas.height = rect.height || 420;
        
        window.addEventListener('resize', () => {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.canvas.width = rect.width || 600;
            this.canvas.height = rect.height || 420;
        });
    }

    createNodes() {
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        this.nodes = [
            { id: 'SUBJECT A', label: 'Dr. Vance', x: cx - 120, y: cy - 60, radius: 18, color: '#ff1100', prob: '87.4%', threat: 'PATTERN RED' },
            { id: 'SUBJECT B', label: 'Elena R.', x: cx + 130, y: cy - 90, radius: 14, color: '#ffaa00', prob: '64.2%', threat: 'PATTERN ORANGE' },
            { id: 'SUBJECT C', label: 'Off. Chen', x: cx + 80, y: cy + 100, radius: 16, color: '#ff1100', prob: '91.8%', threat: 'PATTERN RED' },
            { id: 'TARGET X', label: 'Unknown Alibi', x: cx - 150, y: cy + 80, radius: 12, color: '#00ff66', prob: '42.0%', threat: 'PATTERN GREEN' },
            { id: 'MYSTERY KEY', label: 'Substation 04', x: cx, y: cy - 10, radius: 22, color: '#ff5500', prob: '99.1%', threat: 'PATTERN BLUE' }
        ];
    }

    initWaveform() {
        const barsContainer = document.getElementById('waveformBars');
        if (!barsContainer) return;
        barsContainer.innerHTML = '';
        for (let i = 0; i < 16; i++) {
            const bar = document.createElement('div');
            bar.className = 'waveform-bar';
            bar.style.animationDelay = `${(i * 0.08).toFixed(2)}s`;
            barsContainer.appendChild(bar);
        }
    }

    bindEvents() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            this.nodes.forEach((node, idx) => {
                const dist = Math.hypot(node.x - mouseX, node.y - mouseY);
                if (dist < node.radius + 15) {
                    this.selectedNodeIndex = idx;
                    this.updateHudReadout(node);
                }
            });
        });
    }

    updateHudReadout(node) {
        const nodeEl = document.getElementById('hudSelectedNode');
        const probEl = document.getElementById('hudNodeProb');
        if (nodeEl) nodeEl.innerText = `${node.id} (${node.label})`;
        if (probEl) probEl.innerText = `${node.prob} MATCH [${node.threat}]`;
    }

    drawHexagon(x, y, radius, color) {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const hx = x + radius * Math.cos(angle);
            const hy = y + radius * Math.sin(angle);
            if (i === 0) this.ctx.moveTo(hx, hy);
            else this.ctx.lineTo(hx, hy);
        }
        this.ctx.closePath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
    }

    drawRadarGrid(cx, cy, maxRadius) {
        this.ctx.strokeStyle = 'rgba(255, 17, 0, 0.15)';
        this.ctx.lineWidth = 1;

        for (let r = 40; r <= maxRadius; r += 50) {
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        this.ctx.beginPath();
        this.ctx.moveTo(cx - maxRadius, cy);
        this.ctx.lineTo(cx + maxRadius, cy);
        this.ctx.moveTo(cx, cy - maxRadius);
        this.ctx.lineTo(cx, cy + maxRadius);
        this.ctx.stroke();
    }

    drawSweeper(cx, cy, maxRadius) {
        this.scanAngle += 0.015;
        this.ctx.save();
        this.ctx.translate(cx, cy);

        const gradient = this.ctx.createConicGradient(this.scanAngle, 0, 0);
        gradient.addColorStop(0, 'rgba(255, 17, 0, 0.25)');
        gradient.addColorStop(0.1, 'rgba(255, 17, 0, 0.02)');
        gradient.addColorStop(1, 'transparent');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, maxRadius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawConnections() {
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const n1 = this.nodes[i];
                const n2 = this.nodes[j];

                this.ctx.strokeStyle = 'rgba(255, 85, 0, 0.3)';
                this.ctx.setLineDash([4, 4]);
                this.ctx.beginPath();
                this.ctx.moveTo(n1.x, n1.y);
                this.ctx.lineTo(n2.x, n2.y);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
        }
    }

    drawNodes() {
        this.nodes.forEach((node, idx) => {
            const isSelected = idx === this.selectedNodeIndex;

            // Draw AT-Field Hexagon Shield around active target
            if (isSelected) {
                this.drawHexagon(node.x, node.y, node.radius + 14, '#ff5500');
                this.drawHexagon(node.x, node.y, node.radius + 22, 'rgba(255, 17, 0, 0.4)');
            }

            this.ctx.strokeStyle = isSelected ? '#ff1100' : node.color;
            this.ctx.lineWidth = isSelected ? 2 : 1;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius + (isSelected ? 6 : 3), 0, Math.PI * 2);
            this.ctx.stroke();

            this.ctx.fillStyle = isSelected ? '#ff1100' : 'rgba(14, 17, 23, 0.9)';
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.font = '10px "Share Tech Mono", monospace';
            this.ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
            this.ctx.fillText(node.id, node.x - node.radius, node.y + node.radius + 14);
        });
    }

    updateNodes(characters) {
        if (!characters || characters.length === 0) return;
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        const r  = Math.min(this.canvas.width, this.canvas.height) * 0.30;

        const colorMap  = { protagonist:'#ff1100', antagonist:'#ff6600', supporting:'#ffaa00', mentioned:'#00ff66' };
        const threatMap = { protagonist:'PATTERN RED', antagonist:'PATTERN RED', supporting:'PATTERN ORANGE', mentioned:'PATTERN GREEN' };
        const probMap   = { 'Needs Attention':'91.8%', 'Minor Issues':'64.2%', 'Consistent':'42.0%' };

        this.nodes = characters.slice(0, 6).map((char, i) => {
            const angle = (i / Math.min(characters.length, 6)) * Math.PI * 2 - Math.PI / 2;
            const role  = (char.role || 'mentioned').toLowerCase();
            return {
                id:     'SUBJECT ' + String.fromCharCode(65 + i),
                label:  char.name || 'Unknown',
                x:      cx + r * Math.cos(angle),
                y:      cy + r * Math.sin(angle),
                radius: role === 'protagonist' ? 20 : role === 'antagonist' ? 18 : 14,
                color:  colorMap[role]  || '#ffaa00',
                prob:   probMap[char.status] || '65.0%',
                threat: threatMap[role] || 'PATTERN ORANGE'
            };
        });

        this.selectedNodeIndex = 0;
        if (this.nodes.length > 0) this.updateHudReadout(this.nodes[0]);
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        const maxRadius = Math.min(cx, cy) - 20;

        this.drawRadarGrid(cx, cy, maxRadius);
        this.drawSweeper(cx, cy, maxRadius);
        this.drawConnections();
        this.drawNodes();

        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window._heroVisualizer = new HeroVisualizer('heroVisualCanvas');
});

window.updateVisualizerData = function(characters) {
    if (window._heroVisualizer) {
        window._heroVisualizer.updateNodes(characters);
    }
};
