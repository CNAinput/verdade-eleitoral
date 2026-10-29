import { h } from "./dom.js";
import { fraseVencedor, grafico, pista, PONTOS, selo, VOTOS } from "./componentes.js";
import { inteiro, percentagem } from "./formato.js";

function estatistica(parte, total, legenda) {
  return h(
    "div",
    { class: "estatistica" },
    h("p", { class: "estatistica-valor" }, `${inteiro(parte)} de ${inteiro(total)}`),
    h("p", { class: "estatistica-legenda" }, legenda, " ", h("span", { class: "muted" }, `(${percentagem(parte, total)})`)),
    pista(total > 0 ? (parte / total) * 100 : 0),
  );
}

function vizinha(e, sentido) {
  if (!e) return h("span", {});
  const anterior = sentido === "anterior";
  return h(
    "a",
    { class: ["vizinha", anterior ? "anterior" : "seguinte"], href: `#/eleicao/${e.id}` },
    h("span", { class: "vizinha-sentido" }, anterior ? "← Anterior" : "Seguinte →"),
    h("span", { class: "vizinha-titulo" }, e.titulo),
  );
}

export function paginaEleicao(dados, id) {
  const e = dados.porId.get(id);
  if (!e) return null;
  const no = h(
    "article",
    {},
    h("p", { class: "migalhas" }, h("a", { href: "#/" }, "← Todas as eleições")),
    h("p", { class: "sobretitulo" }, "Resultado"),
    h("h1", {}, e.titulo),
    h("p", { class: "vencedor" }, e.eleitos.length > 0 && selo("Eleito"), h("span", {}, fraseVencedor(e))),
    h(
      "section",
      { class: "quadro", "aria-labelledby": "titulo-primeira" },
      h("h2", { id: "titulo-primeira" }, "Como 1ª escolha"),
      grafico(e, "primeira_escolha", VOTOS),
    ),
    h(
      "section",
      { class: "quadro", "aria-labelledby": "titulo-pontos" },
      h("h2", { id: "titulo-pontos" }, "Pontos"),
      grafico(e, "pontos", PONTOS),
    ),
    h(
      "section",
      { class: "quadro", "aria-labelledby": "titulo-participacao" },
      h("h2", { id: "titulo-participacao" }, "Participação"),
      h(
        "div",
        { class: "duas-colunas" },
        estatistica(e.votantes, e.inscritos, "votantes compareceram"),
        estatistica(e.pontos_atribuidos, e.pontos_possiveis, "pontos atribuídos"),
      ),
    ),
    (e.notas || []).length > 0 && h("ul", { class: "notas" }, e.notas.map((nota) => h("li", {}, nota))),
    h("nav", { class: "vizinhas", "aria-label": "Outras eleições do mesmo tipo" }, vizinha(e.anterior, "anterior"), vizinha(e.seguinte, "seguinte")),
  );
  return { titulo: e.titulo, no };
}
