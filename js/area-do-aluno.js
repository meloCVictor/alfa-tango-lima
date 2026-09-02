const WHATSAPP_NUMERO = '5549999191709';

// Converte um link do Google Drive (view/share) para o formato de embed em iframe
function driveEmbedUrl(link) {
    const match = link.match(/\/d\/([a-zA-Z0-9_-]+)/) || link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const id = match ? match[1] : null;
    return id ? 'https://drive.google.com/file/d/' + id + '/preview' : null;
}

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

    const { data: perfil } = await supabaseClient
        .from('profiles')
        .select('nome')
        .eq('id', session.user.id)
        .single();

    const { data: matriculas, error: erroMatriculas } = await supabaseClient
        .from('matriculas')
        .select('liberado, cursos(id, nome)')
        .eq('aluno_id', session.user.id);

    document.getElementById('carregando').style.display = 'none';

    if (erroMatriculas || !matriculas || matriculas.length === 0) {
        const msg = 'Olá! Fiz minha inscrição no curso de Alvorada e já quero enviar o comprovante do PIX.';
        document.getElementById('link-whatsapp-aguardando').href =
            'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(msg);
        document.getElementById('aguardando').style.display = 'block';
        return;
    }

    const liberadas = matriculas.filter(function (m) { return m.liberado && m.cursos; });

    if (liberadas.length === 0) {
        const msg = 'Olá! Fiz minha inscrição no curso de Alvorada e já quero enviar o comprovante do PIX.';
        document.getElementById('link-whatsapp-aguardando').href =
            'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(msg);
        document.getElementById('aguardando').style.display = 'block';
        return;
    }

    document.getElementById('saudacao').textContent = 'Bem-vindo(a), ' + (perfil && perfil.nome || 'aluno(a)') + '!';

    const lista = document.getElementById('lista-modulos');
    lista.innerHTML = '';

    for (const matricula of liberadas) {
        const cursoTitulo = document.createElement('h2');
        cursoTitulo.style.cssText = 'font-size: 1.2rem; color: var(--verde-principal); margin-top: 24px;';
        cursoTitulo.textContent = matricula.cursos.nome;
        lista.appendChild(cursoTitulo);

        const { data: modulos, error: erroModulos } = await supabaseClient
            .from('modulos')
            .select('titulo, descricao, link')
            .eq('curso_id', matricula.cursos.id)
            .order('ordem', { ascending: true });

        if (erroModulos || !modulos || modulos.length === 0) {
            const vazio = document.createElement('p');
            vazio.style.color = 'var(--cinza-claro)';
            vazio.textContent = 'Nenhum módulo disponível no momento. Volte em breve.';
            lista.appendChild(vazio);
            continue;
        }

        modulos.forEach(function (modulo) {
            const embedUrl = driveEmbedUrl(modulo.link);
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML =
                '<h3 style="color: var(--verde-escuro); margin-bottom: 6px;">' + modulo.titulo + '</h3>' +
                (modulo.descricao ? '<p style="color: var(--cinza-claro); font-size: 0.9rem; margin-bottom: 12px;">' + modulo.descricao + '</p>' : '') +
                (embedUrl
                    ? '<div style="position: relative; padding-top: 56.25%; border-radius: 10px; overflow: hidden; background: #000;">' +
                        '<iframe src="' + embedUrl + '" allow="autoplay" allowfullscreen ' +
                        'style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"></iframe>' +
                      '</div>'
                    : '<a href="' + modulo.link + '" target="_blank" rel="noopener" class="btn-cta" style="font-size: 0.95rem; padding: 10px 24px;">ASSISTIR AULA →</a>');
            lista.appendChild(card);
        });
    }

    document.getElementById('liberado').style.display = 'block';
});

