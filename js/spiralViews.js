const SpiralViews = (function() {
    const sideCanvas = document.getElementById('sideViewCanvas');
    const sideCtx = sideCanvas.getContext('2d');
    const frontCanvas = document.getElementById('frontViewCanvas');
    const frontCtx = frontCanvas.getContext('2d');
    
    function draw() {
        // Вид сбоку
        sideCtx.clearRect(0, 0, sideCanvas.width, sideCanvas.height);
        Utils.drawGrid(sideCtx, sideCanvas.width, sideCanvas.height, '#ddd');
        
        const centerY = sideCanvas.height/2;
        sideCtx.beginPath();
        sideCtx.strokeStyle = '#667eea';
        sideCtx.lineWidth = 2;
        for (let x = 0; x < sideCanvas.width; x++) {
            const t = (x / sideCanvas.width) * 4 * Math.PI;
            const y = centerY + 40 * Math.sin(t);
            if (x === 0) sideCtx.moveTo(x, y);
            else sideCtx.lineTo(x, y);
        }
        sideCtx.stroke();
        
        // Вид спереди
        frontCtx.clearRect(0, 0, frontCanvas.width, frontCanvas.height);
        Utils.drawGrid(frontCtx, frontCanvas.width, frontCanvas.height, '#ddd');
        
        const centerX = frontCanvas.width/2;
        const centerYfront = frontCanvas.height/2;
        frontCtx.beginPath();
        frontCtx.strokeStyle = '#667eea';
        frontCtx.lineWidth = 2;
        frontCtx.arc(centerX, centerYfront, 50, 0, 2*Math.PI);
        frontCtx.stroke();
        
        frontCtx.beginPath();
        frontCtx.strokeStyle = '#ff4757';
        frontCtx.lineWidth = 1.5;
        frontCtx.moveTo(centerX, centerYfront);
        frontCtx.lineTo(centerX + 50, centerYfront);
        frontCtx.stroke();
    }
    
    function init() {
        draw();
    }
    
    return { init };
})();