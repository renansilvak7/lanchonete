const produtos = document.querySelectorAll(".produto");
const secoes = document.querySelectorAll(".categoria-secao");
const botoesCategoria = document.querySelectorAll(".categoria");
const campoPesquisa = document.getElementById("campoPesquisa");

let categoriaAtual = "todos";
let pedido = [];

/* =========================
   FILTRO DE PRODUTOS
========================= */

function atualizarProdutos() {
    const pesquisa = campoPesquisa ? campoPesquisa.value.toLowerCase().trim() : "";

    secoes.forEach(secao => {
        const produtosDaSecao = secao.querySelectorAll(".produto");

        if (!produtosDaSecao.length) return;

        let quantidadeVisivel = 0;

        produtosDaSecao.forEach(produto => {
            const categoria = produto.dataset.categoria;
            const nome = produto.dataset.nome.toLowerCase();
            const palavras = (produto.dataset.palavras || "").toLowerCase();

            const pertenceCategoria =
                categoriaAtual === "todos" ||
                categoria === categoriaAtual;

            const correspondePesquisa =
                pesquisa === "" ||
                nome.includes(pesquisa) ||
                palavras.includes(pesquisa);

            if (pertenceCategoria && correspondePesquisa) {
                produto.style.display = "";
                quantidadeVisivel++;
            } else {
                produto.style.display = "none";
            }
        });

        if (categoriaAtual === "todos") {
            secao.style.display = quantidadeVisivel > 0 ? "" : "none";
        } else {
            const categoriaDaSecao =
                produtosDaSecao[0]?.dataset.categoria;

            secao.style.display =
                categoriaDaSecao === categoriaAtual &&
                quantidadeVisivel > 0
                    ? ""
                    : "none";
        }
    });
}

/* =========================
   CATEGORIAS
========================= */

botoesCategoria.forEach(botao => {
    botao.addEventListener("click", () => {
        botoesCategoria.forEach(b =>
            b.classList.remove("ativa")
        );

        botao.classList.add("ativa");
        categoriaAtual = botao.dataset.categoria;

        atualizarProdutos();
    });
});

if (campoPesquisa) campoPesquisa.addEventListener("input", atualizarProdutos);

/* =========================
   PREÇO
========================= */

function pegarPreco(produto) {
    const texto = produto.querySelector(".rodape-produto strong")?.textContent || "";
    return Number(
        texto
            .replace("R$", "")
            .replace(/\./g, "")
            .replace(",", ".")
            .trim()
    );
}

/* =========================
   INGREDIENTES
========================= */

function ingredientesDoProduto(nome) {
    const ingredientes = {
        "X-Bacon": [
            "Bacon",
            "Queijo",
            "Salada",
            "Molho especial"
        ],

        "X-Salada": [
            "Queijo",
            "Alface",
            "Tomate",
            "Molho especial"
        ],

        "X-Tudo": [
            "Bacon",
            "Queijo",
            "Ovo",
            "Presunto",
            "Salada",
            "Molho"
        ],

        "Duplo Bacon": [
            "Dois hambúrgueres",
            "Bacon",
            "Queijo"
        ],

        "Batata Frita": [],

        "Batata com Cheddar": [
            "Cheddar"
        ],

        "Frango Crocante": [
            "Molho"
        ]
    };

    return ingredientes[nome] || [];
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
            <button class="fechar-pedido" aria-label="Fechar">×</button>

            <div id="conteudoPedido"></div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(".pedido-modal-fundo")
        .addEventListener("click", fecharModal);

    modal.querySelector(".fechar-pedido")
        .addEventListener("click", fecharModal);
}

function abrirModal() {
    criarModal();

    const modal = document.getElementById("modalPedido");
    modal.classList.add("aberto");

    document.body.style.overflow = "hidden";
}

function fecharModal() {
    const modal = document.getElementById("modalPedido");

    if (!modal) return;

    modal.classList.remove("aberto");
    document.body.style.overflow = "";
}

/* =========================
   FAZER PEDIDO
========================= */

