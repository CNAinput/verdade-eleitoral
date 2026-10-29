import { carregar } from "./dados.js";
import { h, limpar } from "./dom.js";
import { paginaEleicao } from "./eleicao.js";
import { paginaInicio } from "./inicio.js";

const NOME = "Verdade Eleitoral";

const ROTAS = [
  { padrao: /^\/?$/, pagina: paginaInicio },
  { padrao: /^\/eleicao\/([a-z0-9_-]+)$/, pagina: paginaEleicao },
];

let primeira = true;

function naoEncontrada() {
  return {
    titulo: "Página não encontrada",
    no: h("div", {}, h("h1", {}, "Página não encontrada"), h("p", {}, h("a", { href: "#/" }, "Voltar aos resultados"))),
  };
}

function erroDeCarregamento() {
  return {
    titulo: "Erro",
    no: h("div", {}, h("h1", {}, "Não foi possível carregar os resultados"), h("p", { class: "aviso" }, "Tenta novamente daqui a pouco.")),
  };
}

function resolver(dados) {
  const caminho = location.hash.replace(/^#/, "") || "/";
  for (const rota of ROTAS) {
    const achado = rota.padrao.exec(caminho);
    if (achado) return rota.pagina(dados, ...achado.slice(1)) || naoEncontrada();
  }
  return naoEncontrada();
}

async function mostrar() {
  let pagina;
  try {
    pagina = resolver(await carregar());
  } catch (erro) {
    console.error(erro);
    pagina = erroDeCarregamento();
  }
  const raiz = document.getElementById("conteudo");
  limpar(raiz).append(pagina.no);
  document.title = pagina.titulo ? `${pagina.titulo} · ${NOME}` : NOME;
  if (primeira) {
    primeira = false;
    return;
  }
  window.scrollTo(0, 0);
  const titulo = raiz.querySelector("h1");
  if (titulo) {
    titulo.tabIndex = -1;
    titulo.focus({ preventScroll: true });
  }
  document.getElementById("anuncios").textContent = document.title;
}

window.addEventListener("hashchange", mostrar);
mostrar();
