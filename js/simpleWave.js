const SimpleWave = (function() {
    const canvas = document.getElementById('simpleWaveCanvas');
    const ctx = canvas.getContext('2d');
    
    function draw(freq1, freq2) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        Utils.drawGrid(ctx, canvas.width, canvas.height, '#ddd');
        
        const centerY = canvas.height / 2;
        const points = [];
        
        for (let x = 0; x < canvas.width; x++) {
            const t = (x / canvas.width) * 4 * Math.PI;
            const y1 = Math.sin(t * freq1) * 40;
            const y2 = Math.sin(t * freq2) * 40;
            const y = centerY + y1 + y2;
            points.push({x, y});
        }
        
        // Исходная волна
        ctx.beginPath();
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        
        // Компонент 1
        ctx.beginPath();
        ctx.strokeStyle = '#ff9999';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        for (let x = 0; x < canvas.width; x++) {
            const t = (x / canvas.width) * 4 * Math.PI;
            const y = centerY + Math.sin(t * freq1) * 40;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Компонент 2
        ctx.beginPath();
        ctx.strokeStyle = '#99cc99';
        ctx.setLineDash([]);
        for (let x = 0; x < canvas.width; x++) {
            const t = (x / canvas.width) * 4 * Math.PI;
            const y = centerY + Math.sin(t * freq2) * 40;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 👇 ОБНОВЛЯЕМ СТАТИСТИКУ
        document.getElementById('simpleWaveFreq1').textContent = freq1;
        document.getElementById('simpleWaveFreq2').textContent = freq2;
    }
    
    function init() {
        // Инициализируем значения при загрузке
        const freq1Slider = document.getElementById('freq1Slider');
        const freq2Slider = document.getElementById('freq2Slider');
        
        freq1Slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById('freq1Value').textContent = val;
            const freq2 = parseFloat(freq2Slider.value);
            draw(val, freq2);
        });
        
        freq2Slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById('freq2Value').textContent = val;
            const freq1 = parseFloat(freq1Slider.value);
            draw(freq1, val);
        });
        
        // Начальная отрисовка
        draw(1, 3);
    }
    
    return { init };
})();