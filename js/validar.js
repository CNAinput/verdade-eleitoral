// Devolve a lista de problemas.

function inteiroNaoNegativo(valor) {
  return Number.isInteger(valor) && valor >= 0;
}

function soma(lista, campo) {
  return lista.reduce((total, item) => total + item[campo], 0);
}

function validarCandidato(c, partidos, campos, erro) {
  if (!c.nome) erro("candidato sem nome");
  if (c.partido && !partidos[c.partido]) erro(`partido ${c.partido} sem cor em "partidos"`);
  for (const campo of campos) {
    if (!inteiroNaoNegativo(c[campo])) erro(`${c.nome}: ${campo} inválido`);
  }
}

function validarEleitos(candidatos, campo, erro) {
  const eleitos = candidatos.filter((c) => c.eleito);
  const outros = candidatos.filter((c) => !c.eleito);
  if (eleitos.length === 0) erro("sem eleito");
  const melhorOutro = Math.max(0, ...outros.map((c) => c[campo]));
  if (eleitos.some((c) => c[campo] < melhorOutro)) erro(`há um eleito com menos ${campo} que um não eleito`);
}

function validarPontos(e, partidos, erro) {
  for (const campo of ["votantes", "inscritos", "pontos_atribuidos", "pontos_possiveis"]) {
    if (!inteiroNaoNegativo(e[campo])) erro(`${campo} inválido`);
  }
  if (e.votantes > e.inscritos) erro("há mais votantes do que inscritos");
  if (e.pontos_atribuidos > e.pontos_possiveis) erro("há mais pontos atribuídos do que possíveis");

  const candidatos = Array.isArray(e.candidatos) ? e.candidatos : [];
  if (candidatos.length === 0) return erro("sem candidatos");
  for (const c of candidatos) validarCandidato(c, partidos, ["primeira_escolha", "pontos"], erro);
  if (soma(candidatos, "primeira_escolha") !== e.votantes) {
    erro("a soma da 1ª escolha não é igual aos votantes");
  }
  if (soma(candidatos, "pontos") !== e.pontos_atribuidos) {
    erro("a soma dos pontos não é igual aos pontos atribuídos");
  }
  validarEleitos(candidatos, "pontos", erro);
}

function validarVotos(e, partidos, erro, exigirEleito) {
  const candidatos = Array.isArray(e.candidatos) ? e.candidatos : [];
  const outros = Array.isArray(e.outros) ? e.outros : [];
  if (candidatos.length === 0) return erro("sem candidatos");
  for (const c of candidatos) validarCandidato(c, partidos, ["votos"], erro);
  for (const o of outros) {
    if (!o.nome) erro("categoria sem nome");
    if (!inteiroNaoNegativo(o.votos)) erro(`${o.nome}: votos inválidos`);
  }
  if (e.inscritos !== undefined) {
    if (!inteiroNaoNegativo(e.inscritos)) erro("inscritos inválido");
    else if (soma(candidatos, "votos") + soma(outros, "votos") !== e.inscritos) {
      erro("os votos e as outras categorias não somam os inscritos");
    }
  }
  if (exigirEleito) validarEleitos(candidatos, "votos", erro);
}

function validarRondas(e, partidos, erro) {
  const rondas = Array.isArray(e.rondas) ? e.rondas : [];
  if (rondas.length < 2) return erro("rondas pede pelo menos 2 voltas");
  rondas.forEach((ronda, i) => {
    if (!ronda.nome) erro(`volta ${i + 1} sem nome`);
    validarVotos(ronda, partidos, (texto) => erro(`${ronda.nome || `volta ${i + 1}`}: ${texto}`), i === rondas.length - 1);
  });
}

function validarOpcoes(e, respostas, erro) {
  if (!e.pergunta) erro("sem pergunta");
  const opcoes = Array.isArray(e.opcoes) ? e.opcoes : [];
  const naBarra = opcoes.filter((o) => !o.branco);
  if (naBarra.length < 2) return erro("menos de 2 opções na barra");
  if (new Set(opcoes.map((o) => o.nome)).size !== opcoes.length) erro("opções repetidas");
  for (const o of opcoes) {
    if (!o.nome) erro("opção sem nome");
    if (!inteiroNaoNegativo(o.votos)) erro(`${o.nome}: votos inválidos`);
  }
  for (const o of naBarra) {
    if (!respostas[o.nome]) erro(`opção ${o.nome} sem cor em "respostas"`);
  }
}

function validarEleicao(e, tipos, partidos, respostas, problemas) {
  const ref = e.id || "(sem id)";
  const erro = (texto) => problemas.push(`${ref}: ${texto}`);

  const tipo = tipos[e.tipo];
  if (!tipo) erro(`tipo "${e.tipo}" não existe em "tipos"`);
  if (!Number.isInteger(e.ano)) erro("ano inválido");
  if (e.data !== undefined) {
    if (!dataValida(e.data)) erro("data inválida");
    else if (Number(e.data.slice(0, 4)) !== e.ano) erro("a data não é do ano indicado");
  }
  if (e.sistema !== undefined && e.sistema !== "pontos" && e.sistema !== "votos") erro(`sistema "${e.sistema}" desconhecido`);
  if (tipo && tipo.formato === "opcoes") validarOpcoes(e, respostas, erro);
  else if (e.sistema === "votos") {
    if (e.rondas !== undefined) validarRondas(e, partidos, erro);
    else validarVotos(e, partidos, erro, true);
  } else {
    if (e.rondas !== undefined) erro("rondas só existe no sistema votos");
    validarPontos(e, partidos, erro);
  }
}

