// Devolve a lista de problemas.

function inteiroNaoNegativo(valor) {
  return Number.isInteger(valor) && valor >= 0;
}

function soma(lista, campo) {
  return lista.reduce((total, item) => total + item[campo], 0);
}

function validarEleicao(e, tipos, problemas) {
  const ref = e.id || "(sem id)";
  const erro = (texto) => problemas.push(`${ref}: ${texto}`);

  if (!tipos[e.tipo]) erro(`tipo "${e.tipo}" não existe em "tipos"`);
  if (!Number.isInteger(e.ano)) erro("ano inválido");
  for (const campo of ["votantes", "inscritos", "pontos_atribuidos", "pontos_possiveis"]) {
    if (!inteiroNaoNegativo(e[campo])) erro(`${campo} inválido`);
  }
  if (e.votantes > e.inscritos) erro("há mais votantes do que inscritos");
  if (e.pontos_atribuidos > e.pontos_possiveis) erro("há mais pontos atribuídos do que possíveis");

  const candidatos = Array.isArray(e.candidatos) ? e.candidatos : [];
  if (candidatos.length === 0) return erro("sem candidatos");
  for (const c of candidatos) {
    if (!c.nome) erro("candidato sem nome");
    for (const campo of ["primeira_escolha", "pontos"]) {
      if (!inteiroNaoNegativo(c[campo])) erro(`${c.nome}: ${campo} inválido`);
    }
  }
  if (soma(candidatos, "primeira_escolha") !== e.votantes) {
    erro("a soma da 1ª escolha não é igual aos votantes");
  }
  if (soma(candidatos, "pontos") !== e.pontos_atribuidos) {
    erro("a soma dos pontos não é igual aos pontos atribuídos");
  }

  const eleitos = candidatos.filter((c) => c.eleito);
  const outros = candidatos.filter((c) => !c.eleito);
  if (eleitos.length === 0) erro("sem eleito");
  const melhorOutro = Math.max(0, ...outros.map((c) => c.pontos));
  if (eleitos.some((c) => c.pontos < melhorOutro)) erro("há um eleito com menos pontos que um não eleito");
}

export function validar(bruto) {
  const problemas = [];
  const tipos = bruto.tipos || {};
  const ids = new Set();
  for (const e of bruto.eleicoes || []) {
    if (ids.has(e.id)) problemas.push(`${e.id}: id repetido`);
    ids.add(e.id);
    validarEleicao(e, tipos, problemas);
  }
  return problemas;
}
