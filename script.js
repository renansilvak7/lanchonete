const produtos = document.querySelectorAll(".produto");
const secoes = document.querySelectorAll(".categoria-secao");
const botoesCategoria = document.querySelectorAll(".categoria");
const campoPesquisa = document.getElementById("campoPesquisa");

let categoriaAtual = "todos";
let pedido = [];
let telaPagamentoAtiva = false;

function definirTelaPagamentoAtiva(ativa) {
    telaPagamentoAtiva = ativa;

    const modal = document.getElementById("modalPedido");
    const botaoFechar = modal?.querySelector(".fechar-pedido");

    if (botaoFechar) {
        botaoFechar.style.display = ativa ? "none" : "";
    }
}

try {
    const pedidoSalvo = localStorage.getItem("lanchesk7_pedido");

    if (pedidoSalvo) {
        const dados = JSON.parse(pedidoSalvo);

        if (Array.isArray(dados)) {
            pedido = dados.filter(item =>
                item &&
                typeof item.nome === "string" &&
                Number.isFinite(Number(item.preco)) &&
                Number.isFinite(Number(item.quantidade)) &&
                Number(item.quantidade) > 0
            ).map(item => ({
                ...item,
                preco: Number(item.preco),
                quantidade: Number(item.quantidade)
            }));
        }
    }
} catch (erro) {
    console.warn("Não foi possível restaurar o carrinho:", erro);
}
let produtoAtual = null;
let quantidadeAtual = 1;
let formaPagamento = null;
let recebimentoAtual = null;
let observacaoAtual = "";

/* =========================
   FILTRO
========================= */

function atualizarProdutos() {
    const pesquisa = campoPesquisa
        ? campoPesquisa.value.toLowerCase().trim()
        : "";

    secoes.forEach(secao => {
        const lista = secao.querySelectorAll(".produto");

        if (!lista.length) return;

        let visiveis = 0;

        lista.forEach(produto => {
            const categoria = produto.dataset.categoria || "";
            const nome = (produto.dataset.nome || "").toLowerCase();
            const palavras = (produto.dataset.palavras || "").toLowerCase();

            const okCategoria =
                categoriaAtual === "todos" ||
                categoria === categoriaAtual;

            const okPesquisa =
                !pesquisa ||
                nome.includes(pesquisa) ||
                palavras.includes(pesquisa);

            const mostrar = okCategoria && okPesquisa;

            produto.style.display = mostrar ? "" : "none";

            if (mostrar) visiveis++;
        });

        if (categoriaAtual === "todos") {
            secao.style.display = visiveis ? "" : "none";
        } else {
            const categoriaSecao = lista[0]?.dataset.categoria;

            secao.style.display =
                categoriaSecao === categoriaAtual && visiveis
                    ? ""
                    : "none";
        }
    });
}

botoesCategoria.forEach(botao => {
    botao.addEventListener("click", () => {
        botoesCategoria.forEach(b =>
            b.classList.remove("ativa")
        );

        botao.classList.add("ativa");

        categoriaAtual =
            botao.dataset.categoria || "todos";

        atualizarProdutos();
    });
});

if (campoPesquisa) {
    campoPesquisa.addEventListener("input", atualizarProdutos);

    campoPesquisa.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            atualizarProdutos();
            campoPesquisa.blur();
        }
    });
}

/* =========================
   PREÇO
========================= */

function pegarPreco(produto) {
    const texto =
        produto.querySelector(".rodape-produto strong")?.textContent || "";

    return Number(
        texto
            .replace("R$", "")
            .replace(/\./g, "")
            .replace(",", ".")
            .trim()
    );
}

function moeda(valor) {
    return valor.toFixed(2).replace(".", ",");
}

/* =========================
   CARRINHO
========================= */

function quantidadeTotal() {
    return pedido.reduce(
        (total, item) => total + item.quantidade,
        0
    );
}

function valorTotal() {
    return pedido.reduce(
        (total, item) =>
            total + item.preco * item.quantidade,
        0
    );
}

function encontrarProduto(nome) {
    return pedido.find(item => item.nome === nome);
}

function atualizarCarrinhoInterface() {
    try {
        localStorage.setItem(
            "lanchesk7_pedido",
            JSON.stringify(pedido)
        );
    } catch (erro) {
        console.warn("Não foi possível salvar o carrinho:", erro);
    }

    const quantidade = quantidadeTotal();

    document
        .querySelectorAll("button")
        .forEach(botao => {
            const textoOriginal =
                botao.dataset.carrinhoBotao ||
                botao.textContent.trim();

            const texto =
                textoOriginal.toLowerCase();

            if (
                texto.includes("ver pedido") ||
                texto.includes("carrinho")
            ) {
                botao.dataset.carrinhoBotao =
                    textoOriginal.replace(/\s*\(\d+\)\s*$/, "");

                const nome =
                    botao.dataset.carrinhoBotao;

                botao.textContent =
                    quantidade > 0
                        ? `${nome} (${quantidade})`
                        : nome;
            }
        });

    const quantidadeElemento =
        document.getElementById("quantidadeCarrinho");

    if (quantidadeElemento) {
        quantidadeElemento.textContent = quantidade;
    }

    const totalElemento =
        document.getElementById("totalCarrinho");

    if (totalElemento) {
        totalElemento.textContent =
            `R$ ${moeda(valorTotal())}`;
    }
}

