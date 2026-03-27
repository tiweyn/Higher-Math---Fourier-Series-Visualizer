const SquareWave = (function() {
    const canvas = document.getElementById('squareWaveCanvas');
    const ctx = canvas.getContext('2d');
    
    function draw(harmonics) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        Utils.drawGrid(ctx, canvas.width, canvas.height);
        
        const centerY = canvas.height / 2;
        
        // Идеальный меандр
        ctx.beginPath();
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        for (let x = 0; x < canvas.width; x++) {
            const t = (x / canvas.width) * 4 * Math.PI;
            let y = centerY + 60 * (Math.sin(t) > 0 ? 1 : -1);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Приближение Фурье
        ctx.beginPath();
        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth = 3;
        
        let maxError = 0;
        for (let x = 0; x < canvas.width; x++) {
            const t = (x / canvas.width) * 4 * Math.PI;
            let sum = 0;
            for (let n = 1; n <= harmonics * 2; n += 2) {
                sum += (4 / (Math.PI * n)) * Math.sin(n * t);
            }
            const y = centerY + 60 * sum;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            
            const ideal = centerY + 60 * (Math.sin(t) > 0 ? 1 : -1);
            maxError = Math.max(maxError, Math.abs(ideal - y));
        }
        ctx.stroke();
    }
    
    function init() {
        document.getElementById('harmonicSlider').addEventListener('input', (e) => {
            const val = e.target.value;
            document.getElementById('harmonicCount').textContent = val;
            document.getElementById('usedHarmonics').textContent = val;
            draw(parseInt(val));
        });
        
        draw(5);
    }
    
    return { init };
})();