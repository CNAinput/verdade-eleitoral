import { h } from "./dom.js";
import { inteiro, percentagem, plural } from "./formato.js";

export const VOTOS = ["voto", "votos"];
export const PONTOS = ["ponto", "pontos"];

export function nomeCandidato(c) {
  return c.partido ? `${c.nome} (${c.partido})` : c.nome;
}

export function fraseVencedor(e) {
  if (e.eleitos.length === 0) return "Sem vencedor registado.";
  if (e.eleitos.length > 1) return `Eleitos: ${e.eleitos.map(nomeCandidato).join(", ")}.`;
  const { cargo, artigo } = e.tipoInfo;
  const ate = e.mandato_ate ? ` até ${e.mandato_ate}` : "";
  const futuro = cargo ? ` e será ${artigo || "o"} ${cargo}${ate}` : "";
  return `${nomeCandidato(e.eleitos[0])} vence as eleições${futuro}.`;
}

export function selo(texto) {
  return h("span", { class: "selo" }, texto);
}

function ordenados(e, campo) {
  return [...e.candidatos].sort((a, b) => b[campo] - a[campo]);
}

function total(e, campo) {
  return e.candidatos.reduce((soma, c) => soma + c[campo], 0);
}

function preencher(largura, destacado) {
  const enchimento = h("span", { class: ["enchimento", destacado && "destacado"] });
  enchimento.style.width = `${largura}%`;
  return enchimento;
}

export function pista(largura, destacado) {
  return h("div", { class: "pista", "aria-hidden": "true" }, preencher(largura, destacado));
}

// Barras horizontais, uma por candidato.
export function barras(e, campo, unidade) {
  const base = total(e, campo);
  return h(
    "ul",
    { class: "barras" },
    ordenados(e, campo).map((c) =>
      h(
        "li",
        { class: "barra" },
        h(
          "div",
          { class: "barra-texto" },
          h("span", { class: "barra-nome" }, nomeCandidato(c), c.eleito && selo("Eleito")),
          h("span", { class: "barra-valor" }, `${inteiro(c[campo])} ${plural(c[campo], unidade)} (${percentagem(c[campo], base)})`),
        ),
        pista(base > 0 ? (c[campo] / base) * 100 : 0, c.eleito),
      ),
    ),
  );
}

// Barra única repartida pelos pontos.
export function divisao(e) {
  const base = total(e, "pontos");
  const segmentos = ordenados(e, "pontos").map((c) => {
    const segmento = h("span", { class: ["segmento", c.eleito && "destacado"] });
    segmento.style.width = `${base > 0 ? (c.pontos / base) * 100 : 0}%`;
    return segmento;
  });
  return h("div", { class: "divisao", "aria-hidden": "true" }, segmentos);
}
