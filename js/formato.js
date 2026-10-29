const NUMERO = new Intl.NumberFormat("pt-PT");
const PERCENTAGEM = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 1 });

export function inteiro(valor) {
  return NUMERO.format(valor);
}

export function percentagem(parte, total) {
  if (!(total > 0)) return "n/d";
  return `${PERCENTAGEM.format((parte / total) * 100)}%`;
}

export function dataCurta(iso) {
  return iso.split("-").reverse().join("/");
}

export function plural(valor, [singular, varios]) {
  return valor === 1 ? singular : varios;
}
