const Epicycles = (function() {
    const canvas = document.getElementById('epicycleCanvas');
    const ctx = canvas.getContext('2d');
    
    class Circle {
        constructor(radius, phase, frequency, parent = null) {
            this.radius = radius;
            this.phase = phase;
            this.frequency = frequency;
            this.parent = parent;
            this.x = 0;
            this.y = 0;
        }

        update(time, centerX, centerY) {
            if (this.parent) {
                this.x = this.parent.endX;
                this.y = this.parent.endY;
            } else {
                this.x = centerX;
                this.y = centerY;
            }
            this.currentAngle = this.phase + 2 * Math.PI * this.frequency * time;
        }

        get endX() {
            return this.x + this.radius * Math.cos(this.currentAngle);
        }

        get endY() {
            return this.y + this.radius * Math.sin(this.currentAngle);
        }

        render(ctx) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.35)';
            ctx.lineWidth = 1.2;
            ctx.arc(this.x, this.y, Math.abs(this.radius), 0, 2 * Math.PI);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 30, 30, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.endX, this.endY);
            ctx.stroke();
        }
    }

    let points = [];
    let fourierCoeffs = [];
    let circles = [];
    let isAnimating = false;
    let isDrawing = false;
    let time = 0;
    let animFrame = null;
    let centerPos = { x: 0, y: 0 };

    const FIXED_CIRCLES = 35;

    function updatePointCount() {
        const pointCountElement = document.getElementById('pointCount');
        if (pointCountElement) {
            pointCountElement.textContent = points.length;
        }
    }
    
    // Функция для обновления счетчика кругов
    function updateCirclesCount() {
        const circlesCountElement = document.getElementById('epicycleHarmonics');
        if (circlesCountElement) {
            circlesCountElement.textContent = circles.length;
        }
    }

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    function dftComplex(path) {
        const N = path.length;
        const coeffs = [];
        let sumX = 0, sumY = 0;

        for (let p of path) {
            sumX += p.x;
            sumY += p.y;
        }

        centerPos = { x: sumX / N, y: sumY / N };

        for (let k = -Math.floor(N/2); k < Math.floor(N/2); k++) {
            if (k === 0) continue;

            let re = 0, im = 0;

            for (let n = 0; n < N; n++) {
                const angle = (2 * Math.PI * k * n) / N;
                const dx = path[n].x - centerPos.x;
                const dy = path[n].y - centerPos.y;

                re += dx * Math.cos(angle) + dy * Math.sin(angle);
                im += -dx * Math.sin(angle) + dy * Math.cos(angle);
            }

            coeffs.push({
                freq: k,
                amp: Math.sqrt(re*re + im*im) / N,
                phase: Math.atan2(im, re)
            });
        }

        return coeffs.sort((a, b) => b.amp - a.amp);
    }

    function animate() {
        if (!isAnimating) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        Utils.drawGrid(ctx, canvas.width, canvas.height);

        if (points.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = '#3366cc';
            ctx.lineWidth = 3;
            ctx.moveTo(points[0].x, points[0].y);
            for (let p of points) ctx.lineTo(p.x, p.y);
            ctx.closePath();
            ctx.stroke();
        }

        const speed = parseFloat(document.getElementById('speedSlider').value) * 0.01;
        time += speed;

        for (let i = 0; i < circles.length; i++) {
            circles[i].update(time, centerPos.x, centerPos.y);
            circles[i].render(ctx);
        }

        const last = circles[circles.length - 1];
        if (last) {
            ctx.beginPath();
            ctx.fillStyle = '#ff0000';
            ctx.arc(last.endX, last.endY, 3, 0, 2 * Math.PI);
            ctx.fill();
        }

        animFrame = requestAnimationFrame(animate);
    }

    function start() {
        if (points.length < 5) return;

        stop();

        const closedPath = [...points, points[0]];
        const resampled = Utils.resamplePoints(closedPath, 350);

        fourierCoeffs = dftComplex(resampled);

        circles = [];
        let parent = null;

        // Считаем, сколько кругов реально будет создано
        let circlesCreated = 0;
        
        for (let i = 0; i < Math.min(FIXED_CIRCLES, fourierCoeffs.length); i++) {
            const c = fourierCoeffs[i];
            // Пропускаем слишком маленькие круги (шум)
            if (c.amp > 0.5) {
                const circle = new Circle(c.amp, c.phase, c.freq, parent);
                circles.push(circle);
                parent = circle;
                circlesCreated++;
            }
        }
        
        // Если не создалось ни одного круга, создаем хотя бы один самый большой
        if (circlesCreated === 0 && fourierCoeffs.length > 0) {
            const c = fourierCoeffs[0];
            const circle = new Circle(c.amp, c.phase, c.freq, null);
            circles.push(circle);
            circlesCreated = 1;
        }

        // Обновляем счетчик кругов реальным количеством
        updateCirclesCount();

        isAnimating = true;
        time = 0;
        animate();
    }

    function stop() {
        isAnimating = false;
        if (animFrame) cancelAnimationFrame(animFrame);
    }

    function generatePreset(type) {
        stop();
        points = [];

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const size = 120;
        const N = 200;

        if (type === 'circle') {
            for (let i = 0; i < N; i++) {
                const t = (i / N) * 2 * Math.PI;
                points.push({
                    x: cx + size * Math.cos(t),
                    y: cy + size * Math.sin(t)
                });
            }
        }

        if (type === 'square') {
            for (let i = 0; i < N; i++) {
                const t = i / N;
                let x, y;

                if (t < 0.25) {
                    x = cx - size + t * 4 * size;
                    y = cy - size;
                } else if (t < 0.5) {
                    x = cx + size;
                    y = cy - size + (t - 0.25) * 4 * size;
                } else if (t < 0.75) {
                    x = cx + size - (t - 0.5) * 4 * size;
                    y = cy + size;
                } else {
                    x = cx - size;
                    y = cy + size - (t - 0.75) * 4 * size;
                }

                points.push({ x, y });
            }
        }

        if (type === 'triangle') {
            const vertices = [
                { x: cx, y: cy - size },
                { x: cx - size, y: cy + size },
                { x: cx + size, y: cy + size }
            ];

            for (let i = 0; i < 3; i++) {
                const a = vertices[i];
                const b = vertices[(i + 1) % 3];

                for (let j = 0; j < N / 3; j++) {
                    const t = j / (N / 3);
                    points.push({
                        x: a.x + (b.x - a.x) * t,
                        y: a.y + (b.y - a.y) * t
                    });
                }
            }
        }

        if (type === 'star') {
            const spikes = 5;
            const outer = size;
            const inner = size / 2;

            for (let i = 0; i < spikes * 2; i++) {
                const r = i % 2 === 0 ? outer : inner;
                const angle = (i * Math.PI) / spikes;

                points.push({
                    x: cx + r * Math.cos(angle),
                    y: cy + r * Math.sin(angle)
                });
            }
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        Utils.drawGrid(ctx, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.strokeStyle = '#3366cc';
        ctx.lineWidth = 3;

        ctx.moveTo(points[0].x, points[0].y);
        for (let p of points) ctx.lineTo(p.x, p.y);
        ctx.closePath();
        ctx.stroke();

        updatePointCount();
        
        start();
    }

    function init() {
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        
        if (speedSlider && speedValue) {
            speedSlider.min = "0.2";
            speedSlider.max = "1.8";
            speedSlider.value = "1";
            speedValue.textContent = "1.0x";
            
            speedSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                speedValue.textContent = val.toFixed(1) + 'x';
            });
        }
        
        canvas.addEventListener('mousedown', (e) => {
            stop();
            isDrawing = true;
            const pos = getMousePos(e);
            points = [pos];

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            Utils.drawGrid(ctx, canvas.width, canvas.height);
            
            updatePointCount();
            updateCirclesCount(); // Обновляем счетчик кругов (пока 0)
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;

            const pos = getMousePos(e);
            const prev = points[points.length - 1];

            ctx.beginPath();
            ctx.strokeStyle = '#3366cc';
            ctx.lineWidth = 3;
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();

            points.push(pos);
            
            updatePointCount();
        });

        canvas.addEventListener('mouseup', () => {
            isDrawing = false;

            if (points.length > 2) {
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(51, 102, 204, 0.5)';
                ctx.lineWidth = 2;

                ctx.moveTo(points[points.length - 1].x, points[points.length - 1].y);
                ctx.lineTo(points[0].x, points[0].y);
                ctx.stroke();
            }
            
            updatePointCount();
        });

        document.getElementById('startEpicyclesBtn').onclick = start;
        document.getElementById('stopEpicyclesBtn').onclick = stop;

        document.getElementById('clearEpicyclesBtn').onclick = () => {
            stop();
            points = [];
            circles = [];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            Utils.drawGrid(ctx, canvas.width, canvas.height);
            updatePointCount();
            updateCirclesCount(); // Сбрасываем счетчик кругов в 0
        };

        document.querySelectorAll('[data-epicycle]').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.getAttribute('data-epicycle');
                generatePreset(type);
            });
        });

        Utils.drawGrid(ctx, canvas.width, canvas.height);
        updatePointCount();
        updateCirclesCount(); // Начальное значение 0
    }

    return { init };
})();