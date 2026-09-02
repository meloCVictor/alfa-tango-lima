// Função serverless (Netlify Functions) que envia e-mails transacionais via Resend.
// A RESEND_API_KEY fica só no servidor (variável de ambiente do Netlify), nunca no front-end.
exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM_EMAIL = process.env.FROM_EMAIL || 'Curso Alvorada <onboarding@resend.dev>';

    if (!RESEND_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'RESEND_API_KEY não configurada no Netlify' }) };
    }

    let payload;
    try {
        payload = JSON.parse(event.body || '{}');
    } catch (err) {
        return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
    }

    const { to, subject, html } = payload;
    if (!to || !subject || !html) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Campos obrigatórios: to, subject, html' }) };
    }

    try {
        const resp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + RESEND_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject: subject, html: html })
        });

        const data = await resp.json();

        if (!resp.ok) {
            return { statusCode: resp.status, body: JSON.stringify(data) };
        }

        return { statusCode: 200, body: JSON.stringify(data) };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};