function abrirPersonalizacao(produto) {
    const nome = produto.dataset.nome;
    const preco = pegarPreco(produto);
    const categoria = produto.dataset.categoria;
    const ingredientes = ingredientesDoProduto(nome);

    abrirModal();

    const conteudo = document.getElementById("conteudoPedido");

    conteudo.innerHTML = `
        <div class="pedido-cabecalho">
            <span>${categoria === "bebidas" ? "🥤" : "🍔"}</span>
            <div>
                <h2>${nome}</h2>
                <strong>R$ ${preco.toFixed(2).replace(".", ",")}</strong>
            </div>
        </div>

        <div class="pedido-secao">
            <h3>Quantidade</h3>

            <div class="controle-quantidade">
                <button id="menos">−</button>
                <strong id="quantidade">1</strong>
                <button id="mais">+</button>
            </div>
        </div>

        ${
            categoria === "bebidas"
                ? ""
                : `
                <div class="pedido-secao">
                    <h3>Personalize seu pedido</h3>

                    ${
                        ingredientes.length
                            ? ingredientes.map((ingrediente, index) => `
                                <label class="ingrediente">
                                    <input
                                        type="checkbox"
                                        checked
                                        data-ingrediente="${ingrediente}"
                                    >
                                    <span>${ingrediente}</span>
                                </label>
                            `).join("")
                            : `
                                <p class="sem-opcoes">
                                    Este produto não possui opções de ingredientes.
                                </p>
                            `
                    }
                </div>
                `
        }

        <button class="confirmar-produto">
            Adicionar ao pedido • R$ ${preco.toFixed(2).replace(".", ",")}
        </button>
    `;

    let quantidade = 1;

    const quantidadeEl = document.getElementById("quantidade");
    const botaoMenos = document.getElementById("menos");
    const botaoMais = document.getElementById("mais");
    const confirmar = conteudo.querySelector(".confirmar-produto");

    function atualizarQuantidade() {
        quantidadeEl.textContent = quantidade;

        confirmar.textContent =
            `Adicionar ao pedido • R$ ${(preco * quantidade)
                .toFixed(2)
                .replace(".", ",")}`;
    }

    botaoMenos.addEventListener("click", () => {
        if (quantidade > 1) {
            quantidade--;
            atualizarQuantidade();
        }
    });

    botaoMais.addEventListener("click", () => {
        quantidade++;
        atualizarQuantidade();
    });

    confirmar.addEventListener("click", () => {
        const selecionados = [
            ...conteudo.querySelectorAll(
                'input[data-ingrediente]:checked'
            )
        ].map(input => input.dataset.ingrediente);

        pedido.push({
            nome,
            preco,
            quantidade,
            ingredientes: selecionados
        });

        fecharModal();
        mostrarResumoPedido();
    });
}

/* =========================
   RESUMO DO PEDIDO
========================= */

function calcularTotal() {
    return pedido.reduce(
        (total, item) =>
            total + item.preco * item.quantidade,
        0
    );
}

function mostrarResumoPedido() {
    abrirModal();

    const conteudo = document.getElementById("conteudoPedido");
    const total = calcularTotal();

    conteudo.innerHTML = `
        <div class="pedido-cabecalho">
            <span>🛒</span>
            <div>
                <h2>Seu pedido</h2>
                <strong>${pedido.length} item(ns)</strong>
            </div>
        </div>

        <div class="lista-pedido">
            ${
                pedido.map((item, index) => `
                    <div class="item-pedido">
                        <div>
                            <strong>
                                ${item.quantidade}× ${item.nome}
                            </strong>

                            ${
                                item.ingredientes?.length
                                    ? `<small>
                                        ${item.ingredientes.join(", ")}
                                       </small>`
                                    : ""
                            }
                        </div>

                        <div class="item-pedido-direita">
                            <strong>
                                R$ ${(item.preco * item.quantidade)
                                    .toFixed(2)
                                    .replace(".", ",")}
                            </strong>

                            <button
                                class="remover-item"
                                data-index="${index}"
                            >
                                Remover
                            </button>
                        </div>
                    </div>
                `).join("")
            }
        </div>

        <div class="total-pedido">
            <span>Total</span>
            <strong>
                R$ ${total.toFixed(2).replace(".", ",")}
            </strong>
        </div>

        <button class="continuar-pedido">
            Continuar pedido
        </button>

        <button class="voltar-produtos">
            Adicionar mais produtos
        </button>
    `;

    conteudo.querySelectorAll(".remover-item")
        .forEach(botao => {
            botao.addEventListener("click", () => {
                pedido.splice(
                    Number(botao.dataset.index),
                    1
                );

                if (pedido.length) {
                    mostrarResumoPedido();
                } else {
                    fecharModal();
                }
            });
        });

    conteudo.querySelector(".continuar-pedido")
        .addEventListener("click", mostrarPagamento);

    conteudo.querySelector(".voltar-produtos")
        .addEventListener("click", fecharModal);
}

