const DrawWaveByAccuracy = (function() {
    const canvas = document.getElementById('drawAccuracyCanvas');
    const ctx = canvas.getContext('2d');
    const FOURIER_START_Y = 220;

    let wavePoints = [];
    let isDrawing = false;
    let lastDrawTime = 0;
    const DRAW_THROTTLE = 16;

    function harmonicsForTargetR2(signalY, coeffs, targetR2) {
        const maxH = Math.max(0, coeffs.length - 1);
        for (let h = 0; h <= maxH; h++) {
            const r2 = Utils.computeR2(signalY, coeffs, h);
            if (r2 >= targetR2) return { h, r2 };
        }
        const r2 = Utils.computeR2(signalY, coeffs, maxH);
        return { h: maxH, r2 };
    }

    function updateLabels() {
        const targetPct = parseInt(document.getElementById('targetAccuracySlider').value, 10);
        document.getElementById('targetAccuracyValue').textContent = String(targetPct);

        if (wavePoints.length < 5) {
            document.getElementById('achievedAccuracyValue').textContent = '—';
            document.getElementById('usedHarmonicsForAccuracy').textContent = '—';
            return;
        }

        const resampled = Utils.resamplePoints(wavePoints, 200);
        const signalY = resampled.map(p => p.y);
        const coeffs = Utils.computeDFT(signalY);
        const targetR2 = targetPct / 100;
        const { h, r2 } = harmonicsForTargetR2(signalY, coeffs, targetR2);
        document.getElementById('achievedAccuracyValue').textContent = `${Math.round(r2 * 100)}%`;
        document.getElementById('usedHarmonicsForAccuracy').textContent = String(h);
    }

    function drawBackground() {
        ctx.fillStyle = 'rgba(152, 167, 201, 0.23)';
        ctx.fillRect(0, 0, canvas.width, FOURIER_START_Y - 10);
        ctx.fillStyle = 'rgba(217, 61, 61, 0.12)';
        ctx.fillRect(0, FOURIER_START_Y - 5, canvas.width, canvas.height - (FOURIER_START_Y - 5));
    }

    function redraw() {
        const now = Date.now();
        if (now - lastDrawTime < DRAW_THROTTLE && wavePoints.length > 0) return;
        lastDrawTime = now;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();

        ctx.beginPath();
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(0, FOURIER_START_Y - 10);
        ctx.lineTo(canvas.width, FOURIER_START_Y - 10);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#2c5a7a';
        ctx.fillText('✏️ Оригинал (рисуйте здесь)', 10, 25);
        ctx.fillStyle = '#b54e4e';
        ctx.fillText('📈 Приближение под выбранную точность', 10, FOURIER_START_Y + 25);

        Utils.drawGrid(ctx, canvas.width, canvas.height, '#d0d0d0');

        if (wavePoints.length < 5) {
            updateLabels();
            return;
        }

        const resampled = Utils.resamplePoints(wavePoints, 200);
        const N = resampled.length;
        const signalY = resampled.map(p => p.y);
        const coeffs = Utils.computeDFT(signalY);
        const targetPct = parseInt(document.getElementById('targetAccuracySlider').value, 10);
        const { h, r2 } = harmonicsForTargetR2(signalY, coeffs, targetPct / 100);

        const meanY = signalY.reduce((a, b) => a + b, 0) / N;
        const baseY = FOURIER_START_Y + 30;
        const scale = 0.9;

        ctx.beginPath();
        ctx.strokeStyle = '#2c5f8f';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#4a6f9f';
        ctx.shadowBlur = 3;
        ctx.moveTo(resampled[0].x, resampled[0].y);
        for (let i = 1; i < resampled.length; i++) {
            ctx.lineTo(resampled[i].x, resampled[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(44, 95, 143, 0.35)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < N; i++) {
            const y = baseY + (signalY[i] - meanY) * scale;
            if (i === 0) ctx.moveTo(resampled[i].x, y);
            else ctx.lineTo(resampled[i].x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(200, 40, 40, 0.95)';
        ctx.lineWidth = 2.8;
        for (let i = 0; i < N; i++) {
            const sumY = Utils.reconstruct(coeffs, N, h, i);
            const y = baseY + (sumY - meanY) * scale;
            if (i === 0) ctx.moveTo(resampled[i].x, y);
            else ctx.lineTo(resampled[i].x, y);
        }
        ctx.stroke();

        ctx.font = '11px Arial';
        ctx.fillStyle = '#555';
        const capNote =
            r2 < targetPct / 100 - 1e-6
                ? ' (максимум при всех гармониках)'
                : '';
        ctx.fillText(
            `Гармоник: ${h} · Достигнутая точность: ${Math.round(r2 * 100)}%${capNote}`,
            10,
            canvas.height - 12
        );

        updateLabels();
    }

    function initCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        ctx.beginPath();
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(0, FOURIER_START_Y - 10);
        ctx.lineTo(canvas.width, FOURIER_START_Y - 10);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#2c5a7a';
        ctx.fillText('✏️ Оригинал (рисуйте здесь)', 10, 25);
        ctx.fillStyle = '#b54e4e';
        ctx.fillText('📈 Приближение под выбранную точность', 10, FOURIER_START_Y + 25);
        Utils.drawGrid(ctx, canvas.width, canvas.height, '#d0d0d0');
        wavePoints = [];
        updateLabels();
    }

    function init() {
        if (!canvas) return;
        initCanvas();

        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * scaleX));
            const maxY = FOURIER_START_Y - 25;
            const minY = 15;
            const y = Math.max(minY, Math.min(maxY, (e.clientY - rect.top) * scaleY));
            wavePoints = [{ x, y }];
            redraw();
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * scaleX));
            const maxY = FOURIER_START_Y - 25;
            const minY = 15;
            const y = Math.max(minY, Math.min(maxY, (e.clientY - rect.top) * scaleY));
            const lastPoint = wavePoints[wavePoints.length - 1];
            const dist = Math.sqrt((x - lastPoint.x) ** 2 + (y - lastPoint.y) ** 2);
            if (dist > 2) {
                wavePoints.push({ x, y });
                redraw();
            }
        });

        canvas.addEventListener('mouseup', () => { isDrawing = false; });
        canvas.addEventListener('mouseleave', () => { isDrawing = false; });

        document.getElementById('clearAccuracyWaveBtn').addEventListener('click', () => {
            wavePoints = [];
            initCanvas();
        });

        document.querySelectorAll('[data-accuracy-wave]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.accuracyWave;
                wavePoints = [];
                const centerY = FOURIER_START_Y - 70;
                const steps = 200;
                for (let i = 0; i <= steps; i++) {
                    const x = (i / steps) * canvas.width;
                    const t = (i / steps) * 4 * Math.PI;
                    let y = centerY;
                    switch (type) {
                        case 'square':
                            y = centerY + 45 * (Math.sin(t) > 0 ? 1 : -1);
                            break;
                        case 'saw':
                            y = centerY + 45 * (2 * (t / (2 * Math.PI) - Math.floor(t / (2 * Math.PI))) - 1);
                            break;
                        case 'sine':
                            y = centerY + 45 * Math.sin(t);
                            break;
                        case 'triangle': {
                            const tr = 2 * Math.abs(2 * (t / (2 * Math.PI) - Math.floor(t / (2 * Math.PI) + 0.5))) - 1;
                            y = centerY + 45 * tr;
                            break;
                        }
                        case 'noise':
                            y = centerY + 35 * (Math.sin(t) * 0.5 + Math.sin(t * 3) * 0.3 + Math.sin(t * 5) * 0.2);
                            break;
                        default:
                            break;
                    }
                    wavePoints.push({ x, y });
                }
                redraw();
            });
        });

        document.getElementById('targetAccuracySlider').addEventListener('input', () => {
            lastDrawTime = 0;
            if (wavePoints.length > 0) redraw();
            else updateLabels();
        });
    }

    return { init };
})();