function validarCores(mapa, problemas) {
  for (const [chave, valor] of Object.entries(mapa)) {
    if (!/^#[0-9a-f]{6}$/i.test(valor.cor || "")) problemas.push(`${chave}: cor inválida`);
  }
}

function dataValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto || "")) return false;
  const [ano, mes, dia] = texto.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

function validarBloco(b, partidos, erro) {
  if (!dataValida(b.de)) erro(`${b.nome || "bloco"}: início inválido`);
  if (b.ate !== null && b.ate !== undefined) {
    if (!dataValida(b.ate)) erro(`${b.nome || "bloco"}: fim inválido`);
    else if (dataValida(b.de) && b.ate <= b.de) erro(`${b.nome || "bloco"}: fim antes do início`);
  }
  if (b.vago) {
    if (b.nome) erro("vago com nome");
    return;
  }
  if (!b.nome) erro("mandato sem nome");
  const siglas = Array.isArray(b.partido) ? b.partido : b.partido ? [b.partido] : [];
  if (Array.isArray(b.partido) && siglas.length !== 2) erro(`${b.nome}: a lista de partidos pede dois`);
  for (const sigla of siglas) {
    if (!partidos[sigla]) erro(`${b.nome}: partido ${sigla} sem cor em "partidos"`);
  }
  if (b.mudanca !== undefined) {
    if (siglas.length !== 2) erro(`${b.nome}: mudanca pede dois partidos`);
    if (!dataValida(b.mudanca)) erro(`${b.nome}: data da mudança inválida`);
    else if (b.mudanca <= b.de || (b.ate && b.mudanca >= b.ate)) erro(`${b.nome}: mudança fora do mandato`);
  }
}

function validarFaixa(faixa, partidos, erro) {
  faixa.forEach((b, i) => {
    validarBloco(b, partidos, erro);
    const anterior = faixa[i - 1];
    if (!anterior) return;
    if (!anterior.ate) erro(`${anterior.nome || "vago"}: só o último mandato fica em aberto`);
    else if (b.de < anterior.ate) erro(`${b.nome || "vago"}: sobrepõe o mandato anterior`);
  });
}

function validarDatasDoTipo(tipo, bruto, erro) {
  if (!(bruto.tipos || {})[tipo]) return erro(`tipo "${tipo}" não existe em "tipos"`);
  const lista = (bruto.eleicoes || []).filter((e) => e.tipo === tipo);
  if (lista.length === 0) erro("sem eleições deste tipo");
  for (const e of lista) {
    if (!dataValida(e.data)) erro(`${e.id}: falta a data da eleição`);
  }
}

function validarCartoes(c, bruto, erro) {
  const spec = c.cartoes;
  if (!spec || typeof spec !== "object") return erro("cartoes inválido");
  if (spec.lado !== "esquerda" && spec.lado !== "dentro") erro(`cartoes: lado "${spec.lado}" desconhecido`);
  validarDatasDoTipo(spec.eleicoes, bruto, erro);
  if (spec.lado !== "dentro" || !Array.isArray(c.faixas)) return;
  const inicios = c.faixas.flat().map((b) => b.de).filter(Boolean).sort();
  const sobrepostas = (bruto.eleicoes || []).filter((e) => e.tipo === spec.eleicoes && inicios.length > 0 && e.data >= inicios[0]);
  for (const e of sobrepostas) erro(`${e.id}: o cartão cai sobre uma barra`);
}

function validarCargo(c, bruto, erro) {
  if (!c.nome) erro("cargo sem nome");
  const partidos = bruto.partidos || {};
  if (c.cartoes !== undefined) validarCartoes(c, bruto, erro);
  if (c.eleicoes !== undefined) {
    if (c.faixas !== undefined) erro("cargo com faixas e eleicoes");
    validarDatasDoTipo(c.eleicoes, bruto, erro);
    return;
  }
  const faixas = Array.isArray(c.faixas) ? c.faixas : [];
  if (faixas.length === 0) return erro("sem faixas");
  faixas.forEach((faixa, i) => {
    if (!Array.isArray(faixa) || faixa.length === 0) return erro(`faixa ${i + 1} vazia`);
    validarFaixa(faixa, partidos, (texto) => erro(`faixa ${i + 1}: ${texto}`));
  });
}

export function validarMandatos(mandatos, bruto) {
  const problemas = [];
  const cargos = Array.isArray(mandatos.cargos) ? mandatos.cargos : [];
  if (cargos.length === 0) problemas.push("mandatos: sem cargos");
  const ids = new Set();
  for (const c of cargos) {
    const ref = c.id || "(sem id)";
    if (ids.has(c.id)) problemas.push(`${ref}: id repetido`);
    ids.add(c.id);
    validarCargo(c, bruto, (texto) => problemas.push(`${ref}: ${texto}`));
  }
  return problemas;
}

export function validar(bruto) {
  const problemas = [];
  const tipos = bruto.tipos || {};
  const partidos = bruto.partidos || {};
  const respostas = bruto.respostas || {};
  validarCores(partidos, problemas);
  validarCores(respostas, problemas);
  for (const [nome, foto] of Object.entries(bruto.fotos || {})) {
    if (typeof foto !== "string" || !foto) problemas.push(`${nome}: foto inválida`);
  }
  const ids = new Set();
  for (const e of bruto.eleicoes || []) {
    if (ids.has(e.id)) problemas.push(`${e.id}: id repetido`);
    ids.add(e.id);
    validarEleicao(e, tipos, partidos, respostas, problemas);
  }
  return problemas;
}
