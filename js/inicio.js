import { h } from "./dom.js";
import { barras, divisao, fraseVencedor, nomeCandidato, PONTOS, VOTOS } from "./componentes.js";
import { inteiro, percentagem, plural } from "./formato.js";

function ligacao(e) {
  return `#/eleicao/${e.id}`;
}

function destaque(e) {
  return h(
    "section",
    { class: "destaque", "aria-labelledby": "titulo-destaque" },
    h("p", { class: "sobretitulo" }, "Última eleição"),
    h("h2", { id: "titulo-destaque" }, h("a", { href: ligacao(e) }, e.titulo)),
    h("p", { class: "frase-vencedor" }, fraseVencedor(e)),
    h(
      "div",
      { class: "duas-colunas" },
      h("div", {}, h("h3", {}, "Como 1ª escolha"), barras(e, "primeira_escolha", VOTOS)),
      h("div", {}, h("h3", {}, "Pontos"), barras(e, "pontos", PONTOS)),
    ),
    h("p", { class: "mais" }, h("a", { href: ligacao(e) }, "Ver o resultado completo")),
  );
}

function cartao(e) {
  const eleito = e.eleitos[0];
  const base = e.pontos_atribuidos;
  const linhas = [];
  if (eleito) {
    linhas.push(
      h("span", { class: "cartao-linha" }, `Eleito: ${nomeCandidato(eleito)}`),
      h("span", { class: "cartao-linha muted" }, `${inteiro(eleito.pontos)} ${plural(eleito.pontos, PONTOS)} (${percentagem(eleito.pontos, base)})`),
    );
  }
  linhas.push(h("span", { class: "cartao-linha muted" }, `${inteiro(e.votantes)} de ${inteiro(e.inscritos)} votantes`));
  return h(
    "li",
    {},
    h(
      "a",
      { class: "cartao", href: ligacao(e) },
      h("span", { class: "cartao-ano" }, e.ano),
      h("span", { class: "cartao-corpo" }, h("span", { class: "cartao-titulo" }, e.titulo), linhas, divisao(e)),
    ),
  );
}

export function paginaInicio(dados) {
  const [ultima, ...anteriores] = dados.eleicoes;
  const no = h(
    "div",
    {},
    h(
      "div",
      { class: "apresentacao" },
      h("h1", {}, "Resultados eleitorais da CNA"),
      h("p", { class: "lead" }, "Registo de todos os resultados eleitorais verdadeiros e oficiais."),
    ),
  );
  if (!ultima) {
    no.append(h("p", { class: "aviso" }, "Ainda não há resultados registados."));
    return { titulo: "", no };
  }
  no.append(destaque(ultima));
  if (anteriores.length > 0) {
    no.append(
      h(
        "section",
        { "aria-labelledby": "titulo-anteriores" },
        h("h2", { id: "titulo-anteriores" }, "Eleições anteriores"),
        h("ul", { class: "cartoes" }, anteriores.map(cartao)),
      ),
    );
  }
  return { titulo: "", no };
}
