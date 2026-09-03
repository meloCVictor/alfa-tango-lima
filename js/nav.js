// Menu hamburguer responsivo (funciona em qualquer header que use .nav-toggle / .nav-links)
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.nav-toggle').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const target = document.getElementById(btn.getAttribute('data-target'));
            if (target) target.classList.toggle('open');
        });
    });
});
