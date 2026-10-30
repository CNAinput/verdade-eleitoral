import { avatar, colorir } from "./componentes.js";
import { h } from "./dom.js";
import { dataAbreviada, mesAno } from "./formato.js";
import { diasDe } from "./mandatos.js";

const REM_POR_ANO = 18;
const REM_POR_DIA = REM_POR_ANO / 365.25;
const LARGURA_EIXO = "3rem";
const TITULO = "Linha de tempo dos mandatos";

function posicionar(no, dias, inicio) {
  no.style.setProperty("--t", `${(dias - inicio) * REM_POR_DIA}rem`);
  return no;
}

// Quanto texto cabe na barra.
function densidade(altura) {
  if (altura >= 7.5) return "completo";
  if (altura >= 3.4) return "medio";
  if (altura >= 1.5) return "linha";
  return "nulo";
}

function datasDe(b) {
  const formato = b.mensal ? mesAno : dataAbreviada;
  return [formato(b.de), b.ate ? `até ${formato(b.ate)}` : "até à atualidade"];
}

function textoPartido(b) {
  return b.partidos.length > 0 ? `(${b.partidos.join(" → ")})` : "";
}

function nomeDe(b) {
  if (b.tipo === "vago") return "Vago";
  if (b.tipo === "sem-registo") return "Sem eleição registada";
  return b.nome;
}

function rotulo(b, dens) {
  const [inicio, fim] = datasDe(b);
  const pessoa = b.tipo === "pessoa";
  const nome = b.ligacao
    ? h("a", { class: "bloco-nome", href: b.ligacao, title: `Ver o resultado: ${b.eleicao}` }, b.nome)
    : h("span", { class: "bloco-nome" }, nomeDe(b));
  return h(
    "div",
    { class: ["bloco-rotulo", dens === "nulo" && "so-leitores"] },
    pessoa && dens === "completo" && avatar({ nome: b.nome, cor: b.cores[0] || null, foto: b.foto }),
    nome,
    pessoa && h("span", { class: "bloco-partido" }, textoPartido(b)),
    h(
      "span",
      { class: ["bloco-datas", dens !== "completo" && "so-leitores"] },
      h("span", { class: "data" }, inicio),
      " ",
      h("span", { class: "data" }, fim),
    ),
  );
}

function bloco(b, inicio, hoje) {
  const de = diasDe(b.de);
  if (de >= hoje) return null;
  const fim = Math.min(b.ate ? diasDe(b.ate) : hoje, hoje);
  const altura = (fim - de) * REM_POR_DIA;
  const dens = densidade(altura);
  const [primeira, segunda] = datasDe(b);
  const no = h("li", {
    class: ["bloco", `bloco-${b.tipo}`, `denso-${dens}`],
    title: `${nomeDe(b)} ${b.tipo === "pessoa" ? textoPartido(b) : ""}: ${primeira} ${segunda}`.replace(/\s+:/, ":"),
  });
  posicionar(no, de, inicio).style.setProperty("--a", `${altura}rem`);
  if (b.tipo === "pessoa") {
    colorir(no, b.cores[0] || null);
    if (b.cores.length > 1) {
      no.classList.add("mista");
      no.style.setProperty("--fundo-bloco", `linear-gradient(to bottom, ${b.cores.join(", ")})`);
    }
  }
  no.append(rotulo(b, dens));
  return no;
}

function cargo(c, inicio, hoje) {
  const faixas = h("div", { class: "faixas" });
  faixas.style.setProperty("--n", String(c.faixas.length));
  c.faixas.forEach((blocos, i) => {
    faixas.append(
      h(
        "ul",
        { class: "faixa", "aria-label": c.faixas.length > 1 ? `Faixa ${i + 1}` : null },
        blocos.map((b) => bloco(b, inicio, hoje)),
      ),
    );
  });
  return h("section", { class: "cargo", "aria-label": c.nome }, faixas);
}

function topo(cargos) {
  return h(
    "div",
    { class: "linha-topo", "aria-hidden": "true" },
    h("span", { class: "linha-canto" }),
    cargos.map((c) =>
      h("div", { class: "cargo-titulo" }, h("span", { class: "cargo-nome" }, c.nome), c.subtitulo && h("small", { class: "cargo-sub" }, c.subtitulo)),
    ),
  );
}