/* =========================
   MODAL
========================= */

function criarModal() {
    if (document.getElementById("modalPedido")) return;

    const modal = document.createElement("div");

    modal.id = "modalPedido";

    modal.innerHTML = `
        <div class="pedido-modal-fundo"></div>

        <div class="pedido-modal">

            <button
                class="fechar-pedido"
                aria-label="Fechar">
                ×
            </button>

            <div id="conteudoPedido"></div>

        </div>
    `;

    document.body.appendChild(modal);

    modal
        .querySelector(".pedido-modal-fundo")
        .addEventListener("click", () => {
            if (!telaPagamentoAtiva) {
                fecharModal();
            }
        });

    modal
        .querySelector(".fechar-pedido")
        .addEventListener("click", () => {
            if (!telaPagamentoAtiva) {
                fecharModal();
            }
        });
}

function abrirModal() {
    criarModal();

    document
        .getElementById("modalPedido")
        .classList.add("aberto");

    document.body.style.overflow = "hidden";
}

function fecharModal() {
    definirTelaPagamentoAtiva(false);
    const modal =
        document.getElementById("modalPedido");

    if (!modal) return;

    modal.classList.remove("aberto");
    document.body.style.overflow = "";

    salvarTelaMenu();
}

/* =========================
   FAZER PEDIDO
========================= */

function abrirProduto(produto) {
    produtoAtual = produto;
    quantidadeAtual = 1;

    renderizarProduto();
}

function renderizarProduto() {
    abrirModal();

    const nome = produtoAtual.dataset.nome || "Produto";
    const preco = pegarPreco(produtoAtual);

    const imagem =
        produtoAtual.querySelector("img")?.getAttribute("src") || "";

    const conteudo =
        document.getElementById("conteudoPedido");

    conteudo.innerHTML = `
        <div class="produto-pedido-app">

            ${
                imagem
                    ? `
                        <div class="produto-pedido-foto">
                            <img src="${imagem}" alt="${nome}">
                        </div>
                    `
                    : ""
            }

            <div class="produto-pedido-corpo">

                <span class="produto-pedido-etiqueta">
                    FAZER PEDIDO
                </span>

                <h2>${nome}</h2>

                <strong class="produto-pedido-preco">
                    R$ ${moeda(preco)}
                </strong>

                <div class="quantidade-app">

                    <div>
                        <small>Quantidade</small>
                        <strong id="quantidadeProduto">
                            ${quantidadeAtual}
                        </strong>
                    </div>

                    <div class="quantidade-app-controle">

                        <button
                            type="button"
                            id="menosProduto"
                            aria-label="Diminuir">
                            −
                        </button>

                        <span>${quantidadeAtual}</span>

                        <button
                            type="button"
                            id="maisProduto"
                            aria-label="Aumentar">
                            +
                        </button>

                    </div>

                </div>

                <div class="produto-total-app">
                    <span>Total</span>

                    <strong id="totalProduto">
                        R$ ${moeda(preco * quantidadeAtual)}
                    </strong>
                </div>

                <div class="produto-acoes-app">

                    <button
                        type="button"
                        class="botao-principal"
                        id="adicionarCarrinho">
                        ADICIONAR AO CARRINHO
                    </button>

                    <button
                        type="button"
                        class="botao-secundario"
                        id="cancelarProduto">
                        CANCELAR
                    </button>

                </div>

            </div>
        </div>
    `;

    const menos =
        document.getElementById("menosProduto");

    const mais =
        document.getElementById("maisProduto");

    menos.addEventListener("click", () => {
        if (quantidadeAtual > 1) {
            quantidadeAtual--;
            atualizarProdutoQuantidade();
        }
    });

    mais.addEventListener("click", () => {
        quantidadeAtual++;
        atualizarProdutoQuantidade();
    });

    document
        .getElementById("adicionarCarrinho")
        .addEventListener("click", adicionarAoCarrinho);

    document
        .getElementById("cancelarProduto")
        .addEventListener("click", fecharModal);
}

function atualizarProdutoQuantidade() {
    const quantidade =
        document.getElementById("quantidadeProduto");

    const total =
        document.getElementById("totalProduto");

    if (!quantidade || !total || !produtoAtual) return;

    const preco = pegarPreco(produtoAtual);

    quantidade.textContent = quantidadeAtual;

    const numeroVisual =
        document.querySelector(".quantidade-app-controle span");

    if (numeroVisual) {
        numeroVisual.textContent = quantidadeAtual;
    }

    total.textContent =
        `R$ ${moeda(preco * quantidadeAtual)}`;
}

