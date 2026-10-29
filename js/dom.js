// Dados entram só como texto.

function juntar(pai, filho) {
  if (filho === null || filho === undefined || filho === false) return;
  if (Array.isArray(filho)) {
    for (const item of filho) juntar(pai, item);
  } else if (filho instanceof Node) {
    pai.appendChild(filho);
  } else {
    pai.appendChild(document.createTextNode(String(filho)));
  }
}

export function h(tag, atributos, ...filhos) {
  const elemento = document.createElement(tag);
  for (const [chave, valor] of Object.entries(atributos || {})) {
    if (valor === null || valor === undefined || valor === false) continue;
    if (chave === "class") {
      elemento.className = Array.isArray(valor) ? valor.filter(Boolean).join(" ") : valor;
    } else {
      elemento.setAttribute(chave, valor === true ? "" : String(valor));
    }
  }
  juntar(elemento, filhos);
  return elemento;
}

export function limpar(elemento) {
  elemento.replaceChildren();
  return elemento;
}
