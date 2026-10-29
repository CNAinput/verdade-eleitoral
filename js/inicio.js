import { h } from "./dom.js";
import {
  divisao,
  fraseOpcao,
  fraseVencedor,
  graficoReferendo,
  grafico,
  listaOutros,
  nomeCandidato,
  PONTOS,
  textoTotalCandidatos,
  textoTotalVotos,
  totalDeVotos,
  VOTOS,
} from "./componentes.js";
import { inteiro, percentagem, plural } from "./formato.js";

function ligacao(e) {
  return `#/eleicao/${e.id}`;
}

function corpoDestaque(e) {
  if (e.formato === "opcoes") {
    return [h("p", { class: "pergunta" }, e.pergunta), h("p", { class: "frase-vencedor" }, fraseOpcao(e)), graficoReferendo(e)];
  }
  if (e.sistema === "votos") {
    return [
      h("p", { class: "frase-vencedor" }, fraseVencedor(e)),
      h("h3", {}, "Votos"),
      grafico(e, "votos", VOTOS),
      (e.outros || []).length > 0 && listaOutros(e),
    ];
  }
  return [
    h("p", { class: "frase-vencedor" }, fraseVencedor(e)),
    h(
      "div",
      { class: "duas-colunas" },
      h("div", {}, h("h3", {}, "Como 1ª escolha"), grafico(e, "primeira_escolha", VOTOS)),
      h("div", {}, h("h3", {}, "Pontos"), grafico(e, "pontos", PONTOS)),
    ),
  ];
}

function destaque(e) {
  return h(
    "section",
    { class: "destaque", "aria-labelledby": "titulo-destaque" },
    h("p", { class: "sobretitulo" }, "Última eleição"),
    h("h2", { id: "titulo-destaque" }, h("a", { href: ligacao(e) }, e.titulo)),
    corpoDestaque(e),
    h("p", { class: "mais" }, h("a", { href: ligacao(e) }, "Ver o resultado completo")),
  );
}

function linhasCartao(e) {
  if (e.formato === "opcoes") {
    return [
      h("span", { class: "cartao-pergunta" }, e.pergunta),
      h("span", { class: "cartao-linha" }, fraseOpcao(e)),
      h("span", { class: "cartao-linha muted" }, textoTotalVotos(e)),
    ];
  }
  const eleito = e.eleitos[0];
  const votos = e.sistema === "votos";
  const linhas = [];
  if (eleito) {
    const valor = votos ? eleito.votos : eleito.pontos;
    const base = votos ? totalDeVotos(e) : e.pontos_atribuidos;
    linhas.push(
      h("span", { class: "cartao-linha" }, `Eleito: ${nomeCandidato(eleito)}`),
      h("span", { class: "cartao-linha muted" }, `${inteiro(valor)} ${plural(valor, votos ? VOTOS : PONTOS)} (${percentagem(valor, base)})`),
    );
  }
  linhas.push(
    h("span", { class: "cartao-linha muted" }, votos ? textoTotalCandidatos(e) : `${inteiro(e.votantes)} de ${inteiro(e.inscritos)} votantes`),
  );
  return linhas;
}

function cartao(e) {
  return h(
    "li",
    {},
    h(
      "a",
      { class: "cartao", href: ligacao(e) },
      h("span", { class: "cartao-ano" }, e.ano),
      h("span", { class: "cartao-corpo" }, h("span", { class: "cartao-titulo" }, e.titulo), linhasCartao(e), divisao(e)),
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
