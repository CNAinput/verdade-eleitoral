import { h } from "./dom.js";
import {
  fraseOpcao,
  fraseVencedor,
  grafico,
  graficoReferendo,
  linhaTotalVotos,
  listaOutros,
  pista,
  PONTOS,
  selo,
  vistaRonda,
  VOTOS,
} from "./componentes.js";
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

function vizinhas(e) {
  if (!e.anterior && !e.seguinte) return null;
  return h(
    "nav",
    { class: "vizinhas", "aria-label": "Outras eleições do mesmo tipo" },
    vizinha(e.anterior, "anterior"),
    vizinha(e.seguinte, "seguinte"),
  );
}

function quadro(id, titulo, ...filhos) {
  return h("section", { class: "quadro", "aria-labelledby": id }, h("h2", { id }, titulo), filhos);
}

function bannerVencedor(e) {
  return h("p", { class: "vencedor" }, e.eleitos.length > 0 && selo("Eleito"), h("span", {}, fraseVencedor(e)));
}

function pagina(e, ...blocos) {
  const no = h(
    "article",
    {},
    h("p", { class: "migalhas" }, h("a", { href: "#/" }, "← Todas as eleições")),
    h("p", { class: "sobretitulo" }, "Resultado"),
    h("h1", {}, e.titulo),
    blocos,
    (e.notas || []).length > 0 && h("ul", { class: "notas" }, e.notas.map((nota) => h("li", {}, nota))),
    vizinhas(e),
  );
  return { titulo: e.titulo, no };
}

function paginaReferendo(e) {
  return pagina(
    e,
    h("p", { class: "pergunta" }, e.pergunta),
    h("p", { class: "vencedor" }, h("span", {}, fraseOpcao(e))),
    quadro("titulo-resultado", "Votos", graficoReferendo(e)),
  );
}

function quadroVotos(id, titulo, vista) {
  return quadro(
    id,
    titulo,
    grafico(vista, "votos", VOTOS),
    (vista.outros || []).length > 0 && listaOutros(vista),
    h("p", { class: "total-votos muted" }, linhaTotalVotos(vista)),
  );
}

function paginaVotos(e) {
  const quadros =
    e.rondas.length > 1
      ? e.rondas.map((r, i) => quadroVotos(`titulo-volta-${i + 1}`, r.nome, vistaRonda(e, r)))
      : [quadroVotos("titulo-votos", "Votos", e)];
  return pagina(e, bannerVencedor(e), quadros);
}

function paginaPontos(e) {
  return pagina(
    e,
    bannerVencedor(e),
    quadro("titulo-primeira", "Como 1ª escolha", grafico(e, "primeira_escolha", VOTOS)),
    quadro("titulo-pontos", "Pontos", grafico(e, "pontos", PONTOS)),
    quadro(
      "titulo-participacao",
      "Participação",
      h(
        "div",
        { class: "duas-colunas" },
        estatistica(e.votantes, e.inscritos, "votantes compareceram"),
        estatistica(e.pontos_atribuidos, e.pontos_possiveis, "pontos atribuídos"),
      ),
    ),
  );
}

export function paginaEleicao(dados, id) {
  const e = dados.porId.get(id);
  if (!e) return null;
  if (e.formato === "opcoes") return paginaReferendo(e);
  return e.sistema === "votos" ? paginaVotos(e) : paginaPontos(e);
}
