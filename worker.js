export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === "/api/health") {
            return new Response(
                JSON.stringify({
                    ok: true,
                    service: "lanchonete"
                }),
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        if (url.pathname === "/api/mercadopago/teste") {
            const token = env.MERCADO_PAGO_ACCESS_TOKEN;

            if (!token) {
                return new Response(
                    JSON.stringify({
                        ok: false,
                        erro: "Secret do Mercado Pago não configurado"
                    }),
                    {
                        status: 500,
                        headers: {
                            "Content-Type": "application/json"
                        }
                    }
                );
            }

            try {
                const resposta = await fetch(
                    "https://api.mercadopago.com/v1/orders?limit=1",
                    {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

                const dados = await resposta.json();

                return new Response(
                    JSON.stringify({
                        ok: resposta.ok,
                        status: resposta.status,
                        mensagem: resposta.ok
                            ? "Mercado Pago conectado"
                            : "Mercado Pago recusou a autenticação"
                    }),
                    {
                        status: resposta.ok ? 200 : resposta.status,
                        headers: {
                            "Content-Type": "application/json"
                        }
                    }
                );
            } catch (erro) {
                return new Response(
                    JSON.stringify({
                        ok: false,
                        erro: "Falha ao conectar com o Mercado Pago"
                    }),
                    {
                        status: 502,
                        headers: {
                            "Content-Type": "application/json"
                        }
                    }
                );
            }
        }

        return env.ASSETS.fetch(request);
    }
};
