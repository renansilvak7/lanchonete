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

            return new Response(
                JSON.stringify({
                    ok: Boolean(token),
                    mercadoPagoSecret: token ? "configurado" : "ausente"
                }),
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        return env.ASSETS.fetch(request);
    }
};