function adicionarAoCarrinho() {
    if (!produtoAtual) return;

    const nome =
        produtoAtual.dataset.nome || "Produto";

    const preco =
        pegarPreco(produtoAtual);

    const imagem =
        produtoAtual.querySelector("img")?.getAttribute("src") || "";

    const existente =
        encontrarProduto(nome);

    if (existente) {
        existente.quantidade += quantidadeAtual;
        if (imagem && !existente.imagem) {
            existente.imagem = imagem;
        }
    } else {
        pedido.push({
            nome,
            preco,
            quantidade: quantidadeAtual,
            imagem,
            promocao: false
        });
    }

    atualizarCarrinhoInterface();
    fecharModal();
}

function salvarEtapaCheckout(etapa) {
    try {
        localStorage.setItem("lanchesk7_tela_atual", etapa);

        localStorage.setItem(
            "lanchesk7_checkout_estado",
            JSON.stringify({
                formaPagamento,
                recebimentoAtual,
                observacaoAtual
            })
        );
    } catch (erro) {
        console.warn("Não foi possível salvar o estado do checkout:", erro);
    }
}

function salvarTelaMenu() {
    try {
        localStorage.setItem("lanchesk7_tela_atual", "menu");
    } catch (erro) {
        console.warn("Não foi possível salvar a tela atual:", erro);
    }
}

function restaurarEstadoCheckout() {
    try {
        const estadoSalvo =
            localStorage.getItem("lanchesk7_checkout_estado");

        if (estadoSalvo) {
            const estado = JSON.parse(estadoSalvo);

            formaPagamento =
                estado.formaPagamento || null;

            recebimentoAtual =
                estado.recebimentoAtual || null;

            observacaoAtual =
                estado.observacaoAtual || "";
        }

        return localStorage.getItem("lanchesk7_tela_atual") || "menu";

    } catch (erro) {
        console.warn("Não foi possível restaurar o checkout:", erro);
        return "menu";
    }
}

function mostrarCarrinho() {
    definirTelaPagamentoAtiva(false);
    salvarEtapaCheckout("carrinho");
    abrirModal();

    const conteudo =
        document.getElementById("conteudoPedido");

    if (!pedido.length) {
        mostrarPedidoVazio();
        return;
    }

    const quantidade = quantidadeTotal();
    const total = valorTotal();

    conteudo.innerHTML = `
        <div class="carrinho-app">

            <div class="carrinho-app-topo">

                <div>
                    <span class="produto-pedido-etiqueta">
                        SEU PEDIDO
                    </span>

                    <h2>
                        Carrinho
                        <span>(${quantidade})</span>
                    </h2>

                    <p>
                        Confira seus produtos antes de finalizar.
                    </p>
                </div>

            </div>

            <div class="carrinho-lista-app">

                ${pedido.map((item, index) => {

                    const subtotal =
                        item.preco * item.quantidade;

                    return `
                        <article class="carrinho-produto-app">

                            <div class="carrinho-produto-imagem">

                                ${
                                    item.imagem
                                        ? `
                                            <img
                                                src="${item.imagem}"
                                                alt="${item.nome}">
                                          `
                                        : `
                                            <div class="carrinho-sem-imagem">
                                                🍔
                                            </div>
                                          `
                                }

                            </div>

                            <div class="carrinho-produto-conteudo">

                                <div class="carrinho-produto-titulo">

                                    <div>
                                        <h3>${item.nome}</h3>

                                        ${
                                            item.promocao
                                                ? `<span class="selo-promocao-carrinho">PROMOÇÃO</span>`
                                                : ""
                                        }
                                    </div>

                                    <button
                                        type="button"
                                        class="carrinho-excluir"
                                        data-index="${index}"
                                        aria-label="Remover ${item.nome}">
                                        ×
                                    </button>

                                </div>

                                <span class="carrinho-unitario">
                                    R$ ${moeda(item.preco)} cada
                                </span>

                                <div class="carrinho-linha-final">

                                    <div class="carrinho-quantidade">

                                        <button
                                            type="button"
                                            data-acao="menos"
                                            data-index="${index}">
                                            −
                                        </button>

                                        <strong>
                                            ${item.quantidade}
                                        </strong>

                                        <button
                                            type="button"
                                            data-acao="mais"
                                            data-index="${index}">
                                            +
                                        </button>

                                    </div>

                                    <strong class="carrinho-subtotal">
                                        R$ ${moeda(subtotal)}
                                    </strong>

                                </div>

                            </div>

                        </article>
                    `;
                }).join("")}

            </div>

            <div class="carrinho-resumo-app">

                <div>
                    <span>Subtotal</span>
                    <strong>R$ ${moeda(total)}</strong>
                </div>

                <div class="carrinho-total-app">
                    <span>Total do pedido</span>
                    <strong>R$ ${moeda(total)}</strong>
                </div>

            </div>

            <div class="carrinho-acoes-app">

                <button
                    type="button"
                    id="continuarComprando"
                    class="botao-escolher-pedidos">
                    ESCOLHER OUTROS PEDIDOS
                </button>

                <button
                    type="button"
                    id="finalizarPedido"
                    class="botao-finalizar">
                    FINALIZAR PEDIDO
                </button>

            </div>

        </div>
    `;

    document
        .querySelectorAll(".carrinho-quantidade button")
        .forEach(botao => {

            botao.addEventListener("click", () => {

                const index =
                    Number(botao.dataset.index);

                const item = pedido[index];

                if (!item) return;

                if (botao.dataset.acao === "mais") {
                    item.quantidade++;
                }

                if (botao.dataset.acao === "menos") {
                    item.quantidade--;

                    if (item.quantidade <= 0) {
                        pedido.splice(index, 1);
                    }
                }

                atualizarCarrinhoInterface();

                mostrarCarrinho();
            });
        });

    document
        .querySelectorAll(".carrinho-excluir")
        .forEach(botao => {

            botao.addEventListener("click", () => {

                const index =
                    Number(botao.dataset.index);

                pedido.splice(index, 1);

                atualizarCarrinhoInterface();

                if (pedido.length) {
                    mostrarCarrinho();
                } else {
                    mostrarPedidoVazio();
                }
            });
        });

    document
        .getElementById("continuarComprando")
        .addEventListener("click", fecharModal);

    document
        .getElementById("finalizarPedido")
        .addEventListener("click", abrirFinalizacao);
}

