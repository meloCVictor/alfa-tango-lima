// Botão flutuante "voltar ao topo" (aparece após rolar a página)
document.addEventListener('DOMContentLoaded', function () {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-voltar-topo';
    btn.setAttribute('aria-label', 'Voltar ao topo');
    btn.textContent = '↑';
    document.body.appendChild(btn);

    window.addEventListener('scroll', function () {
        btn.classList.toggle('visivel', window.scrollY > 500);
    });

    btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
