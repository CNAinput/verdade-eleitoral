const MS_DIA = 86400000;

export function diasDe(iso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return Math.round(Date.UTC(ano, mes - 1, dia) / MS_DIA);
}

function isoDe(ano, mes) {
  return `${ano}-${String(mes).padStart(2, "0")}-01`;
}

// Próximo abril ou outubro depois da eleição.
function fimPrevisto(data) {
  const [ano, mes] = data.split("-").map(Number);
  if (mes < 4) return isoDe(ano, 4);
  if (mes < 10) return isoDe(ano, 10);
  return isoDe(ano + 1, 4);
}

function siglasDe(valor) {
  if (Array.isArray(valor)) return valor;
  return valor ? [valor] : [];
}

function pessoa(b, contexto) {
  const partidos = siglasDe(b.partido);
  return {
    tipo: "pessoa",
    nome: b.nome,
    partidos,
    cores: partidos.map((sigla) => (contexto.partidos[sigla] || {}).cor).filter(Boolean),
    mudanca: b.mudanca || null,
    foto: contexto.fotos[b.nome] || null,
    de: b.de,
    ate: b.ate || null,
    mensal: Boolean(b.mensal),
    fimMensal: Boolean(b.fimMensal),
    ligacao: b.ligacao || null,
    eleicao: b.eleicao || null,
  };
}

function faixaManual(blocos, contexto) {
  return blocos.map((b) => (b.vago ? { tipo: "vago", de: b.de, ate: b.ate || null } : pessoa(b, contexto)));
}

// Cada eleição vale até à seguinte.
function faixaDeEleicoes(tipo, contexto) {
  const lista = contexto.eleicoes
    .filter((e) => e.tipo === tipo && e.data && e.eleitos.length > 0)
    .sort((a, b) => a.data.localeCompare(b.data) || b.posicao - a.posicao);
  const blocos = lista.map((e, i) => {
    const seguinte = lista[i + 1];
    return pessoa(
      {
        ...e.eleitos[0],
        de: e.data,
        ate: seguinte ? seguinte.data : fimPrevisto(e.data),
        fimMensal: !seguinte,
        ligacao: `#/eleicao/${e.id}`,
        eleicao: e.titulo,
      },
      contexto,
    );
  });
  const ultimo = blocos[blocos.length - 1];
  if (ultimo && diasDe(ultimo.ate) < diasDe(contexto.hoje)) {
    blocos.push({ tipo: "sem-registo", de: ultimo.ate, ate: null, mensal: true });
  }
  return blocos;
}

// Eleições do tipo que levam cartão.
function cartoesDe(spec, contexto) {
  if (!spec) return null;
  const itens = contexto.eleicoes.filter((e) => e.tipo === spec.eleicoes && e.data);
  return { lado: spec.lado, itens };
}

// Normaliza os blocos de cada cargo.
export function prepararMandatos(bruto, contexto) {
  const cargos = (bruto.cargos || []).map((c) => ({
    id: c.id,
    nome: c.nome,
    subtitulo: c.subtitulo || null,
    faixas: c.eleicoes ? [faixaDeEleicoes(c.eleicoes, contexto)] : (c.faixas || []).map((f) => faixaManual(f, contexto)),
    cartoes: cartoesDe(c.cartoes, contexto),
  }));
  const inicios = cargos.flatMap((c) => c.faixas.flat()).map((b) => b.de).sort();
  return { cargos, primeiro: inicios[0] || null, hoje: contexto.hoje };
}
