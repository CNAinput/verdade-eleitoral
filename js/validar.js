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

function validarVotos(e, partidos, erro) {
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
  validarEleitos(candidatos, "votos", erro);
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.data)) erro("data inválida");
    else if (Number(e.data.slice(0, 4)) !== e.ano) erro("a data não é do ano indicado");
  }
  if (e.sistema !== undefined && e.sistema !== "pontos" && e.sistema !== "votos") erro(`sistema "${e.sistema}" desconhecido`);
  if (tipo && tipo.formato === "opcoes") validarOpcoes(e, respostas, erro);
  else if (e.sistema === "votos") validarVotos(e, partidos, erro);
  else validarPontos(e, partidos, erro);
}

function validarCores(mapa, problemas) {
  for (const [chave, valor] of Object.entries(mapa)) {
    if (!/^#[0-9a-f]{6}$/i.test(valor.cor || "")) problemas.push(`${chave}: cor inválida`);
  }
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
