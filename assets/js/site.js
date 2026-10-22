/* ==========================================================================
   PAU FERRO ATELIER

   Regra da casa: o site tem de funcionar sem isto. Nada aqui é necessário para
   ver as peças, ler os textos ou encontrar o telefone — sem JavaScript perde-se
   o menu do telemóvel, os filtros e o mapa, e mais nada. Por isso não há
   biblioteca nenhuma: são cinco comportamentos pequenos, e cada um deles cabe
   numa função que se lê de uma vez.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ------------------------------------------------------------------------
     1. O cabeçalho encolhe ao descer e volta a crescer no topo.

     Os dois limiares são diferentes de propósito — encolhe aos 90 px, volta a
     crescer só abaixo dos 40. Com um limiar único, uma página parada em cima da
     fronteira fica a piscar entre os dois estados, porque a própria mudança de
     altura do cabeçalho move o scroll e volta a disparar o teste.
  ------------------------------------------------------------------------ */
  const topo = $('#topo');
  const subir = $('#subir');
  let encolhido = false;

  function aoRolar() {
    const y = window.scrollY;
    if (!encolhido && y > 90) { encolhido = true; topo?.classList.add('topo--encolhido'); }
    else if (encolhido && y < 40) { encolhido = false; topo?.classList.remove('topo--encolhido'); }
    subir?.classList.toggle('subir--dentro', y > 700);
  }

  /* Um único listener passivo com um pedido de animação pelo meio: o handler
     nunca corre mais do que uma vez por frame, e nunca bloqueia o scroll. */
  let agendado = false;
  addEventListener('scroll', () => {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(() => { agendado = false; aoRolar(); });
  }, { passive: true });
  aoRolar();

  subir?.addEventListener('click', () => {
    const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollTo({ top: 0, behavior: suave ? 'smooth' : 'auto' });
  });

  /* ------------------------------------------------------------------------
     2. Menu de ecrã inteiro.

     Nasce com o atributo `hidden` no HTML e é este script que o tira. Assim,
     quem não tiver JavaScript nunca fica com um painel encostado ao fundo da
     página que não sabe fechar-se.
  ------------------------------------------------------------------------ */
  const menu = $('#menu');
  const btnMenu = $('#btn-menu');

  if (menu && btnMenu) {
    menu.hidden = false;
    let ultimoFoco = null;

    const focaveis = () => $$('a[href], button:not([disabled])', menu)
      .filter((el) => el.offsetParent !== null);

    function abrir() {
      ultimoFoco = document.activeElement;
      document.body.classList.add('menu-aberto');
      btnMenu.setAttribute('aria-expanded', 'true');
      btnMenu.setAttribute('aria-label', 'Fechar menu');
      /* Com o menu aberto o cabeçalho volta ao tamanho grande: é o espaço que
         o menu reserva no topo, e assim o logótipo e o botão de fechar caem
         exactamente onde estavam antes de abrir. */
      topo?.classList.remove('topo--encolhido');
      focaveis()[0]?.focus();
    }

    function fechar({ devolverFoco = true } = {}) {
      document.body.classList.remove('menu-aberto');
      btnMenu.setAttribute('aria-expanded', 'false');
      btnMenu.setAttribute('aria-label', 'Abrir menu');
      encolhido = false;
      aoRolar();
      if (devolverFoco) (ultimoFoco instanceof HTMLElement ? ultimoFoco : btnMenu).focus();
    }

    const aberto = () => document.body.classList.contains('menu-aberto');
    btnMenu.addEventListener('click', () => (aberto() ? fechar() : abrir()));

    /* Fechar ao seguir uma ligação evita que o menu fique aberto por cima da
       página nova quando o destino é uma âncora da mesma página. */
    $$('a[href]', menu).forEach((a) => a.addEventListener('click', () => fechar({ devolverFoco: false })));

    document.addEventListener('keydown', (e) => {
      if (!aberto()) return;
      if (e.key === 'Escape') { e.preventDefault(); fechar(); return; }
      if (e.key !== 'Tab') return;
      /* Prender o foco: o botão de fechar vive no cabeçalho, fora do painel,
         por isso entra à mão no fim da lista. */
      const lista = [...focaveis(), btnMenu];
      if (!lista.length) return;
      const primeiro = lista[0], ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    });

    /* Se a janela crescer com o menu aberto, o menu deixa de existir no ecrã
       largo — fecha-se o estado para o body não ficar com o scroll trancado. */
    const largo = matchMedia('(min-width: 901px)');
    const aoMudarLargura = (e) => { if (e.matches && aberto()) fechar({ devolverFoco: false }); };
    largo.addEventListener('change', aoMudarLargura);
  }

  /* ------------------------------------------------------------------------
     3. Filtros das peças.

     Esconde-se com o atributo `hidden`, e a folha de estilo tem
     `[hidden] { display: none !important }`. Sem esse `!important`, o `display`
     que dermos ao cartão ganha à regra do browser e os cartões "escondidos"
     continuam à vista — um filtro que conta certo e não esconde nada.
  ------------------------------------------------------------------------ */
  const filtros = $('#filtros');
  const grelha = $('#grelha');

  if (filtros && grelha) {
    const itens = $$('.grelha__item', grelha);
    const contagem = $('#contagem');

    function aplicar(cat, { historico = true } = {}) {
      let n = 0;
      for (const item of itens) {
        const mostra = !cat || item.dataset.cat === cat;
        item.hidden = !mostra;
        if (mostra) n++;
      }
      $$('.filtro', filtros).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
      if (contagem) contagem.textContent = n === 1 ? '1 peça' : `${n} peças`;

      /* O filtro fica no endereço: assim uma ligação a "mesas de jantar" pode
         ser partilhada, e o botão de retroceder do browser desfaz o filtro. */
      if (historico) {
        const url = new URL(location.href);
        if (cat) url.searchParams.set('tipo', cat); else url.searchParams.delete('tipo');
        history.pushState({ cat }, '', url);
      }
    }

    filtros.addEventListener('click', (e) => {
      const b = e.target.closest('.filtro');
      if (b) aplicar(b.dataset.cat);
    });

    addEventListener('popstate', (e) => aplicar(e.state?.cat ?? '', { historico: false }));

    const inicial = new URL(location.href).searchParams.get('tipo') || '';
    if (inicial && itens.some((i) => i.dataset.cat === inicial)) aplicar(inicial, { historico: false });
  }

  /* ------------------------------------------------------------------------
     4. Mapa só depois de autorizado.

     O embed do Google instala cookies mal é carregado, e o consentimento tem de
     ser prévio (artigo 5.º da Lei 41/2004). Por isso o endereço vive num
     atributo e só se transforma em <iframe> depois do clique. A escolha fica no
     armazenamento local — não é cookie e nunca sai do equipamento — para não
     voltar a perguntar em cada visita.
  ------------------------------------------------------------------------ */
  const mapa = $('#mapa');
  if (mapa) {
    const CHAVE = 'pf:mapa';
    const aviso = $('#mapa-aviso');
    const btnRetirar = $('#btn-mapa-retirar');

    function carregar() {
      if ($('iframe', mapa)) return;
      const f = document.createElement('iframe');
      f.src = mapa.dataset.mapa;
      f.title = 'Mapa da zona do atelier, em Valongo';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.allowFullscreen = true;
      mapa.appendChild(f);
      if (aviso) aviso.hidden = true;
      if (btnRetirar) btnRetirar.hidden = false;
    }

    /* Retirar a autorização tem de ser tão fácil como dá-la (RGPD, art. 7.º,
       n.º 3): apaga-se a escolha guardada, tira-se o iframe do Google e volta o
       aviso com o botão de carregar. A partir daqui o mapa não volta sozinho. */
    function retirar() {
      try { localStorage.removeItem(CHAVE); } catch { /* navegação privada */ }
      $('iframe', mapa)?.remove();
      if (aviso) aviso.hidden = false;
      if (btnRetirar) btnRetirar.hidden = true;
    }

    $('#btn-mapa')?.addEventListener('click', () => {
      try { localStorage.setItem(CHAVE, '1'); } catch { /* navegação privada */ }
      carregar();
    });
    btnRetirar?.addEventListener('click', retirar);

    let guardado = null;
    try { guardado = localStorage.getItem(CHAVE); } catch { /* idem */ }
    if (guardado === '1') carregar();
  }
})();
