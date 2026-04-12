// Общие утилиты для всех модулей
const Utils = {
    drawGrid(ctx, width, height, color = '#e0e0e0') {
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        
        // Вертикальные линии
        for (let x = 0; x <= width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // Горизонтальные линии
        for (let y = 0; y <= height; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Оси
        ctx.beginPath();
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.moveTo(0, height/2);
        ctx.lineTo(width, height/2);
        ctx.stroke();
        ctx.moveTo(width/2, 0);
        ctx.lineTo(width/2, height);
        ctx.stroke();
    },

    resamplePoints(points, targetCount = 200) {
        if (points.length < 2) return points;
        
        const totalLength = points.reduce((acc, p, i) => {
            if (i === 0) return 0;
            const prev = points[i-1];
            return acc + Math.sqrt((p.x - prev.x)**2 + (p.y - prev.y)**2);
        }, 0);
        
        if (totalLength === 0) return points;
        
        const step = totalLength / (targetCount - 1);
        const newPoints = [points[0]];
        let currentDist = 0;
        let j = 1;
        
        for (let i = 1; i < points.length && j < targetCount; i++) {
            const prev = points[i-1];
            const curr = points[i];
            const dist = Math.sqrt((curr.x - prev.x)**2 + (curr.y - prev.y)**2);
            
            if (dist === 0) continue;
            
            while (currentDist + dist > j * step && j < targetCount) {
                const ratio = (j * step - currentDist) / dist;
                const x = prev.x + (curr.x - prev.x) * ratio;
                const y = prev.y + (curr.y - prev.y) * ratio;
                newPoints.push({x, y});
                j++;
            }
            currentDist += dist;
        }
        
        while (newPoints.length < targetCount) {
            newPoints.push(points[points.length - 1]);
        }
        
        return newPoints.slice(0, targetCount);
    },

    /** Односторонний спектр вещественного сигнала (без дублирования пар k и N−k). Коэффициенты AC отсортированы по убыванию амплитуды. */
    computeDFT(signal) {
        const N = signal.length;
        let mean = 0;
        for (let n = 0; n < N; n++) mean += signal[n];
        mean /= N;
        const dc = { re: mean, im: 0, freq: 0, amp: Math.abs(mean) };
        const ac = [];

        if (N % 2 === 0) {
            for (let k = 1; k < N / 2; k++) {
                let re = 0, im = 0;
                for (let n = 0; n < N; n++) {
                    const angle = (2 * Math.PI * k * n) / N;
                    re += signal[n] * Math.cos(angle);
                    im -= signal[n] * Math.sin(angle);
                }
                re = (2 * re) / N;
                im = (2 * im) / N;
                ac.push({ re, im, freq: k, amp: Math.sqrt(re * re + im * im) });
            }
            let reNyq = 0;
            for (let n = 0; n < N; n++) {
                reNyq += signal[n] * Math.cos(Math.PI * n);
            }
            reNyq /= N;
            ac.push({ re: reNyq, im: 0, freq: N / 2, amp: Math.abs(reNyq) });
        } else {
            for (let k = 1; k <= (N - 1) / 2; k++) {
                let re = 0, im = 0;
                for (let n = 0; n < N; n++) {
                    const angle = (2 * Math.PI * k * n) / N;
                    re += signal[n] * Math.cos(angle);
                    im -= signal[n] * Math.sin(angle);
                }
                re = (2 * re) / N;
                im = (2 * im) / N;
                ac.push({ re, im, freq: k, amp: Math.sqrt(re * re + im * im) });
            }
        }

        ac.sort((a, b) => b.amp - a.amp);
        return [dc, ...ac];
    },

    reconstruct(coeffs, N, harmonicsCount, t) {
        let sum = 0;
        for (let i = 0; i < Math.min(harmonicsCount + 1, coeffs.length); i++) {
            const c = coeffs[i];
            if (c.freq === 0) {
                sum += c.re;
            } else if (N % 2 === 0 && c.freq === N / 2) {
                sum += c.re * Math.cos(Math.PI * t);
            } else {
                const angle = (2 * Math.PI * c.freq * t) / N;
                sum += c.re * Math.cos(angle) - c.im * Math.sin(angle);
            }
        }
        return sum;
    },

    /** Доля объяснённой дисперсии (R²) для восстановления с заданным числом гармоник (как в визуализаторе рисования). */
    computeR2(signalY, coeffs, harmonicsCount) {
        const N = signalY.length;
        const meanY = signalY.reduce((a, b) => a + b, 0) / N;
        let sse = 0;
        let sst = 0;
        for (let i = 0; i < N; i++) {
            const recon = Utils.reconstruct(coeffs, N, harmonicsCount, i);
            const d = signalY[i] - recon;
            sse += d * d;
            const c = signalY[i] - meanY;
            sst += c * c;
        }
        let r2 = 1;
        if (sst > 1e-12) r2 = 1 - sse / sst;
        return Math.max(0, Math.min(1, r2));
    }
};