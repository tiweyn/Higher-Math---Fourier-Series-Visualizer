const DrawWave = (function() {
    const canvas = document.getElementById('drawWaveCanvas');
    const ctx = canvas.getContext('2d');
    const FOURIER_START_Y = 220; // Разделительная линия
    
    let wavePoints = [];
    let isDrawing = false;
    let lastDrawTime = 0;
    const DRAW_THROTTLE = 16;
    
    function computeDFT(signal) {
        const N = signal.length;
        const coeffs = [];
        
        let mean = 0;
        for (let n = 0; n < N; n++) mean += signal[n];
        mean /= N;
        coeffs.push({ re: mean, im: 0, freq: 0, amp: Math.abs(mean) });
        
        for (let k = 1; k < N; k++) {
            let re = 0, im = 0;
            for (let n = 0; n < N; n++) {
                const angle = (2 * Math.PI * k * n) / N;
                re += signal[n] * Math.cos(angle);
                im -= signal[n] * Math.sin(angle);
            }
            re = (2 * re) / N;
            im = (2 * im) / N;
            const amp = Math.sqrt(re*re + im*im);
            coeffs.push({ re, im, freq: k, amp });
        }
        
        return coeffs.sort((a, b) => b.amp - a.amp);
    }
    
    function reconstruct(coeffs, N, harmonicsCount, t) {
        let sum = 0;
        
        for (let i = 0; i < Math.min(harmonicsCount + 1, coeffs.length); i++) {
            const c = coeffs[i];
            if (c.freq === 0) {
                sum += c.re;
            } else {
                const angle = (2 * Math.PI * c.freq * t) / N;
                sum += c.re * Math.cos(angle) + c.im * Math.sin(angle);
            }
        }
        
        return sum;
    }
    
    function drawBackground() {
        // Заливаем верхнюю часть (область рисования) бледно-синим
        ctx.fillStyle = 'rgba(152, 167, 201, 0.23)';
        ctx.fillRect(0, 0, canvas.width, FOURIER_START_Y - 10);
        
        // Заливаем нижнюю часть (область гармоник) бледно-красным
        ctx.fillStyle = 'rgba(217, 61, 61, 0.18)';
        ctx.fillRect(0, FOURIER_START_Y - 5, canvas.width, canvas.height - (FOURIER_START_Y - 5));
    }
    
    function redraw() {
        const now = Date.now();
        if (now - lastDrawTime < DRAW_THROTTLE && wavePoints.length > 0) return;
        lastDrawTime = now;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем фоновые области
        drawBackground();
        
        // Разделительная линия
        ctx.beginPath();
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(0, FOURIER_START_Y - 10);
        ctx.lineTo(canvas.width, FOURIER_START_Y - 10);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Подписи с фоном
        ctx.font = 'bold 12px Arial';
        
        // Подпись для верхней области с бледно-синим фоном
        ctx.fillStyle = '#2c5a7a';
        ctx.fillText('✏️ Оригинал (рисуйте здесь)', 10, 25);
        
        // Подпись для нижней области с бледно-красным фоном
        ctx.fillStyle = '#b54e4e';
        ctx.fillText('📊 Разложение по гармоникам', 10, FOURIER_START_Y + 25);
        
        // Рисуем сетку поверх фона
        Utils.drawGrid(ctx, canvas.width, canvas.height, '#d0d0d0');
        
        if (wavePoints.length < 5) return;
        
        const resampled = Utils.resamplePoints(wavePoints, 200);
        const N = resampled.length;
        const signalY = resampled.map(p => p.y);
        const harmonics = parseInt(document.getElementById('drawHarmonicSlider').value);
        
        const coeffs = computeDFT(signalY);
        
        // Оригинал
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
        
        // Разложение
        for (let h = 1; h <= harmonics; h++) {
            const intensity = 0.3 + (h / harmonics) * 0.7;
            
            ctx.beginPath();
            ctx.strokeStyle = `rgba(220, 60, 60, ${intensity})`;
            ctx.lineWidth = 1.8;
            
            const baseY = FOURIER_START_Y + 30;
            const scale = 0.9;
            
            for (let i = 0; i < N; i++) {
                const t = i;
                const sumY = reconstruct(coeffs, N, h, t);
                const meanY = signalY.reduce((a, b) => a + b, 0) / N;
                const normalizedY = baseY + (sumY - meanY) * scale;
                
                if (i === 0) ctx.moveTo(resampled[i].x, normalizedY);
                else ctx.lineTo(resampled[i].x, normalizedY);
            }
            ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
        
        // Легенда с градиентом
        const legendY = FOURIER_START_Y + 160;
        const legendWidth = 200;
        const legendX = canvas.width - legendWidth - 20;
        
        // Фон для легенды
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(legendX - 5, legendY - 15, legendWidth + 10, 30);
        
        const gradient = ctx.createLinearGradient(legendX, legendY, legendX + legendWidth, legendY);
        gradient.addColorStop(0, 'rgba(220, 60, 60, 0.3)');
        gradient.addColorStop(0.5, 'rgba(220, 60, 60, 0.65)');
        gradient.addColorStop(1, 'rgba(220, 60, 60, 1)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(legendX, legendY - 10, legendWidth, 15);
        
        ctx.font = '10px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText('Меньше гармоник', legendX, legendY - 15);
        ctx.fillText('Больше гармоник', legendX + legendWidth - 70, legendY - 15);
    }
    
    function initCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем фоновые области
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
        ctx.fillText('📊 Разложение по гармоникам', 10, FOURIER_START_Y + 25);
        
        Utils.drawGrid(ctx, canvas.width, canvas.height, '#d0d0d0');
        wavePoints = [];
    }
    
    function init() {
        initCanvas();
        
        // События мыши
        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * scaleX));
            
            const maxY = FOURIER_START_Y - 25;
            const minY = 15;
            let y = Math.max(minY, Math.min(maxY, (e.clientY - rect.top) * scaleY));
            
            wavePoints = [{x, y}];
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
            let y = Math.max(minY, Math.min(maxY, (e.clientY - rect.top) * scaleY));
            
            const lastPoint = wavePoints[wavePoints.length - 1];
            const dist = Math.sqrt((x - lastPoint.x)**2 + (y - lastPoint.y)**2);
            if (dist > 2) {
                wavePoints.push({x, y});
                redraw();
            }
        });
        
        canvas.addEventListener('mouseup', () => isDrawing = false);
        canvas.addEventListener('mouseleave', () => isDrawing = false);
        
        // Кнопки
        document.getElementById('clearWaveBtn').addEventListener('click', () => {
            wavePoints = [];
            initCanvas();
        });
        
        document.querySelectorAll('[data-wave]').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.wave;
                wavePoints = [];
                const centerY = FOURIER_START_Y - 70;
                const steps = 200;
                
                for (let i = 0; i <= steps; i++) {
                    const x = (i / steps) * canvas.width;
                    const t = (i / steps) * 4 * Math.PI;
                    let y = centerY;
                    
                    switch(type) {
                        case 'square':
                            y = centerY + 45 * (Math.sin(t) > 0 ? 1 : -1);
                            break;
                        case 'saw':
                            y = centerY + 45 * (2 * (t / (2*Math.PI) - Math.floor(t / (2*Math.PI))) - 1);
                            break;
                        case 'sine':
                            y = centerY + 45 * Math.sin(t);
                            break;
                        case 'triangle':
                            const tr = 2 * Math.abs(2 * (t/(2*Math.PI) - Math.floor(t/(2*Math.PI) + 0.5))) - 1;
                            y = centerY + 45 * tr;
                            break;
                        case 'noise':
                            y = centerY + 35 * (Math.sin(t) * 0.5 + Math.sin(t * 3) * 0.3 + Math.sin(t * 5) * 0.2);
                            break;
                    }
                    wavePoints.push({x, y});
                }
                redraw();
            });
        });
        
        document.getElementById('drawHarmonicSlider').addEventListener('input', (e) => {
            document.getElementById('drawHarmonicCount').textContent = e.target.value;
            if (wavePoints.length > 0) redraw();
        });
    }
    
    return { init };
})();