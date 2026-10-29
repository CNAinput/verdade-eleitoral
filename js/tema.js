// Script clássico: corre antes da pintura.
(function () {
  const CHAVE = "verdade-eleitoral-tema";

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

  function aplicar(tema) {
    document.documentElement.dataset.tema = tema;
    const barra = document.querySelector('meta[name="theme-color"]');
    if (barra) barra.content = tema === "escuro" ? "#0b100b" : "#ffffff";
    const interruptor = document.getElementById("tema");
    if (interruptor) interruptor.setAttribute("aria-checked", String(tema === "escuro"));
  }

  function escolher(tema) {
    guardar(tema);
    aplicar(tema);
  }

  aplicar(lerEscolha() || "claro");

  document.addEventListener("DOMContentLoaded", function () {
    aplicar(document.documentElement.dataset.tema);
    document.getElementById("tema").addEventListener("click", function () {
      escolher(document.documentElement.dataset.tema === "escuro" ? "claro" : "escuro");
    });
  });
})();
