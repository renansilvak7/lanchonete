function respostaJSON(dados, status = 200) {
    return new Response(
        JSON.stringify(dados),
        {
            status,
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === "/api/health") {
            return respostaJSON({
                ok: true,
                service: "lanchonete"
            });
        }

        if (url.pathname === "/api/mercadopago/teste") {
            const token = env.MERCADO_PAGO_ACCESS_TOKEN;

            if (!token) {
                return respostaJSON({
                    ok: false,
                    erro: "Secret do Mercado Pago não configurado"
                }, 500);
            }

            try {
                const resposta = await fetch(
                    "https://api.mercadopago.com/v1/orders?begin_date=2026-09-01T00:00:00Z&end_date=2026-09-15T23:59:59Z",
                    {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

                return respostaJSON({
                    ok: resposta.ok,
                    status: resposta.status,
                    mensagem: resposta.ok
                        ? "Mercado Pago conectado"
                        : "Mercado Pago recusou a requisição"
                }, resposta.ok ? 200 : resposta.status);

            } catch {
                return respostaJSON({
                    ok: false,
                    erro: "Falha ao conectar com o Mercado Pago"
                }, 502);
            }
        }

        if (url.pathname === "/api/mercadopago/criar-pix") {
            if (request.method !== "POST") {
                return respostaJSON({
                    ok: false,
                    erro: "Método não permitido"
                }, 405);
            }

            const token = env.MERCADO_PAGO_ACCESS_TOKEN;

            if (!token) {
                return respostaJSON({
                    ok: false,
                    erro: "Secret do Mercado Pago não configurado"
                }, 500);
            }

            try {
                const corpo = await request.json();

                const valor = Number(corpo.valor);

                if (!Number.isFinite(valor) || valor <= 0) {
                    return respostaJSON({
                        ok: false,
                        erro: "Valor inválido"
                    }, 400);
                }

                const idempotencyKey = crypto.randomUUID();

                const resposta = await fetch(
                    "https://api.mercadopago.com/v1/orders",
                    {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json",
                            "X-Idempotency-Key": idempotencyKey
                        },
                        body: JSON.stringify({
                            type: "online",
                            processing_mode: "automatic",
                            total_amount: valor.toFixed(2),
                            external_reference: corpo.codigo || "TESTE-LANCHESK7",
                            transactions: {
                                payments: [
                                    {
                                        amount: valor.toFixed(2),
                                        payment_method: {
                                            id: "pix",
                                            type: "bank_transfer"
                                        }
                                    }
                                ]
                            }
                        })
                    }
                );

                const dados = await resposta.json();

                if (!resposta.ok) {
                    return respostaJSON({
                        ok: false,
                        status: resposta.status,
                        erro: dados.message || dados.error || "Mercado Pago recusou a criação do Pix"
                    }, resposta.status);
                }

                const pagamento = dados.transactions?.payments?.[0];

                return respostaJSON({
                    ok: true,
                    status: resposta.status,
                    order_id: dados.id || null,
                    status_pedido: dados.status || null,
                    status_pagamento: pagamento?.status || null,
                    qr_code: pagamento?.payment_method?.qr_code || null,
                    qr_code_base64: pagamento?.payment_method?.qr_code_base64 || null,
                    ticket_url: pagamento?.payment_method?.ticket_url || null
                });

            } catch (erro) {
                return respostaJSON({
                    ok: false,
                    erro: "Não foi possível criar o Pix de teste"
                }, 500);
            }
        }

        return env.ASSETS.fetch(request);
    }
};
