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

        // =========================
        // HEALTH
        // =========================
        if (url.pathname === "/api/health") {
            return respostaJSON({
                ok: true,
                service: "lanchonete"
            });
        }

        // =========================
        // TESTAR CONEXÃO MERCADO PAGO
        // =========================
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

        // =========================
        // CRIAR PIX DE TESTE OFICIAL
        // =========================
        if (url.pathname === "/api/mercadopago/criar-pix-teste") {
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
                            external_reference: "L7K-TESTE-PIX",
                            total_amount: "50.00",
                            payer: {
                                email: "test_user_br@testuser.com",
                                first_name: "APRO"
                            },
                            transactions: {
                                payments: [
                                    {
                                        amount: "50.00",
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
                const pagamento = dados.transactions?.payments?.[0];

                if (!resposta.ok) {
                    return respostaJSON({
                        ok: false,
                        status: resposta.status,
                        erro: dados.message ||
                            dados.error ||
                            "Mercado Pago recusou o teste"
                    }, resposta.status);
                }

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

            } catch {
                return respostaJSON({
                    ok: false,
                    erro: "Não foi possível criar o Pix de teste"
                }, 500);
            }
        }

        // =========================
        // VERIFICAR STATUS DA ORDER
        // =========================
        if (url.pathname === "/api/mercadopago/verificar-teste") {
            if (request.method !== "GET") {
                return respostaJSON({
                    ok: false,
                    erro: "Método não permitido"
                }, 405);
            }

            const token = env.MERCADO_PAGO_ACCESS_TOKEN;
            const orderId = url.searchParams.get("order_id");

            if (!token) {
                return respostaJSON({
                    ok: false,
                    erro: "Secret do Mercado Pago não configurado"
                }, 500);
            }

            if (!orderId) {
                return respostaJSON({
                    ok: false,
                    erro: "Informe o order_id"
                }, 400);
            }

            try {
                const resposta = await fetch(
                    `https://api.mercadopago.com/v1/orders/${encodeURIComponent(orderId)}`,
                    {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

                const dados = await resposta.json();
                const pagamento = dados.transactions?.payments?.[0];

                if (!resposta.ok) {
                    return respostaJSON({
                        ok: false,
                        status: resposta.status,
                        erro: dados.message ||
                            dados.error ||
                            "Não foi possível consultar a Order"
                    }, resposta.status);
                }

                return respostaJSON({
                    ok: true,
                    status: resposta.status,
                    order_id: dados.id || null,
                    status_pedido: dados.status || null,
                    status_pagamento: pagamento?.status || null,
                    status_detail: pagamento?.status_detail || null,
                    total_amount: dados.total_amount || null
                });

            } catch {
                return respostaJSON({
                    ok: false,
                    erro: "Não foi possível consultar a Order"
                }, 500);
            }
        }

        // =========================
        // CRIAR PIX REAL
        // =========================
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
                        erro: "Valor do pedido inválido"
                    }, 400);
                }

                const valorFormatado = valor.toFixed(2);
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
                            external_reference: `L7K-${idempotencyKey}`,
                            total_amount: valorFormatado,
                            payer: {
                                email: "test_user_br@testuser.com",
                                first_name: "APRO"
                            },
                            transactions: {
                                payments: [
                                    {
                                        amount: valorFormatado,
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
                const pagamento = dados.transactions?.payments?.[0];

                if (!resposta.ok) {
                    return respostaJSON({
                        ok: false,
                        status: resposta.status,
                        erro: dados.message ||
                            dados.error ||
                            "Mercado Pago recusou a criação do PIX"
                    }, resposta.status);
                }

                return respostaJSON({
                    ok: true,
                    status: resposta.status,
                    order_id: dados.id || null,
                    status_pedido: dados.status || null,
                    status_pagamento: pagamento?.status || null,
                    qr_code: pagamento?.payment_method?.qr_code || null,
                    qr_code_base64: pagamento?.payment_method?.qr_code_base64 || null,
                    ticket_url: pagamento?.payment_method?.ticket_url || null,
                    total_amount: valorFormatado
                });

            } catch {
                return respostaJSON({
                    ok: false,
                    erro: "Não foi possível criar o PIX"
                }, 500);
            }
        }

        // =========================
                // =========================
        // CANCELAR PIX REAL
        // =========================
        if (url.pathname === "/api/mercadopago/cancelar-pix") {
            if (request.method !== "POST") {
                return respostaJSON({
                    ok: false,
                    erro: "Método não permitido"
                }, 405);
            }

            const token =
                env.MERCADO_PAGO_ACCESS_TOKEN;

            if (!token) {
                return respostaJSON({
                    ok: false,
                    erro: "Secret do Mercado Pago não configurado"
                }, 500);
            }

            try {
                const corpo =
                    await request.json();

                const orderId =
                    corpo.order_id;

                if (!orderId) {
                    return respostaJSON({
                        ok: false,
                        erro: "order_id não informado"
                    }, 400);
                }

                const resposta =
                    await fetch(
                        `https://api.mercadopago.com/v1/orders/${encodeURIComponent(orderId)}/cancel`,
                        {
                            method: "POST",
                            headers: {
                                "Authorization":
                                    `Bearer ${token}`,
                                "Content-Type":
                                    "application/json"
                            }
                        }
                    );

                const dados =
                    await resposta.json();

                if (!resposta.ok) {
                    return respostaJSON({
                        ok: false,
                        status: resposta.status,
                        erro:
                            dados.message ||
                            dados.error ||
                            "Não foi possível cancelar o PIX"
                    }, resposta.status);
                }

                return respostaJSON({
                    ok: true,
                    status: resposta.status,
                    order_id:
                        dados.id || orderId,
                    status_pedido:
                        dados.status || null
                });

            } catch {
                return respostaJSON({
                    ok: false,
                    erro:
                        "Não foi possível cancelar o PIX"
                }, 500);
            }
        }

// VERIFICAR PIX REAL
        // =========================
        if (url.pathname === "/api/mercadopago/verificar-pix") {
            if (request.method !== "GET") {
                return respostaJSON({
                    ok: false,
                    erro: "Método não permitido"
                }, 405);
            }

            const token =
                env.MERCADO_PAGO_ACCESS_TOKEN;

            if (!token) {
                return respostaJSON({
                    ok: false,
                    erro: "Secret do Mercado Pago não configurado"
                }, 500);
            }

            const orderId =
                url.searchParams.get("order_id");

            if (!orderId) {
                return respostaJSON({
                    ok: false,
                    erro: "order_id não informado"
                }, 400);
            }

            try {
                const resposta =
                    await fetch(
                        `https://api.mercadopago.com/v1/orders/${encodeURIComponent(orderId)}`,
                        {
                            method: "GET",
                            headers: {
                                "Authorization":
                                    `Bearer ${token}`
                            }
                        }
                    );

                const dados =
                    await resposta.json();

                const pagamento =
                    dados.transactions?.payments?.[0];

                if (!resposta.ok) {
                    return respostaJSON({
                        ok: false,
                        status: resposta.status,
                        erro:
                            dados.message ||
                            dados.error ||
                            "Não foi possível consultar o PIX"
                    }, resposta.status);
                }

                return respostaJSON({
                    ok: true,
                    status: resposta.status,
                    order_id: dados.id || null,
                    status_pedido:
                        dados.status || null,
                    status_pagamento:
                        pagamento?.status || null,
                    status_detail:
                        pagamento?.status_detail || null,
                    total_amount:
                        dados.total_amount || null
                });

            } catch {
                return respostaJSON({
                    ok: false,
                    erro:
                        "Não foi possível consultar o PIX"
                }, 500);
            }
        }

        // =========================
        // ARQUIVOS DO SITE
        // =========================
        return env.ASSETS.fetch(request);
    }
};