// Marcas dos anos e linha de hoje.
function eixo(m, inicio, hoje) {
  const rotulos = [];
  const linhas = [];
  for (let ano = Number(m.primeiro.slice(0, 4)); ano <= Number(m.hoje.slice(0, 4)); ano++) {
    const dias = diasDe(`${ano}-01-01`);
    rotulos.push(posicionar(h("span", { class: "eixo-ano" }, ano), dias, inicio));
    linhas.push(posicionar(h("div", { class: "guia" }), dias, inicio));
  }
  const marcador = posicionar(h("span", { class: "eixo-hoje" }, "Hoje"), hoje, inicio);
  linhas.push(posicionar(h("div", { class: "guia guia-hoje" }), hoje, inicio));
  return {
    coluna: h("div", { class: "eixo", "aria-hidden": "true" }, rotulos, marcador),
    guias: h("div", { class: "guias", "aria-hidden": "true" }, linhas),
    marcador,
  };
}

function legenda(m, partidos) {
  const blocos = m.cargos.flatMap((c) => c.faixas.flat());
  const usados = new Set(blocos.flatMap((b) => b.partidos || []));
  const itens = Object.keys(partidos)
    .filter((sigla) => usados.has(sigla))
    .map((sigla) => {
      const cor = h("span", { class: "legenda-cor", "aria-hidden": "true" });
      colorir(cor, partidos[sigla].cor);
      return h("li", {}, cor, sigla);
    });
  itens.push(h("li", {}, h("span", { class: "legenda-cor legenda-vago", "aria-hidden": "true" }), "Vago"));
  if (blocos.some((b) => b.tipo === "sem-registo")) {
    itens.push(h("li", {}, h("span", { class: "legenda-cor legenda-sem-registo", "aria-hidden": "true" }), "Sem eleição registada"));
  }
  return h("ul", { class: "legenda", "aria-label": "Legenda das cores" }, itens);
}

function semMandatos() {
  return {
    titulo: TITULO,
    no: h(
      "div",
      {},
      h("p", { class: "migalhas" }, h("a", { href: "#/" }, "← Todas as eleições")),
      h("h1", {}, TITULO),
      h("p", { class: "aviso" }, "Não foi possível carregar os mandatos. Tenta novamente daqui a pouco."),
    ),
  };
}

export function paginaMandatos(dados) {
  const m = dados.mandatos;
  if (!m || !m.primeiro) return semMandatos();
  const inicio = diasDe(`${m.primeiro.slice(0, 4)}-01-01`);
  const hoje = diasDe(m.hoje);
  const { coluna, guias, marcador } = eixo(m, inicio, hoje);

  const linha = h(
    "div",
    { class: "linha" },
    topo(m.cargos),
    h("div", { class: "linha-corpo" }, guias, coluna, m.cargos.map((c) => cargo(c, inicio, hoje))),
  );
  linha.style.setProperty("--altura", `${(hoje - inicio) * REM_POR_DIA}rem`);
  linha.style.setProperty("--eixo", LARGURA_EIXO);
  linha.style.setProperty("--colunas", `${LARGURA_EIXO} ${m.cargos.map((c) => `minmax(0, ${c.faixas.length}fr)`).join(" ")}`);

  const estreito = window.matchMedia("(max-width: 46rem)").matches;
  const janela = h(
    "div",
    { class: "linha-janela", role: estreito ? "region" : null, "aria-label": estreito ? TITULO : null, tabindex: estreito ? "0" : null },
    linha,
  );

  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const botao = h("button", { class: "botao", type: "button" }, "Ir para a atualidade");
  botao.addEventListener("click", () => marcador.scrollIntoView({ block: "center", behavior: reduzir ? "auto" : "smooth" }));

  const no = h(
    "article",
    {},
    h("p", { class: "migalhas" }, h("a", { href: "#/" }, "← Todas as eleições")),
    h("p", { class: "sobretitulo" }, "Mandatos"),
    h("h1", {}, TITULO),
    h("p", { class: "lead" }, `Quem ocupou cada cargo desde ${m.primeiro.slice(0, 4)}. A cor de cada barra é a cor do partido.`),
    h("div", { class: "linha-ferramentas" }, botao, legenda(m, dados.partidos)),
    janela,
    h(
      "p",
      { class: "nota muted" },
      "O Porta-Voz vem das eleições registadas, com precisão de mês. Cada mandato dura até à eleição seguinte e o da última eleição registada termina em abril ou outubro.",
    ),
  );
  return { titulo: TITULO, no };
}
