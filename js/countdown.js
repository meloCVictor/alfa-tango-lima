// Contagem regressiva até 26/09/2026 às 18:00 (horário de Brasília)
document.addEventListener('DOMContentLoaded', function() {
    const elemento = document.getElementById('countdown');
    if (!elemento) return;

    function atualizarCountdown() {
        const deadline = new Date('2026-09-26T18:00:00-03:00').getTime();
        const now = new Date().getTime();
        const diff = deadline - now;

        if (diff <= 0) {
            elemento.textContent = 'INSCRIÇÕES ENCERRADAS';
            elemento.style.fontSize = '0.7rem';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        elemento.textContent = 
            days + 'd ' + 
            String(hours).padStart(2, '0') + 'h ' + 
            String(minutes).padStart(2, '0') + 'm ' + 
            String(seconds).padStart(2, '0') + 's';
    }

    // Atualiza imediatamente e depois a cada segundo
    atualizarCountdown();
    setInterval(atualizarCountdown, 1000);
});