/* =========================
   PAGAMENTO
========================= */

function mostrarPagamento() {
    const conteudo = document.getElementById("conteudoPedido");

    conteudo.innerHTML = `
        <div class="pedido-cabecalho">
            <span>💳</span>
            <div>
                <h2>Forma de pagamento</h2>
                <strong>
                    R$ ${calcularTotal()
                        .toFixed(2)
                        .replace(".", ",")}
                </strong>
            </div>
        </div>

        <div class="formas-pagamento">

            <label class="forma-pagamento">
                <input type="radio" name="pagamento" value="PIX">
                <span>📱</span>
                <strong>PIX</strong>
            </label>

            <label class="forma-pagamento">
                <input type="radio" name="pagamento" value="Dinheiro">
                <span>💵</span>
                <strong>Dinheiro</strong>
            </label>

            <label class="forma-pagamento">
                <input type="radio" name="pagamento" value="Cartão de débito">
                <span>💳</span>
                <strong>Cartão de débito</strong>
            </label>

            <label class="forma-pagamento">
                <input type="radio" name="pagamento" value="Cartão de crédito">
                <span>💳</span>
                <strong>Cartão de crédito</strong>
            </label>

        </div>

        <button class="finalizar-pedido" disabled>
            Finalizar pedido
        </button>
    `;

    const radios =
        conteudo.querySelectorAll(
            'input[name="pagamento"]'
        );

    const finalizar =
        conteudo.querySelector(".finalizar-pedido");

    radios.forEach(radio => {
        radio.addEventListener("change", () => {
            finalizar.disabled = false;
        });
    });

    finalizar.addEventListener("click", () => {
        const pagamento =
            conteudo.querySelector(
                'input[name="pagamento"]:checked'
            ).value;

        finalizarPedido(pagamento);
    });
}

/* =========================
   FINALIZAÇÃO
========================= */

function finalizarPedido(pagamento) {
    let mensagem = "🍔 *NOVO PEDIDO - LANCHESK7*%0A%0A";

    pedido.forEach(item => {
        mensagem +=
            `${item.quantidade}x ${item.nome} - R$ ` +
            `${(item.preco * item.quantidade)
                .toFixed(2)
                .replace(".", ",")}%0A`;

        if (item.ingredientes?.length) {
            mensagem +=
                `Ingredientes: ${item.ingredientes.join(", ")}%0A`;
        }
    });

    mensagem +=
        `%0A💰 *Total: R$ ${calcularTotal()
            .toFixed(2)
            .replace(".", ",")}*%0A`;

    mensagem +=
        `💳 Pagamento: ${pagamento}`;

    /*
       TROQUE O NÚMERO ABAIXO PELO WHATSAPP
       DA LANCHONETE QUANDO FOR CONFIGURAR.
    */
    const telefone = "5500000000000";

    window.open(
        `https://wa.me/${telefone}?text=${mensagem}`,
        "_blank"
    );
}

/* =========================
   BOTÕES DOS PRODUTOS
========================= */

produtos.forEach(produto => {
    const botao = produto.querySelector(".adicionar");

    if (!botao) return;

    botao.textContent = "FAZER PEDIDO";

    botao.addEventListener("click", () => {
        abrirPersonalizacao(produto);
    });
});

/* =========================
   BOTÃO "VER PEDIDO"
========================= */

document.querySelectorAll("button").forEach(botao => {
    if (
        botao.textContent
            .trim()
            .toLowerCase()
            .includes("ver pedido")
    ) {
        botao.addEventListener("click", () => {
            if (pedido.length) {
                mostrarResumoPedido();
            } else {
                abrirModal();

                document.getElementById("conteudoPedido").innerHTML = `
                    <div class="pedido-vazio">
                        <span>🛒</span>
                        <h2>Seu pedido está vazio</h2>
                        <p>Escolha um produto para começar.</p>
                        <button class="voltar-produtos">
                            Escolher produtos
                        </button>
                    </div>
                `;

                document
                    .querySelector(".voltar-produtos")
                    .addEventListener("click", fecharModal);
            }
        });
    }
});

/* =========================
   INICIALIZAÇÃO
========================= */

criarModal();
atualizarProdutos();
