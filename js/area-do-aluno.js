const WHATSAPP_NUMERO = '5549999191709';

document.addEventListener('DOMContentLoaded', async function () {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('btn-sair').addEventListener('click', async function () {
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html';
    });

    const { data: perfil, error: erroPerfil } = await supabaseClient
        .from('profiles')
        .select('nome, liberado')
        .eq('id', session.user.id)
        .single();

    document.getElementById('carregando').style.display = 'none';

    if (erroPerfil || !perfil) {
        console.error('Erro ao carregar perfil:', erroPerfil);
        document.getElementById('aguardando').style.display = 'block';
        return;
    }

    if (!perfil.liberado) {
        const msg = 'Olá! Fiz minha inscrição no curso de Alvorada e já quero enviar o comprovante do PIX.';
        document.getElementById('link-whatsapp-aguardando').href =
            'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(msg);
        document.getElementById('aguardando').style.display = 'block';
        return;
    }

    document.getElementById('saudacao').textContent = 'Bem-vindo(a), ' + (perfil.nome || 'aluno(a)') + '!';

    const { data: modulos, error: erroModulos } = await supabaseClient
        .from('modulos')
        .select('titulo, descricao, link')
        .order('ordem', { ascending: true });

    const lista = document.getElementById('lista-modulos');

    if (erroModulos || !modulos || modulos.length === 0) {
        lista.innerHTML = '<p style="color: var(--cinza-claro);">Nenhum módulo disponível no momento. Volte em breve.</p>';
    } else {
        modulos.forEach(function (modulo) {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML =
                '<h3 style="color: var(--verde-escuro); margin-bottom: 6px;">' + modulo.titulo + '</h3>' +
                (modulo.descricao ? '<p style="color: var(--cinza-claro); font-size: 0.9rem; margin-bottom: 12px;">' + modulo.descricao + '</p>' : '') +
                '<a href="' + modulo.link + '" target="_blank" rel="noopener" class="btn-cta" style="font-size: 0.95rem; padding: 10px 24px;">ASSISTIR AULA →</a>';
            lista.appendChild(card);
        });
    }

    document.getElementById('liberado').style.display = 'block';
});
