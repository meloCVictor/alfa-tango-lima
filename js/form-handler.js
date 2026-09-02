// ===== Configurações =====
const CONFIG = {
    PIX_CHAVE: '+5549999191709', // chave PIX tipo telefone
    PIX_NOME: 'VICTOR COSTA MELO',
    PIX_CIDADE: 'ALVORADA',
    VALOR: 29.90,
    WHATSAPP_NUMERO: '5549999191709',
    CURSO_SLUG: 'alvorada', // precisa bater com o slug cadastrado na tabela public.cursos
    GOOGLE_SCRIPT_URL: '' // Deixe vazio até configurar o Google Sheets
};

// ===== Espera o DOM carregar =====
document.addEventListener('DOMContentLoaded', function() {

    // ===== Pega o formulário (é uma div, não <form>, e o botão é type="button") =====
    const form = document.getElementById('form-inscricao');
    const btn = document.getElementById('btn-submit');

    if (!form || !btn) {
        console.error('Formulário #form-inscricao ou botão #btn-submit não encontrado!');
        return;
    }

    // ===== Clique no botão de pagamento =====
    btn.addEventListener('click', async function(e) {
        e.preventDefault();

        console.log('Formulário submetido!'); // Debug

        // Pega os valores
        const nome = document.getElementById('nome').value.trim();
        const email = document.getElementById('email').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const cargo = document.getElementById('cargo').value;
        const senha = document.getElementById('senha').value;

        // Validação simples
        if (!nome || !email || !telefone || !senha) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        if (senha.length < 6) {
            alert('A senha precisa ter no mínimo 6 caracteres.');
            return;
        }

        const dados = {
            nome: nome,
            email: email,
            telefone: telefone,
            cargo: cargo,
            valor: CONFIG.VALOR,
            data: new Date().toISOString()
        };

        // Desabilita o botão
        const textoOriginal = btn.textContent;
        btn.textContent = 'PROCESSANDO...';
        btn.disabled = true;

        // ===== Salva localmente (backup, funciona mesmo sem internet/backend) =====
        salvarLocal(dados);

        // ===== Cria a conta do aluno no Supabase e matricula no curso desta página =====
        if (typeof supabaseClient !== 'undefined') {
            await matricularAlunoNoCurso(email, senha, nome, telefone, cargo);
        }

        // ===== Salva no Netlify Forms (funciona quando publicado no Netlify) =====
        fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                'form-name': 'inscricao',
                nome: dados.nome,
                email: dados.email,
                telefone: dados.telefone,
                cargo: dados.cargo,
                valor: String(dados.valor),
                data: dados.data
            }).toString()
        }).catch(function(err) {
            console.warn('Erro ao salvar no Netlify Forms (não crítico):', err);
        });

        // ===== Tenta salvar no Sheets (se configurado) =====
        if (CONFIG.GOOGLE_SCRIPT_URL) {
            fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            }).catch(function(err) {
                console.warn('Erro ao salvar no Sheets (não crítico):', err);
            });
        }

        // ===== Gera o PIX e abre o modal =====
        try {
            // Gera código PIX
            const pixCode = gerarPixCopiaCola();
            document.getElementById('pix-codigo').textContent = pixCode;

            // Gera QR Code
            const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(pixCode);
            document.getElementById('qr-code').src = qrUrl;

            // Preenche resumo
            document.getElementById('resumo-cadastro').textContent = 
                dados.nome + ' · ' + dados.email + ' · ' + dados.telefone;
            document.getElementById('email-confirmacao').textContent = dados.email;

            // Configura WhatsApp
            const msgWhats = 'Olá! Acabei de me inscrever no curso de Alvorada. Nome: ' + dados.nome + '. Vou enviar o comprovante do PIX:';
            const btnWhats = document.getElementById('btn-whatsapp');
            if (btnWhats) {
                btnWhats.href = 'https://wa.me/' + CONFIG.WHATSAPP_NUMERO + '?text=' + encodeURIComponent(msgWhats);
            }

            // Abre o modal
            const modal = document.getElementById('modal-pix');
            modal.style.display = 'flex';

            console.log('Modal PIX aberto com sucesso!'); // Debug

        } catch (err) {
            console.error('Erro ao gerar PIX:', err);
            alert('Erro ao gerar o PIX. Por favor, tente novamente ou nos chame no WhatsApp.');
        }

        // Reabilita o botão
        btn.textContent = textoOriginal;
        btn.disabled = false;
    });

    // ===== Máscara de telefone =====
    const telInput = document.getElementById('telefone');
    if (telInput) {
        telInput.addEventListener('input', function(e) {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length <= 11) {
                v = v.replace(/(\d{2})(\d)/, '($1) $2');
                if (v.length > 10) v = v.replace(/(\d{5})(\d)/, '$1-$2');
                else if (v.length > 6) v = v.replace(/(\d{4})(\d)/, '$1-$2');
            }
            e.target.value = v;
        });
    }
});

