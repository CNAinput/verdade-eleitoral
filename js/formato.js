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

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// "2023-01-10" vira "10 jan 2023".
export function dataAbreviada(iso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return `${dia} ${MESES[mes - 1]} ${ano}`;
}

// "2023-01-10" vira "jan 2023".
export function mesAno(iso) {
  const [ano, mes] = iso.split("-").map(Number);
  return `${MESES[mes - 1]} ${ano}`;
}

// Dia de hoje em Lisboa.
export function hojeIso() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Lisbon" }).format(new Date());
}

export function plural(valor, [singular, varios]) {
  return valor === 1 ? singular : varios;
}
