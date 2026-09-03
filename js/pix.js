// Gerador de código PIX "copia e cola" (BR Code / EMV), reutilizável em qualquer página.
// Recebe { chave, nome, cidade, valor } e devolve a string do PIX.
function gerarPixCopiaCola(config) {
    const merchantAccountInfo =
        '00' + '14' + 'br.gov.bcb.pix' +
        '01' + String(config.chave.length).padStart(2, '0') + config.chave;

    const valor = Number(config.valor).toFixed(2);

    // Campo 62: Reference Label (txid) — "***" indica que não há id de transação específico
    const txid = '***';
    const additionalData = '05' + String(txid.length).padStart(2, '0') + txid;

    const payload =
        '00' + '02' + '01' +
        '26' + String(merchantAccountInfo.length).padStart(2, '0') + merchantAccountInfo +
        '52' + '04' + '0000' +
        '53' + '03' + '986' +
        '54' + String(valor.length).padStart(2, '0') + valor +
        '58' + '02' + 'BR' +
        '59' + String(config.nome.length).padStart(2, '0') + config.nome +
        '60' + String(config.cidade.length).padStart(2, '0') + config.cidade +
        '62' + String(additionalData.length).padStart(2, '0') + additionalData;

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