// ===== Cria/loga o aluno no Supabase e cria a matrícula (não liberada) no curso desta página =====
async function matricularAlunoNoCurso(email, senha, nome, telefone, cargo) {
    let session = null;

    const signUpRes = await supabaseClient.auth.signUp({
        email: email,
        password: senha,
        options: { data: { nome: nome, telefone: telefone, cargo: cargo } }
    });

    if (!signUpRes.error) {
        session = signUpRes.data.session;
    } else if (signUpRes.error.message.toLowerCase().includes('already registered')) {
        // Aluno já tem conta (ex.: comprou outro curso antes) — tenta logar com a senha informada
        const signInRes = await supabaseClient.auth.signInWithPassword({ email: email, password: senha });
        if (signInRes.error) {
            console.warn('E-mail já cadastrado com outra senha. Peça para o aluno usar a tela de login.');
            return;
        }
        session = signInRes.data.session;
    } else {
        console.warn('Erro ao criar conta no Supabase (não crítico):', signUpRes.error.message);
        return;
    }

    if (!session) return;

    const { data: curso, error: erroCurso } = await supabaseClient
        .from('cursos')
        .select('id')
        .eq('slug', CONFIG.CURSO_SLUG)
        .single();

    if (erroCurso || !curso) {
        console.warn('Curso não encontrado para o slug "' + CONFIG.CURSO_SLUG + '" (não crítico):', erroCurso);
        return;
    }

    const { error: erroMatricula } = await supabaseClient
        .from('matriculas')
        .upsert(
            { aluno_id: session.user.id, curso_id: curso.id },
            { onConflict: 'aluno_id,curso_id', ignoreDuplicates: true }
        );

    if (erroMatricula) {
        console.warn('Erro ao criar matrícula (não crítico):', erroMatricula.message);
    }
}

// ===== Salva a inscrição no localStorage (backup local) =====
function salvarLocal(dados) {
    try {
        const lista = JSON.parse(localStorage.getItem('inscricoes_alvorada') || '[]');
        lista.push(dados);
        localStorage.setItem('inscricoes_alvorada', JSON.stringify(lista));
    } catch (err) {
        console.warn('Erro ao salvar localmente (não crítico):', err);
    }
}

// ===== Funções do modal (globais) =====
function fecharModalPix() {
    const modal = document.getElementById('modal-pix');
    if (modal) modal.style.display = 'none';
}
function copiarPix() {
    const codigo = document.getElementById('pix-codigo').textContent;
    navigator.clipboard.writeText(codigo).then(function() {
        const btn = event.target;
        const texto = btn.textContent;
        btn.textContent = '✅ COPIADO!';
        btn.style.background = '#22c55e';
        setTimeout(function() {
            btn.textContent = texto;
            btn.style.background = '';
        }, 2000);
    });
}

// ===== Gerar PIX (global) =====
function gerarPixCopiaCola() {
    const merchantAccountInfo =
        '00' + '14' + 'BR.GOV.BCB.PIX' +
        '01' + String(CONFIG.PIX_CHAVE.length).padStart(2, '0') + CONFIG.PIX_CHAVE;

    const valor = CONFIG.VALOR.toFixed(2);

    const payload =
        '00' + '02' + '01' +
        '26' + String(merchantAccountInfo.length).padStart(2, '0') + merchantAccountInfo +
        '52' + '04' + '0000' +
        '53' + '03' + '986' +
        '54' + String(valor.length).padStart(2, '0') + valor +
        '58' + '02' + 'BR' +
        '59' + String(CONFIG.PIX_NOME.length).padStart(2, '0') + CONFIG.PIX_NOME +
        '60' + String(CONFIG.PIX_CIDADE.length).padStart(2, '0') + CONFIG.PIX_CIDADE +
        '62' + '05' + '03***';

    const crc = calcularCRC16(payload + '6304');
    return payload + '6304' + crc;
}

function calcularCRC16(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc <<= 1;
            }
            crc &= 0xFFFF;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
}