function abrirFinalizacao() {
    definirTelaPagamentoAtiva(false);
    salvarEtapaCheckout("finalizacao");
    abrirModal();

    const conteudo =
        document.getElementById("conteudoPedido");

    if (!formaPagamento) formaPagamento = null;
    if (!recebimentoAtual) recebimentoAtual = null;
    if (!observacaoAtual) observacaoAtual = "";

    conteudo.innerHTML = `
        <div class="finalizacao-app">

            <span class="produto-pedido-etiqueta">
                FINALIZAR PEDIDO
            </span>

            <h2>Como você quer receber?</h2>

            <div class="recebimento-opcoes-app">

                <label class="recebimento-card-app">

                    <input
                        type="radio"
                        name="recebimento"
                        value="Retirar no estabelecimento">

                    <span class="recebimento-icone">🏠</span>

                    <strong>Retirar</strong>

                    <small>
                        No estabelecimento
                    </small>

                </label>

                <label class="recebimento-card-app">

                    <input
                        type="radio"
                        name="recebimento"
                        value="Entrega">

                    <span class="recebimento-icone">🛵</span>

                    <strong>Entrega</strong>

                    <small>
                        Receber no endereço
                    </small>

                </label>

            </div>

            <div class="finalizacao-bloco-app">

                <h3>Forma de pagamento</h3>

                <div class="pagamento-opcoes-app">

                    <button
                        type="button"
                        class="pagamento-app-card"
                        data-pagamento="PIX">

                        <span>⚡</span>

                        <strong>PIX</strong>

                        <small>
                            QR Code + Pix Copia e Cola
                        </small>

                    </button>

                    <button
                        type="button"
                        class="pagamento-app-card"
                        data-pagamento="Cartão">

                        <span>💳</span>

                        <strong>CARTÃO</strong>

                        <small>
                            Pagamento seguro
                        </small>

                    </button>

                </div>

            </div>

            <div class="finalizacao-bloco-app">

                <h3>
                    Observação
                    <small>(opcional)</small>
                </h3>

                <textarea
                    id="observacaoPedido"
                    class="observacao-pedido"
                    placeholder="Ex.: sem cebola, pouco molho..."
                    rows="3"></textarea>

            </div>

            <div class="checkout-total-app">

                <span>Total</span>

                <strong>
                    R$ ${moeda(valorTotal())}
                </strong>

            </div>

            <button
                type="button"
                class="botao-finalizar"
                id="confirmarFormaPagamento">
                CONTINUAR PARA PAGAMENTO
            </button>

        </div>
    `;

    document
        .querySelectorAll(".pagamento-app-card")
        .forEach(botao => {

            botao.addEventListener("click", () => {

                document
                    .querySelectorAll(".pagamento-app-card")
                    .forEach(b =>
                        b.classList.remove("selecionado")
                    );

                botao.classList.add("selecionado");

                formaPagamento =
                    botao.dataset.pagamento;

                salvarEtapaCheckout("finalizacao");
            });
        });

    document
        .getElementById("confirmarFormaPagamento")
        .addEventListener(
            "click",
            confirmarFormaPagamento
        );
}

