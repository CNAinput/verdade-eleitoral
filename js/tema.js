// Script clássico: corre antes da pintura.
(function () {
  const CHAVE = "verdade-eleitoral-tema";
  const sistemaEscuro = matchMedia("(prefers-color-scheme: dark)");

  function lerEscolha() {
    try {
      const valor = localStorage.getItem(CHAVE);
      return valor === "claro" || valor === "escuro" ? valor : null;
    } catch (erro) {
      return null;
    }
  }

  function guardar(tema) {
    try {
      localStorage.setItem(CHAVE, tema);
    } catch (erro) {
      return;
    }
  }

  function inicial() {
    return lerEscolha() || (sistemaEscuro.matches ? "escuro" : "claro");
  }

  function aplicar(tema) {
    document.documentElement.dataset.tema = tema;
    const barra = document.querySelector('meta[name="theme-color"]');
    if (barra) barra.content = tema === "escuro" ? "#0b100b" : "#ffffff";
    const botao = document.getElementById("tema");
    if (botao) botao.textContent = tema === "escuro" ? "Modo claro" : "Modo escuro";
  }

  aplicar(inicial());

  sistemaEscuro.addEventListener("change", function () {
    if (!lerEscolha()) aplicar(inicial());
  });

  document.addEventListener("DOMContentLoaded", function () {
    const botao = document.getElementById("tema");
    aplicar(document.documentElement.dataset.tema);
    botao.addEventListener("click", function () {
      const novo = document.documentElement.dataset.tema === "escuro" ? "claro" : "escuro";
      guardar(novo);
      aplicar(novo);
    });
  });
})();
