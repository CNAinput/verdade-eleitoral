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

function votosOutros(e) {
  return (e.outros || []).reduce((soma, o) => soma + o.votos, 0);
}

// Nos votos, o total inclui o que está fora da barra.
function total(e, campo) {
  const candidatos = e.candidatos.reduce((soma, c) => soma + c[campo], 0);
  return campo === "votos" ? candidatos + votosOutros(e) : candidatos;
}

function campoPrincipal(e) {
  return e.sistema === "votos" ? "votos" : "pontos";
}

function textoValor(c, campo, unidade, base) {
  return `${inteiro(c[campo])} ${plural(c[campo], unidade)} (${percentagem(c[campo], base)})`;
}

// Texto claro ou escuro, conforme o contraste.
function corSobre(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const luminancia = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return 1.05 / (luminancia + 0.05) >= 4.5 ? "#ffffff" : "#111611";
}

// Aplica a cor do partido ao elemento.
function colorir(elemento, cor) {
  elemento.classList.add("partido");
  if (!cor) return;
  elemento.style.setProperty("--cor", cor);
  elemento.style.setProperty("--sobre-cor", corSobre(cor));
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

// Segmentos proporcionais, um por item.
function segmentosDe(itens) {
  const base = itens.reduce((soma, i) => soma + i.valor, 0);
  const segmentos = itens.map((i) => {
    const segmento = h("span", { class: "segmento" });
    colorir(segmento, i.cor);
    segmento.style.flexGrow = String(base > 0 ? i.valor : 1);
    return segmento;
  });
  marcarRepetidas(itens, segmentos);
  return segmentos;
}

// Uma só barra para dois candidatos.
function duelo(e, campo, unidade) {
  const lados = ordenados(e, campoPrincipal(e));
  const base = total(e, campo);
  const segmentos = segmentosDe(lados.map((c) => ({ cor: c.cor, valor: c[campo] })));
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

// Votos que não são de nenhum candidato.
export function listaOutros(e) {
  const base = total(e, "votos");
  const fora = e.candidatos.length === 2;
  return h(
    "ul",
    { class: "brancos" },
    e.outros.map((o) => {
      const unidade = o.unidade || "voto";
      const texto = `${o.nome}: ${inteiro(o.votos)} ${plural(o.votos, [unidade, `${unidade}s`])} (${percentagem(o.votos, base)})`;
      return h("li", {}, texto, fora && " ", fora && h("span", { class: "muted" }, "(fora da barra)"));
    }),
  );
}

export function totalDeVotos(e) {
  return total(e, "votos");
}

export function linhaTotalVotos(e) {
  return e.inscritos ? `Inscritos: ${inteiro(e.inscritos)}.` : `Total de votos: ${inteiro(total(e, "votos"))}.`;
}

export function textoTotalCandidatos(e) {
  if (e.inscritos) return `${inteiro(e.inscritos)} inscritos`;
  const base = total(e, "votos");
  return `${inteiro(base)} ${plural(base, VOTOS)} no total`;
}

// Barra compacta: pontos ou opções do referendo.
export function divisao(e) {
  const itens =
    e.formato === "opcoes"
      ? opcoesNaBarra(e).map((o) => ({ cor: o.cor, valor: o.votos }))
      : ordenados(e, campoPrincipal(e)).map((c) => ({ cor: c.cor, valor: c[campoPrincipal(e)] }));
  return h("div", { class: "divisao-caixa" }, h("div", { class: "divisao", "aria-hidden": "true" }, segmentosDe(itens)), marcaMaioria(false));
}

function opcoesNaBarra(e) {
  return e.opcoes.filter((o) => !o.branco);
}

function votosTotais(e) {
  return e.opcoes.reduce((soma, o) => soma + o.votos, 0);
}

function textoOpcao(o, base) {
  return `${inteiro(o.votos)} ${plural(o.votos, VOTOS)} (${percentagem(o.votos, base)})`;
}

export function textoTotalVotos(e) {
  const base = votosTotais(e);
  return `${inteiro(base)} ${plural(base, VOTOS)} no total`;
}

export function fraseOpcao(e) {
  const naBarra = opcoesNaBarra(e);
  if (naBarra.length === 0) return "Sem resultado registado.";
  const maximo = Math.max(...naBarra.map((o) => o.votos));
  const lideres = naBarra.filter((o) => o.votos === maximo);
  if (lideres.length > 1) {
    return `Empate entre ${lideres.map((o) => o.nome).join(" e ")}, com ${inteiro(maximo)} ${plural(maximo, VOTOS)} cada.`;
  }
  return `Opção mais votada: ${lideres[0].nome}, com ${textoOpcao(lideres[0], votosTotais(e))}.`;
}

// Uma só barra: o branco fica de fora.
export function graficoReferendo(e) {
  const base = votosTotais(e);
  const naBarra = opcoesNaBarra(e);
  const brancos = e.opcoes.filter((o) => o.branco);
  const segmentos = segmentosDe(naBarra.map((o) => ({ cor: o.cor, valor: o.votos })));
  return h(
    "div",
    { class: "referendo" },
    h("div", { class: "duelo-meio" }, h("div", { class: "duelo-barra", "aria-hidden": "true" }, segmentos), marcaMaioria(true)),
    h(
      "ul",
      { class: "duelo-lados" },
      naBarra.map((o) =>
        h("li", { class: "duelo-lado" }, h("span", { class: "barra-nome" }, o.nome), h("span", { class: "barra-valor" }, textoOpcao(o, base))),
      ),
    ),
    brancos.length > 0 &&
      h(
        "ul",
        { class: "brancos" },
        brancos.map((o) => h("li", {}, `${o.nome}: ${textoOpcao(o, base)} `, h("span", { class: "muted" }, "(fora da barra)"))),
      ),
    h("p", { class: "total-votos muted" }, `Total de votos: ${inteiro(base)}.`),
  );
}