function confirmarFormaPagamento() {
    const recebimento =
        document.querySelector(
            'input[name="recebimento"]:checked'
        );

    if (!recebimento) {
        alert(
            "Escolha entre retirada ou entrega."
        );
        return;
    }

    if (!formaPagamento) {
        alert(
            "Escolha uma forma de pagamento."
        );
        return;
    }

    observacaoAtual =
        document.getElementById(
            "observacaoPedido"
        )?.value.trim() || "";

    recebimentoAtual =
        recebimento.value;

    salvarEtapaCheckout("pagamento");

    abrirTelaPagamento(recebimentoAtual);
}

function crc16Pix(payload) {
    let crc = 0xFFFF;

    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;

        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
            } else {
                crc = (crc << 1) & 0xFFFF;
            }
        }
    }

    return crc.toString(16).toUpperCase().padStart(4, "0");
}

function campoPix(id, valor) {
    return String(id).padStart(2, "0") +
           String(valor.length).padStart(2, "0") +
           valor;
}

function gerarPayloadPix(valor) {
    const chavePix = "37fb303c-f7fd-471d-9c79-75eed080c307";

    const nome = "RENAN SILVA DO NASCIMENTO"
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .substring(0, 25)
        .toUpperCase();

    const cidade = "CARNAUBAIS"
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .substring(0, 15)
        .toUpperCase();

    const valorPix = Number(valor).toFixed(2);

    const merchantAccount =
        campoPix(0, "BR.GOV.BCB.PIX") +
        campoPix(1, chavePix);

    let payload =
        campoPix(0, "01") +
        campoPix(26, merchantAccount) +
        campoPix(52, "0000") +
        campoPix(53, "986") +
        campoPix(54, valorPix) +
        campoPix(58, "BR") +
        campoPix(59, nome) +
        campoPix(60, cidade) +
        campoPix(62, campoPix(05, "***"));

    payload += "6304";

    return payload + crc16Pix(payload);
}

