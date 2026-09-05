// Contador de urgência: 15 minutos que reinicia ao chegar a zero
document.addEventListener('DOMContentLoaded', function() {
    const elemento = document.getElementById('countdown');
    if (!elemento) return;

    const DURACAO_SEGUNDOS = 15 * 60; // 15 minutos

    // Tenta recuperar tempo restante do sessionStorage (continua entre refreshes)
    let tempoRestante = parseInt(sessionStorage.getItem('countdown_oferta'), 10);
    if (!tempoRestante || isNaN(tempoRestante) || tempoRestante <= 0) {
        tempoRestante = DURACAO_SEGUNDOS;
    }

    function atualizarCountdown() {
        if (tempoRestante <= 0) {
            // Reinicia o timer (mantém a pressão sempre ativa)
            tempoRestante = DURACAO_SEGUNDOS;
            sessionStorage.setItem('countdown_oferta', tempoRestante);
        }

        const minutos = Math.floor(tempoRestante / 60);
        const segundos = tempoRestante % 60;

        elemento.textContent =
            String(minutos).padStart(2, '0') + ':' +
            String(segundos).padStart(2, '0');

        // Alerta visual quando faltam menos de 3 minutos
        if (tempoRestante <= 180) {
            elemento.style.animation = 'pulse-bg 0.4s infinite';
            elemento.style.color = '#ffd700';
        } else {
            elemento.style.animation = 'pulse-bg 1s infinite';
            elemento.style.color = 'white';
        }

        tempoRestante--;
        sessionStorage.setItem('countdown_oferta', tempoRestante);
    }

    atualizarCountdown();
    setInterval(atualizarCountdown, 1000);
});