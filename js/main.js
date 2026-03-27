// Главный файл, который запускает все модули
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем все модули
    SimpleWave.init();
    SquareWave.init();
    DrawWave.init();
    SpiralViews.init();
    Epicycles.init();
    
    // Обновляем отображение счетчиков
    document.getElementById('drawHarmonicSlider').addEventListener('input', (e) => {
        document.getElementById('drawHarmonicCount').textContent = e.target.value;
    });
});