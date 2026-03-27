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
    }
};