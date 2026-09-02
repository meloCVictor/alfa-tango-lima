document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('btn-login');
    const erroBox = document.getElementById('login-erro');

    function mostrarErro(msg) {
        erroBox.textContent = msg;
        erroBox.style.display = 'block';
    }

    btn.addEventListener('click', async function () {
        const email = document.getElementById('login-email').value.trim();
        const senha = document.getElementById('login-senha').value;

        if (!email || !senha) {
            mostrarErro('Preencha e-mail e senha.');
            return;
        }

        erroBox.style.display = 'none';
        btn.textContent = 'ENTRANDO...';
        btn.disabled = true;

        const { error } = await supabaseClient.auth.signInWithPassword({ email: email, password: senha });

        if (error) {
            mostrarErro('E-mail ou senha inválidos.');
            btn.textContent = 'ENTRAR';
            btn.disabled = false;
            return;
        }

        window.location.href = 'area-do-aluno.html';
    });
});