function iniciarTimerPix() {
    const elemento = document.getElementById("pixTimer");

    if (!elemento) return;

    const chaveTimer = "lanchesk7_pix_expira_em";

    let expiracao =
        Number(localStorage.getItem(chaveTimer));

    if (
        !Number.isFinite(expiracao) ||
        expiracao <= Date.now()
    ) {
        expiracao =
            Date.now() + (5 * 60 * 1000);

        localStorage.setItem(
            chaveTimer,
            String(expiracao)
        );
    }

    if (window.timerPixInterval) {
        clearInterval(window.timerPixInterval);
    }

    function atualizar() {
        const restante =
            Math.max(0, expiracao - Date.now());

        const minutos =
            Math.floor(restante / 60000);

        const segundos =
            Math.floor(
                (restante % 60000) / 1000
            );

        elemento.textContent =
            `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;

        if (restante <= 0) {
            clearInterval(
                window.timerPixInterval
            );

            window.timerPixInterval =
                null;

            localStorage.removeItem(
                chaveTimer
            );

            if (
                typeof pararVerificacaoPixMercadoPago ===
                "function"
            ) {
                pararVerificacaoPixMercadoPago();
            }

            elemento.textContent =
                "PIX EXPIRADO";
        }
    }

    atualizar();

    window.timerPixInterval =
        setInterval(atualizar, 1000);
}

function pararTimerPix(limparEstado = true) {
    if (window.timerPixInterval) {
        clearInterval(window.timerPixInterval);
        window.timerPixInterval = null;
    }

    if (limparEstado) {
        localStorage.removeItem(
            "lanchesk7_pix_expira_em"
        );
    }
}

function salvarPixMercadoPago(dados) {
    try {
        localStorage.setItem(
            "lanchesk7_pix_dados",
            JSON.stringify(dados)
        );
    } catch (erro) {
        console.warn(
            "Não foi possível salvar os dados do PIX:",
            erro
        );
    }
}

function obterPixMercadoPago() {
    try {
        const dados =
            localStorage.getItem(
                "lanchesk7_pix_dados"
            );

        return dados
            ? JSON.parse(dados)
            : null;

    } catch (erro) {
        console.warn(
            "Não foi possível restaurar os dados do PIX:",
            erro
        );

        return null;
    }
}

function limparPixMercadoPago() {
    localStorage.removeItem(
        "lanchesk7_pix_dados"
    );
}

async function abrirTelaPagamento(recebimento) {
    definirTelaPagamentoAtiva(true);
    recebimentoAtual = recebimento;
    salvarEtapaCheckout("pagamento");
    abrirModal();

    const conteudo =
        document.getElementById("conteudoPedido");

    const total =
        Number(valorTotal());

    const chavePix =
        "37fb303c-f7fd-471d-9c79-75eed080c307";

    if (formaPagamento !== "PIX") {
        conteudo.innerHTML = `
            <div class="pagamento-app">

                <span class="produto-pedido-etiqueta">
                    PAGAMENTO COM CARTÃO
                </span>

                <h2>Pagamento com cartão</h2>

                <div class="pagamento-valor-app">
                    <span>Valor exato do pedido</span>
                    <strong>R$ ${moeda(total)}</strong>
                </div>

                <div class="cartao-app">

                    <div class="cartao-icone">💳</div>

                    <h3>Pagamento seguro</h3>

                    <p>
                        O pagamento com cartão será realizado
                        por um checkout seguro do provedor.
                    </p>

                    <button
                        type="button"
                        class="botao-finalizar"
                        id="checkoutSeguro">
                        PAGAR COM CARTÃO
                    </button>

                </div>

                <button
                    type="button"
                    class="botao-secundario"
                    id="voltarCheckout">
                    VOLTAR
                </button>

            </div>
        `;

        document
            .getElementById("voltarCheckout")
            ?.addEventListener("click", () => {
                abrirFinalizacao();
            });

        return;
    }

    let pix = obterPixMercadoPago();

    const pixValido =
        pix &&
        pix.order_id &&
        Number(pix.total_amount) === total &&
        pix.qr_code &&
        pix.qr_code_base64;

    if (!pixValido) {
        conteudo.innerHTML = `
            <div class="pagamento-app">

                <span class="produto-pedido-etiqueta">
                    PAGAMENTO PIX
                </span>

                <h2>Gerando PIX...</h2>

                <div class="pagamento-valor-app">
                    <span>Valor exato do pedido</span>
                    <strong>R$ ${moeda(total)}</strong>
                </div>

                <p class="pix-aviso-app">
                    Aguarde enquanto geramos seu QR Code de pagamento.
                </p>

            </div>
        `;

        try {
            const resposta =
                await fetch(
                    "/api/mercadopago/criar-pix",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            valor: total,
                            email: "marajosianesilva75443@gmail.com"
                        })
                    }
                );

            const dados =
                await resposta.json();

            if (
                !resposta.ok ||
                !dados.ok ||
                !dados.order_id ||
                !dados.qr_code ||
                !dados.qr_code_base64
            ) {
                throw new Error(
                    dados.erro ||
                    "Não foi possível gerar o PIX."
                );
            }

            pix = dados;

            salvarPixMercadoPago({
                order_id: dados.order_id,
                qr_code: dados.qr_code,
                qr_code_base64:
                    dados.qr_code_base64,
                ticket_url:
                    dados.ticket_url || null,
                total_amount:
                    dados.total_amount
            });

        } catch (erro) {
            conteudo.innerHTML = `
                <div class="pagamento-app">

                    <span class="produto-pedido-etiqueta">
                        PAGAMENTO PIX
                    </span>

                    <h2>Não foi possível gerar o PIX</h2>

                    <p class="pix-aviso-app">
                        ${erro.message ||
                            "Tente novamente."}
                    </p>

                    <button
                        type="button"
                        class="botao-finalizar"
                        id="tentarPixNovamente">
                        TENTAR NOVAMENTE
                    </button>

                    <button
                        type="button"
                        class="botao-secundario"
                        id="voltarCheckout">
                        VOLTAR
                    </button>

                </div>
            `;

            document
                .getElementById("tentarPixNovamente")
                ?.addEventListener("click", () => {
                    limparPixMercadoPago();
                    abrirTelaPagamento(recebimento);
                });

            document
                .getElementById("voltarCheckout")
                ?.addEventListener("click", () => {
                    abrirFinalizacao();
                });

            return;
        }
    }

    const qrBase64 =
        pix.qr_code_base64.startsWith("data:")
            ? pix.qr_code_base64
            : `data:image/png;base64,${pix.qr_code_base64}`;

    conteudo.innerHTML = `
        <div class="pagamento-app">

            <span class="produto-pedido-etiqueta">
                PAGAMENTO PIX
            </span>

            <h2>Pague pelo PIX</h2>

            <div class="pagamento-valor-app">
                <span>Valor exato do pedido</span>
                <strong>R$ ${moeda(total)}</strong>
            </div>

            <div class="pix-app">

                <div class="pix-contador-app">
                    <small>TEMPO PARA PAGAMENTO</small>
                    <strong id="pixTimer">05:00</strong>
                </div>

                <div class="pix-qr-app">
                    <img
                        src="${qrBase64}"
                        alt="QR Code PIX no valor de R$ ${moeda(total)}">
                </div>

                <div class="pix-chave-app">

                    <span>Chave PIX</span>

                    <div>
                        <code id="chavePixPagamento">
                            ${chavePix}
                        </code>

                        <button
                            type="button"
                            id="copiarChavePix">
                            COPIAR
                        </button>
                    </div>

                </div>

                <div class="pix-chave-app">

                    <span>PIX COPIA E COLA — R$ ${moeda(total)}</span>

                    <div>
                        <code
                            id="codigoPixPagamento"
                            style="word-break:break-all;">
                            ${pix.qr_code}
                        </code>

                        <button
                            type="button"
                            id="copiarPix">
                            COPIAR
                        </button>
                    </div>

                </div>

                <p class="pix-aviso-app">
                    O QR Code e o Pix Copia e Cola foram
                    gerados pelo Mercado Pago para o valor exato
                    de R$ ${moeda(total)}.
                    Confira o valor e o recebedor no aplicativo
                    do seu banco antes de confirmar.
                </p>

            </div>

            <button
                type="button"
                class="botao-secundario"
                id="voltarCheckout">
                CANCELAR
            </button>

        </div>
    `;

    const copiarChave =
        document.getElementById("copiarChavePix");

    copiarChave?.addEventListener(
        "click",
        async () => {
            try {
                await navigator.clipboard.writeText(
                    chavePix
                );

                copiarChave.textContent =
                    "COPIADO!";

                setTimeout(() => {
                    copiarChave.textContent =
                        "COPIAR";
                }, 1500);

            } catch {
                alert(
                    "Não foi possível copiar a chave PIX."
                );
            }
        }
    );

    const copiarPix =
        document.getElementById("copiarPix");

    copiarPix?.addEventListener(
        "click",
        async () => {
            try {
                await navigator.clipboard.writeText(
                    pix.qr_code
                );

                copiarPix.textContent =
                    "COPIADO!";

                setTimeout(() => {
                    copiarPix.textContent =
                        "COPIAR";
                }, 1500);

            } catch {
                alert(
                    "Não foi possível copiar o Pix Copia e Cola."
                );
            }
        }
    );

    document
        .getElementById("voltarCheckout")
        ?.addEventListener("click", () => {
            cancelarPixMercadoPago();
        });

    iniciarTimerPix();
    iniciarVerificacaoPixMercadoPago();
}

async function verificarPixMercadoPago() {
    const pix =
        obterPixMercadoPago();

    if (!pix?.order_id) {
        return;
    }

    try {
        const resposta =
            await fetch(
                `/api/mercadopago/verificar-pix?order_id=${encodeURIComponent(pix.order_id)}`
            );

        const dados =
            await resposta.json();

        if (!resposta.ok || !dados.ok) {
            return;
        }

        const pagamentoProcessado =
            dados.status_pagamento === "processed" &&
            dados.status_detail === "accredited";

        if (!pagamentoProcessado) {
            return;
        }

        if (window.pixMercadoPagoInterval) {
            clearInterval(
                window.pixMercadoPagoInterval
            );

            window.pixMercadoPagoInterval =
                null;
        }

        pararTimerPix(true);

        const codigo =
            gerarCodigoPedido();

        mostrarPagamentoConfirmado(
            codigo,
            recebimentoAtual,
            observacaoAtual
        );

    } catch (erro) {
        console.warn(
            "Não foi possível verificar o PIX:",
            erro
        );
    }
}

function iniciarVerificacaoPixMercadoPago() {
    if (window.pixMercadoPagoInterval) {
        clearInterval(
            window.pixMercadoPagoInterval
        );
    }

    verificarPixMercadoPago();

    window.pixMercadoPagoInterval =
        setInterval(
            verificarPixMercadoPago,
            4000
        );
}

function pararVerificacaoPixMercadoPago() {
    if (window.pixMercadoPagoInterval) {
        clearInterval(
            window.pixMercadoPagoInterval
        );

        window.pixMercadoPagoInterval =
            null;
    }
}

async function cancelarPixMercadoPago() {
    pararTimerPix(true);
    pararVerificacaoPixMercadoPago();

    const pix =
        obterPixMercadoPago();

    if (!pix?.order_id) {
        limparPixMercadoPago();
        abrirFinalizacao();
        return;
    }

    try {
        const resposta =
            await fetch(
                "/api/mercadopago/cancelar-pix",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        order_id:
                            pix.order_id
                    })
                }
            );

        const dados =
            await resposta.json();

        if (!resposta.ok || !dados.ok) {
            console.warn(
                "Não foi possível cancelar o PIX:",
                dados.erro
            );
        }

    } catch (erro) {
        console.warn(
            "Erro ao cancelar o PIX:",
            erro
        );
    }

    limparPixMercadoPago();
    abrirFinalizacao();
}

function confirmarPagamentoTeste() {
    alert(
        "A confirmação automática será feita pelo gateway de pagamento. Nenhum botão de 'já paguei' será usado na versão final."
    );
}

/* =========================
   CÓDIGO DO PEDIDO
========================= */

function gerarCodigoPedido() {
    const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    function bloco(tamanho) {
        let resultado = "";
        const array = new Uint32Array(tamanho);
        crypto.getRandomValues(array);

        for (let i = 0; i < tamanho; i++) {
            resultado += caracteres[array[i] % caracteres.length];
        }

        return resultado;
    }

    return `L7K-${bloco(4)}-${bloco(4)}`;
}

function mostrarPagamentoConfirmado(
    codigo,
    recebimento,
    observacao
) {
    abrirModal();

    const conteudo =
        document.getElementById("conteudoPedido");

    conteudo.innerHTML = `
        <div class="confirmacao-pedido">

            <div class="confirmacao-icone">
                ✓
            </div>

            <h2>Pagamento confirmado!</h2>

            <p>
                Seu pedido foi registrado.
            </p>

            <div class="codigo-pedido">
                ${codigo}
            </div>

            <div class="resumo-confirmacao">

                <p>
                    <strong>Itens:</strong>
                    ${quantidadeTotal()}
                </p>

                <p>
                    <strong>Total:</strong>
                    R$ ${moeda(valorTotal())}
                </p>

                <p>
                    <strong>Recebimento:</strong>
                    ${recebimento}
                </p>

                <p>
                    <strong>Pagamento:</strong>
                    ${formaPagamento}
                </p>

                ${
                    observacao
                        ? `
                            <p>
                                <strong>Observação:</strong>
                                ${observacao}
                            </p>
                        `
                        : ""
                }

            </div>

            <button
                type="button"
                class="botao-finalizar"
                id="concluirPedido">
                CONCLUIR
            </button>

        </div>
    `;

    document
        .getElementById("concluirPedido")
        .addEventListener("click", () => {

            pedido = [];
            formaPagamento = null;
            recebimentoAtual = null;
            observacaoAtual = "";

            localStorage.removeItem("lanchesk7_pedido");
            localStorage.removeItem("lanchesk7_etapa");
            localStorage.removeItem("lanchesk7_checkout_estado");
            localStorage.removeItem("lanchesk7_pix_expira_em");

            atualizarCarrinhoInterface();
            fecharModal();
        });
}

/* =========================
   CARRINHO VAZIO
========================= */

function mostrarPedidoVazio() {
    const conteudo =
        document.getElementById("conteudoPedido");

    conteudo.innerHTML = `
        <div class="pedido-vazio">

            <span>🛒</span>

            <h2>Seu pedido está vazio</h2>

            <p>
                Escolha um produto para começar.
            </p>

            <button
                type="button"
                class="botao-finalizar"
                id="escolherProdutos">
                ESCOLHER PRODUTOS
            </button>

        </div>
    `;

    document
        .getElementById("escolherProdutos")
        .addEventListener(
            "click",
            fecharModal
        );
}

/* =========================
   BOTÕES DOS PRODUTOS
========================= */

produtos.forEach(produto => {

    const botao =
        produto.querySelector(".adicionar");

    if (!botao) return;

    botao.textContent = "FAZER PEDIDO";

    botao.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            abrirProduto(produto);
        }
    );
});

/* =========================
   BOTÃO VER PEDIDO
========================= */

document
    .querySelectorAll("button")
    .forEach(botao => {

        const texto =
            botao.textContent
                .trim()
                .toLowerCase();

        if (texto.includes("ver pedido")) {

            botao.dataset.carrinhoBotao =
                botao.textContent.trim();

            botao.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    mostrarCarrinho();
                }
            );
        }
    });


/* =========================
   PROMOÇÕES
========================= */

document
    .querySelectorAll("button")
    .forEach(botao => {

        const texto =
            botao.textContent.trim().toLowerCase();

        if (!texto.includes("adicionar promoção")) return;

        botao.addEventListener("click", event => {

            event.preventDefault();
            event.stopPropagation();

            const promocaoExistente =
                pedido.find(item => item.promocao);

            if (promocaoExistente) {
                promocaoExistente.quantidade++;
            } else {
                const bloco =
                    botao.closest(
                        ".promocao, .promocao-card, .oferta, article, section, div"
                    );

                const imagem =
                    bloco?.querySelector("img")?.getAttribute("src") || "";

                pedido.push({
                    nome: "2 X-Bacons",
                    preco: 29.90,
                    quantidade: 1,
                    imagem,
                    promocao: true
                });
            }

            atualizarCarrinhoInterface();

            mostrarCarrinho();
        });
    });

/* =========================
   INICIALIZAÇÃO
========================= */

criarModal();
atualizarProdutos();
atualizarCarrinhoInterface();

const telaSalva = restaurarEstadoCheckout();

if (telaSalva === "carrinho" && pedido.length) {
    mostrarCarrinho();

} else if (telaSalva === "finalizacao" && pedido.length) {
    abrirFinalizacao();

} else if (
    telaSalva === "pagamento" &&
    pedido.length &&
    recebimentoAtual &&
    formaPagamento
) {
    abrirTelaPagamento(recebimentoAtual);

} else {
    salvarTelaMenu();

    if (!pedido.length) {
        localStorage.removeItem("lanchesk7_checkout_estado");
    }
}
