const produtos = document.querySelectorAll(".produto");
const secoes = document.querySelectorAll(".categoria-secao");
const botoesCategoria = document.querySelectorAll(".categoria");
const campoPesquisa = document.getElementById("campoPesquisa");
const historicoPesquisa = document.getElementById("historicoPesquisa");

let categoriaAtual = "todos";

function atualizarProdutos() {

    const pesquisa = campoPesquisa.value.toLowerCase().trim();

    secoes.forEach(secao => {

        const produtosDaSecao = secao.querySelectorAll(".produto");

        if (produtosDaSecao.length === 0) {
            return;
        }

        let quantidadeVisivel = 0;

        produtosDaSecao.forEach(produto => {

            const categoria = produto.dataset.categoria;
            const nome = produto.dataset.nome.toLowerCase();
            const palavras = produto.dataset.palavras.toLowerCase();

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
            secao.style.display =
                quantidadeVisivel > 0 ? "" : "none";
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


botoesCategoria.forEach(botao => {

    botao.addEventListener("click", () => {

        botoesCategoria.forEach(b => {
            b.classList.remove("ativa");
        });

        botao.classList.add("ativa");

        categoriaAtual = botao.dataset.categoria;

        atualizarProdutos();

    });

});


campoPesquisa.addEventListener("input", () => {

    atualizarProdutos();

});


atualizarProdutos();
