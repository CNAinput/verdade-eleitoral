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

function textoValor(c, campo, unidade, base) {
  return `${inteiro(c[campo])} ${plural(c[campo], unidade)} (${percentagem(c[campo], base)})`;
}

// Aplica a cor do partido ao elemento.
function colorir(elemento, cor) {
  elemento.classList.add("partido");
  if (cor) elemento.style.setProperty("--cor", cor);
}

// Distingue segmentos vizinhos com a mesma cor.
function marcarRepetidas(candidatos, segmentos) {
  segmentos.forEach((segmento, i) => {
    const cor = candidatos[i].cor || null;
    if (candidatos.slice(0, i).some((outro) => (outro.cor || null) === cor)) {
      segmento.classList.add("repetida");
    }
  });
}

export function avatar(c) {
  const inicial = h("span", { class: "foto-inicial" }, (c.nome || "?").charAt(0).toUpperCase());
  const no = h("span", { class: "foto", "aria-hidden": "true" });
  colorir(no, c.cor);
  if (c.foto) {
    const imagem = h("img", { src: c.foto, alt: "", width: 64, height: 64 });
    imagem.addEventListener("error", () => imagem.replaceWith(inicial));
    no.append(imagem);
  } else {
    no.append(inicial);
  }
  return no;
}

// Barra de participação, sem partido.
export function pista(largura) {
  const enchimento = h("span", { class: "enchimento destacado" });
  enchimento.style.width = `${largura}%`;
  return h("div", { class: "pista", "aria-hidden": "true" }, enchimento);
}

// Linha a meio que assinala a maioria.
function marcaMaioria(rotulo) {
  return h("span", { class: "maioria", "aria-hidden": "true" }, rotulo && h("span", { class: "maioria-rotulo" }, "Maioria"));
}

function pistaPartido(largura, c) {
  const enchimento = h("span", { class: "enchimento" });
  colorir(enchimento, c.cor);
  enchimento.style.width = `${largura}%`;
  return h("div", { class: "pista-caixa" }, h("div", { class: "pista", "aria-hidden": "true" }, enchimento), marcaMaioria(false));
}

// Barras separadas, uma por candidato.
function barras(e, campo, unidade) {
  const base = total(e, campo);
  return h(
    "ul",
    { class: "barras" },
    ordenados(e, campo).map((c) =>
      h(
        "li",
        { class: "barra" },
        avatar(c),
        h(
          "div",
          { class: "barra-corpo" },
          h(
            "div",
            { class: "barra-texto" },
            h("span", { class: "barra-nome" }, nomeCandidato(c), c.eleito && selo("Eleito")),
            h("span", { class: "barra-valor" }, textoValor(c, campo, unidade, base)),
          ),
          pistaPartido(base > 0 ? (c[campo] / base) * 100 : 0, c),
        ),
      ),
    ),
  );
}

function ladoDuelo(c, campo, unidade, base) {
  return h(
    "li",
    { class: "duelo-lado" },
    h("span", { class: "barra-nome" }, nomeCandidato(c), c.eleito && selo("Eleito")),
    h("span", { class: "barra-valor" }, textoValor(c, campo, unidade, base)),
  );
}

// Uma só barra para dois candidatos.
function duelo(e, campo, unidade) {
  const lados = ordenados(e, "pontos");
  const base = total(e, campo);
  const segmentos = lados.map((c) => {
    const segmento = h("span", { class: "segmento" });
    colorir(segmento, c.cor);
    segmento.style.flexGrow = String(base > 0 ? c[campo] : 1);
    return segmento;
  });
  marcarRepetidas(lados, segmentos);
  return h(
    "div",
    { class: "duelo" },
    avatar(lados[0]),
    h("div", { class: "duelo-meio" }, h("div", { class: "duelo-barra", "aria-hidden": "true" }, segmentos), marcaMaioria(true)),
    avatar(lados[1]),
    h("ul", { class: "duelo-lados" }, lados.map((c) => ladoDuelo(c, campo, unidade, base))),
  );
}

export function grafico(e, campo, unidade) {
  return e.candidatos.length === 2 ? duelo(e, campo, unidade) : barras(e, campo, unidade);
}

// Barra compacta repartida pelos pontos.
export function divisao(e) {
  const base = total(e, "pontos");
  const lados = ordenados(e, "pontos");
  const segmentos = lados.map((c) => {
    const segmento = h("span", { class: "segmento" });
    colorir(segmento, c.cor);
    segmento.style.flexGrow = String(base > 0 ? c.pontos : 1);
    return segmento;
  });
  marcarRepetidas(lados, segmentos);
  return h("div", { class: "divisao-caixa" }, h("div", { class: "divisao", "aria-hidden": "true" }, segmentos), marcaMaioria(false));
}
