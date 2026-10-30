import { dataCurta, hojeIso } from "./formato.js";
import { prepararMandatos } from "./mandatos.js";
import { validar, validarMandatos } from "./validar.js";

const ENDERECO = "dados/eleicoes.json";
const ENDERECO_MANDATOS = "dados/mandatos.json";

let promessa = null;

function preparar(bruto) {
  const tipos = bruto.tipos || {};
  const partidos = bruto.partidos || {};
  const respostas = bruto.respostas || {};
  const fotos = bruto.fotos || {};
  const eleicoes = (bruto.eleicoes || []).map((e, posicao) => {
    const enriquecer = (lista) =>
      (lista || []).map((c) => ({
        ...c,
        cor: (partidos[c.partido] || {}).cor || null,
        foto: fotos[c.nome] || null,
      }));
    const rondas = (e.rondas || []).map((r) => ({ ...r, candidatos: enriquecer(r.candidatos), outros: r.outros || [] }));
    const final = rondas[rondas.length - 1];
    const candidatos = final ? final.candidatos : enriquecer(e.candidatos);
    const opcoes = (e.opcoes || []).map((o) => ({
      ...o,
      cor: (respostas[o.nome] || {}).cor || null,
    }));
    const tipoInfo = tipos[e.tipo] || {};
    return {
      ...e,
      candidatos,
      outros: final ? final.outros : e.outros,
      rondas,
      opcoes,
      posicao,
      tipoInfo,
      formato: tipoInfo.formato || "candidatos",
      titulo: e.titulo || `${tipoInfo.nome || e.tipo} ${e.data ? dataCurta(e.data) : e.ano}`,
      eleitos: candidatos.filter((c) => c.eleito),
    };
  });
  eleicoes.sort((a, b) => b.ano - a.ano || a.posicao - b.posicao);

  const porId = new Map(eleicoes.map((e) => [e.id, e]));
  const porTipo = new Map();
  for (const e of eleicoes) {
    if (!porTipo.has(e.tipo)) porTipo.set(e.tipo, []);
    porTipo.get(e.tipo).push(e);
  }
  for (const lista of porTipo.values()) {
    lista.forEach((e, i) => {
      e.seguinte = lista[i - 1] || null;
      e.anterior = lista[i + 1] || null;
    });
  }
  return { eleicoes, porId, partidos, fotos };
}

async function lerJson(endereco) {
  const resposta = await fetch(endereco, { cache: "no-cache" });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json();
}

// Falha só a linha de tempo.
function prepararMandatosSeguro(brutoMandatos, bruto, dados) {
  if (!brutoMandatos) return null;
  for (const problema of validarMandatos(brutoMandatos, bruto)) console.warn(`Dados: ${problema}`);
  return prepararMandatos(brutoMandatos, { ...dados, hoje: hojeIso() });
}

async function ler() {
  const [bruto, brutoMandatos] = await Promise.all([lerJson(ENDERECO), lerJson(ENDERECO_MANDATOS).catch(() => null)]);
  for (const problema of validar(bruto)) console.warn(`Dados: ${problema}`);
  const dados = preparar(bruto);
  return { ...dados, mandatos: prepararMandatosSeguro(brutoMandatos, bruto, dados) };
}

export function carregar() {
  if (!promessa) {
    promessa = ler().catch((erro) => {
      promessa = null;
      throw erro;
    });
  }
  return promessa;
}
