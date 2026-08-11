/* ==========================================================================
   PAU FERRO ATELIER — gerador do site

   Node sem dependências, uma página HTML por peça, saída para `_site/`.
   Não há framework porque não há nada aqui que precise de um: o conteúdo muda
   quando o atelier acrescenta uma peça, não a cada visita.

   Porquê pré-renderizar e não uma aplicação de página única: os robôs de
   pré-visualização do WhatsApp, do Facebook e do Instagram **não executam
   JavaScript**, e é por aí que um atelier partilha uma peça acabada.

   Correr:  BASE= SITE=http://localhost:4300 node scripts/gerar.mjs
   ========================================================================== */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = join(RAIZ, '_site');

/* ONDE O SITE VAI VIVER — e porque é que isto não está escrito à mão.

   Um site construído para a raiz mas servido num subdirectório fica sem CSS,
   sem navegação e com o sitemap rejeitado pelo Google. O contrário também. Já
   aconteceu noutro projecto e ninguém deu por isso durante dias, porque a
   página de teste no endereço do GitHub redireccionava e parecia bem.

   A causa era humana: o prefixo estava escrito num sítio e o endereço real era
   outro, e nada obrigava os dois a concordar. Aqui derivam ambos de um único
   facto — existe ou não existe um ficheiro CNAME:

     com CNAME  → domínio próprio, servido na raiz          → prefixo vazio
     sem CNAME  → endereço de projecto do GitHub Pages      → prefixo /<repo>

   Quando o atelier tiver domínio, escreve-se o CNAME e mais nada muda. Não há
   nenhuma segunda linha para alguém se esquecer de actualizar. */
const REPO = 'PauFerroAtelier';
const DONO = 'renatovalente5';
const dominio = existsSync(join(RAIZ, 'CNAME'))
  ? readFileSync(join(RAIZ, 'CNAME'), 'utf8').trim()
  : null;

const BASE = (process.env.BASE ?? (dominio ? '' : `/${REPO}`)).replace(/\/$/, '');
const SITE = (process.env.SITE ?? (dominio ? `https://${dominio}` : `https://${DONO}.github.io`)).replace(/\/$/, '');

const u = (p) => `${BASE}/${String(p).replace(/^\//, '')}`;
const abs = (p) => `${SITE}${u(p)}`;

const ler = (p) => JSON.parse(readFileSync(join(RAIZ, p), 'utf8'));
const def = ler('data/definicoes.json');

const pecas = readdirSync(join(RAIZ, 'data/pecas'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => ler(`data/pecas/${f}`))
  .filter((p) => p.publicado !== false)
  .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999));

const CATEGORIAS = {
  'mesa-jantar': 'Mesas de jantar',
  'mesa-redonda': 'Mesas redondas',
  'mesa-centro': 'Mesas de centro',
  'mesa-apoio': 'Mesas de apoio',
  'aparador': 'Aparadores',
  'casa-de-banho': 'Casa de banho',
  'movel': 'Outros móveis',
};

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* Cache busting pelo conteúdo: sem isto, quem já visitou fica com o CSS antigo
   depois de uma publicação e vê o site partido sem saber porquê. */
function versao(rel) {
  const h = createHash('sha1').update(readFileSync(join(RAIZ, rel))).digest('hex').slice(0, 8);
  return `${u(rel)}?v=${h}`;
}

/* As medidas do logótipo lêem-se do próprio ficheiro. Estiveram escritas à mão,
   e bastou trocar o recorte para ficarem erradas — um `width`/`height` errado
   distorce a imagem e faz a página saltar. Um PNG guarda a largura e a altura
   em quatro bytes cada, logo a seguir ao cabeçalho IHDR. */
function medidaPNG(rel) {
  const b = readFileSync(join(RAIZ, rel));
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
const LOGO = medidaPNG('assets/img/logo-tinta.png');

/* ------------------------------------------------------------------ ícones */
const ic = {
  seta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  esq: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  dir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  cima: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>',
  tel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3 7 9 6 9-6"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10.5c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10.3" r="3"/></svg>',
  relogio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.4 2"/></svg>',
  zap: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.13c-.25.69-1.45 1.32-2 1.4-.51.08-1.16.11-1.87-.12-.43-.14-.98-.32-1.69-.63-2.98-1.29-4.92-4.28-5.07-4.48-.15-.2-1.21-1.61-1.21-3.07S6.76 7.1 7.02 6.8c.26-.29.56-.36.75-.36l.54.01c.17.01.41-.7.64.49.24.58.81 2.03.88 2.18.07.15.12.32.02.52-.1.2-.15.32-.29.49l-.44.51c-.15.15-.3.31-.13.61.17.29.75 1.24 1.61 2.01 1.11.99 2.04 1.3 2.33 1.44.29.15.46.12.63-.7.17-.2.73-.85.92-1.14.2-.29.39-.24.66-.15.27.1 1.71.81 2 .95.29.15.49.22.56.34.07.12.07.69-.18 1.38Z"/></svg>',
  ig: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 5.68a4.16 4.16 0 1 0 0 8.32 4.16 4.16 0 0 0 0-8.32Zm0 6.86a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Zm5.3-7.02a.97.97 0 1 1-1.94 0 .97.97 0 0 1 1.94 0Z"/></svg>',
  fb: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.02H7.9v-2.92h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.92h-2.34V22C18.34 21.24 22 17.08 22 12.06Z"/></svg>',
};

/* ------------------------------------------------------------ fotografias */
/* Um `<picture>` com três formatos, do mais eficiente para o mais compatível.
   O browser fica com o primeiro que souber ler: AVIF pesa cerca de 40 % de um
   JPEG equivalente — medido nestas fotografias —, o WebP cerca de 60 %, e o
   JPEG é a rede de segurança que qualquer coisa abre.

   As dimensões vêm do ficheiro, uma a uma (`scripts/dimensoes.py`), e não de um
   valor fixo. Estas fotografias foram tiradas com o telemóvel no atelier e na
   casa do cliente: 16 estão ao alto e 10 ao baixo. Declarar a proporção certa
   evita o salto da página quando a imagem chega, e é o que permite mostrar cada
   uma inteira em vez de cortar tudo ao mesmo formato. */
function dim(peca, n) {
  const d = peca.dimensoes?.[n];
  if (!d) throw new Error(`faltam dimensões de ${peca.slug}/${n} — correr scripts/dimensoes.py`);
  return d;
}

function foto(peca, n, { sizes, prioritaria = false, classe = '', alt }) {
  const base = `assets/pecas/${peca.slug}/${n}`;
  const [W, H] = dim(peca, n);
  /* O ficheiro "-1600" é, na verdade, tão largo quanto o original permitiu —
     1440 px na maioria. Anunciar 1600w seria mentir ao browser sobre a
     resolução que vai receber, e ele escolheria mal. */
  const larguras = [...new Set([480, 960, W].filter((w) => w <= W))];
  const nome = (w) => (w === W ? 1600 : w);
  const conj = (ext) => larguras.map((w) => `${u(`${base}-${nome(w)}.${ext}`)} ${w}w`).join(', ');
  return `<picture class="${classe}">
    <source type="image/avif" srcset="${conj('avif')}" sizes="${sizes}">
    <source type="image/webp" srcset="${conj('webp')}" sizes="${sizes}">
    <img src="${u(`${base}-960.jpg`)}" srcset="${conj('jpg')}" sizes="${sizes}"
         alt="${esc(alt)}" width="${W}" height="${H}"
         ${prioritaria ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
  </picture>`;
}

const nomePeca = (p) => p.nome;
const tituloPeca = (p) => `${p.nome} — ${CATEGORIAS[p.categoria] || ''}`.replace(/ — $/, '');

/* ---------------------------------------------------------------- telefone */
/* A lei obriga a indicar o custo da chamada sempre que se publica um número.
   Uma função só, para não haver um sítio onde alguém se esqueça. */
const NOTA_CHAMADA = '(Chamada para a rede móvel nacional)';
const telefone = (classe = '') => `<a class="tel ${classe}" href="tel:+351${def.contactos.telefone}">
    ${ic.tel}<span>${esc(def.contactos.telefone_texto)}</span></a>
  <span class="nota-chamada">${NOTA_CHAMADA}</span>`;

/* ------------------------------------------------------------- navegação */
const MENU = [
  { href: '', rot: 'Início' },
  { href: 'pecas/', rot: 'Peças' },
  { href: 'atelier/', rot: 'O atelier' },
  { href: 'contactos/', rot: 'Contactos' },
];

function cabecalho(pag) {
  const links = MENU.map(({ href, rot }) => {
    let act = '';
    if (pag === href) act = ' aria-current="page"';
    else if (href && pag.startsWith(href)) act = ' aria-current="true"';
    return `<a class="topo__link" href="${u(href)}"${act}>${rot}</a>`;
  }).join('');
  return `<a class="saltar" href="#principal">Saltar para o conteúdo</a>
<header class="topo" id="topo">
  <div class="topo__barra">
    <a class="marca" href="${u('')}" aria-label="Pau Ferro Atelier — início">
      <img src="${u('assets/img/logo-tinta.png')}" alt="Pau Ferro Atelier" width="${LOGO.w}" height="${LOGO.h}" fetchpriority="high">
    </a>
    <nav class="topo__nav" aria-label="Principal">${links}</nav>
    <a class="btn btn--linha topo__cta" href="${u('contactos/')}">Pedir orçamento</a>
    <button class="hamburger" id="btn-menu" type="button" aria-expanded="false" aria-controls="menu" aria-label="Abrir menu">
      <span></span>
    </button>
  </div>
</header>
<div class="menu" id="menu" hidden>
  <nav class="menu__corpo" aria-label="Menu">
    ${MENU.map(({ href, rot }) => `<a class="menu__link" href="${u(href)}">${rot}</a>`).join('')}
    <a class="btn btn--cheio menu__cta" href="${u('contactos/')}">Pedir orçamento</a>
    <div class="menu__pe">
      ${telefone('tel--menu')}
    </div>
  </nav>
</div>`;
}

function rodape() {
  const legais = [
    ['privacidade/', 'Política de privacidade'],
    ['termos/', 'Termos e condições'],
    ['resolucao-de-litigios/', 'Resolução de litígios'],
  ];
  return `<footer class="rodape">
  <div class="envolve">
    <div class="rodape__grelha">
      <div>
        <img class="rodape__marca" src="${u('assets/img/logo-claro.png')}" alt="Pau Ferro Atelier" width="${LOGO.w}" height="${LOGO.h}" loading="lazy">
        <p class="rodape__texto">${esc(def.textos.reclamo)}. Todas as peças são fabricadas por encomenda.</p>
        <div class="rodape__redes">
          <a class="rodape__rede" href="${esc(def.redes.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${ic.ig}</a>
          <a class="rodape__rede" href="${esc(def.redes.facebook)}" target="_blank" rel="noopener" aria-label="Facebook">${ic.fb}</a>
          <a class="rodape__rede" href="https://wa.me/${def.contactos.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp">${ic.zap}</a>
        </div>
      </div>
      <div>
        <h2>Navegar</h2>
        <ul class="rodape__lista">
          ${MENU.map(({ href, rot }) => `<li><a href="${u(href)}">${rot}</a></li>`).join('')}
        </ul>
      </div>
      <div>
        <h2>Contactos</h2>
        <ul class="rodape__lista rodape__contactos">
          <li>${ic.tel}<span><a href="tel:+351${def.contactos.telefone}">${esc(def.contactos.telefone_texto)}</a>
            <small>${NOTA_CHAMADA}</small></span></li>
          <li>${ic.mail}<span><a href="mailto:${esc(def.contactos.email)}">${esc(def.contactos.email)}</a></span></li>
          <li>${ic.pin}<span>${esc(def.local.localidade)}, ${esc(def.local.distrito)}<br>
            <small>Atendimento por marcação</small></span></li>
        </ul>
      </div>
    </div>
    <div class="rodape__legal">
      <p>&copy; ${new Date().getFullYear()} ${esc(def.empresa.nome)} · NIF ${esc(def.empresa.nif)}</p>
      <ul class="rodape__links">
        ${legais.map(([h, r]) => `<li><a href="${u(h)}">${r}</a></li>`).join('')}
        <li><a href="https://www.livroreclamacoes.pt/inicio" target="_blank" rel="noopener">Livro de Reclamações</a></li>
      </ul>
    </div>
  </div>
</footer>`;
}

/* --------------------------------------------------------------- esqueleto */
function pagina({ pag = '', titulo, descricao, corpo, jsonld = [], og, classe = '' }) {
  const url = abs(pag);
  const imagem = og ?? abs('assets/img/og.jpg');
  return `<!doctype html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(def.empresa.nome)}">
<meta property="og:locale" content="pt_PT">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(imagem)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#1C1A18">
${dominio ? '' : '<!-- Enquanto o atelier não tiver domínio, o site vive num endereço\n     provisório do GitHub. Deixá-lo indexar punha o Google a guardar o\n     endereço errado, e depois havia que o desfazer. Basta escrever o\n     ficheiro CNAME para esta linha desaparecer sozinha. -->\n<meta name="robots" content="noindex, nofollow">'}
<link rel="icon" href="${u('assets/img/favicon-32.png')}" sizes="32x32" type="image/png">
<link rel="icon" href="${u('assets/img/favicon-96.png')}" sizes="96x96" type="image/png">
<link rel="apple-touch-icon" href="${u('assets/img/apple-touch-icon.png')}">
<link rel="stylesheet" href="${versao('assets/css/estilo.css')}">
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
</head>
<body class="${classe}">
${cabecalho(pag)}
<main id="principal">
${corpo}
</main>
${rodape()}
<button class="subir" id="subir" type="button" aria-label="Voltar ao topo da página">${ic.cima}</button>
<script src="${versao('assets/js/site.js')}" defer></script>
</body>
</html>`;
}

/* --------------------------------------------------------- dados estruturados */
const negocioLD = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': abs('#atelier'),
  name: def.empresa.nome,
  alternateName: ['PauFerro', 'Pau Ferro Woodworking'],
  description: def.empresa.actividade,
  url: abs(''),
  image: abs('assets/img/og.jpg'),
  telephone: `+351${def.contactos.telefone}`,
  email: def.contactos.email,
  vatID: `PT${def.empresa.nif}`,
  address: {
    '@type': 'PostalAddress',
    addressLocality: def.local.localidade,
    addressRegion: def.local.distrito,
    addressCountry: 'PT',
  },
  areaServed: { '@type': 'AdministrativeArea', name: `${def.local.localidade}, ${def.local.distrito}` },
  /* O horário sai dos mesmos dados que a frase da página de contactos. É isto
     que faz o Google poder mostrar "Aberto agora" na pesquisa — e por isso os
     dias e as horas estão separados nas definições, em vez de escritos numa
     frase que ninguém consegue ler de volta. */
  openingHoursSpecification: [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: def.horario.dias,
    opens: def.horario.abre,
    closes: def.horario.fecha,
  }],
  sameAs: [def.redes.instagram, def.redes.facebook].filter(Boolean),
};

const migalhasLD = (itens) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: itens.map((it, i) => ({
    '@type': 'ListItem', position: i + 1, name: it.nome,
    ...(it.href !== undefined ? { item: abs(it.href) } : {}),
  })),
});

/* ---------------------------------------------------------------- páginas */
/* Dois feitios de cartão, e a diferença é deliberada.

   `natural` mostra a fotografia inteira, na proporção em que foi tirada — é
   assim na montra, onde as peças se vêem. Umas ficam altas, outras largas, e a
   página deixa de ter aquele alinhamento de catálogo em que tudo foi cortado ao
   mesmo tamanho. Num atelier em que nenhuma peça é igual à outra, parecia mal.

   Nas filas de apoio — os destaques da entrada, as "outras peças" — o corte a
   4:3 mantém-se, porque aí o que se quer é uma linha regular. */
function cartaoPeca(p, i, { natural = false, nivel = 3, prioritarias = 0 } = {}) {
  /* Duas afinações opcionais, e ambas só valem no cartão cortado a 4:3:

     `cartao` escolhe outra fotografia. Serve para as peças cuja primeira
     fotografia é larga de mais: cortada a 4:3 fica com a mesa em cima e meio
     enquadramento de chão por baixo, e nesse formato não há posicionamento que
     resolva — o corte é lateral, não vertical.

     `foco` desloca o corte quando o centro não é o sítio certo.

     Na montra nenhuma das duas se aplica: lá a fotografia aparece inteira. */
  const n = natural ? p.fotos[0] : (p.cartao || p.fotos[0]);
  const [W, H] = dim(p, n);
  const sizes = natural
    ? '(max-width: 640px) 92vw, (max-width: 1040px) 46vw, 31vw'
    : '(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 30vw';
  const estilo = [
    `view-transition-name: peca-${esc(p.slug)}`,
    natural ? `aspect-ratio: ${W} / ${H}` : '',
    !natural && p.foco ? `--foco: ${esc(p.foco)}` : '',
  ].filter(Boolean).join('; ');
  return `<article class="cartao">
  <a class="cartao__link" href="${u('pecas/' + p.slug + '/')}">
    <div class="cartao__foto${natural ? ' cartao__foto--natural' : ''}" style="${estilo}">
<!-- alt vazio de propósito: o nome da peça está no título logo a seguir,
           dentro da mesma ligação. Com texto alternativo, um leitor de ecrã
           anunciava "Mesa de jantar com rio azul, Mesa de jantar com rio azul".
           A fotografia é decorativa **neste sítio**; na página da peça, onde não
           há texto ao lado, leva descrição. -->
      ${foto(p, n, { sizes, prioritaria: i < prioritarias, alt: '' })}
    </div>
    <div class="cartao__corpo">
      <h${nivel} class="cartao__nome">${esc(p.nome)}</h${nivel}>
      <p class="cartao__cat">${esc(CATEGORIAS[p.categoria] || '')}</p>
    </div>
  </a>
</article>`;
}

function paginaInicial() {
  const destaques = pecas.filter((p) => p.destaque).slice(0, 6);
  const lista = destaques.length ? destaques : pecas.slice(0, 6);
  const capa = lista[0];

  /* A entrada é dividida em duas: o texto de um lado, uma fotografia inteira do
     outro, encostada à borda do ecrã. Não é o banner com letras por cima da
     foto que toda a gente faz — e há uma razão prática para não o ser: estas
     fotografias foram tiradas ao alto, num telemóvel, e um banner largo teria
     de cortar a mesa ao meio para caber. Assim a peça vê-se toda. */
  const corpo = `
<section class="capa">
  <div class="capa__texto">
    <div class="capa__interior">
      <p class="sobretitulo">${esc(def.textos.reclamo)}</p>
      <h1 class="capa__titulo">${esc(def.textos.hero_titulo)}</h1>
      <p class="capa__lead">${esc(def.textos.hero_texto)}</p>
      <div class="capa__accoes">
        <a class="btn btn--cheio" href="${u('pecas/')}">Ver as peças ${ic.seta}</a>
        <a class="btn btn--linha" href="${u('contactos/')}">Pedir orçamento</a>
      </div>
      <ul class="capa__provas">
        <li>Madeira maciça</li>
        <li>Resina epóxi</li>
        <li>Por medida</li>
      </ul>
    </div>
  </div>
  <div class="capa__foto">
    ${foto(capa, capa.fotos[0], { sizes: '(max-width: 900px) 100vw, 50vw', prioritaria: true, alt: nomePeca(capa) })}
    <p class="capa__legenda">${esc(capa.nome)}</p>
  </div>
</section>

<section class="secao">
  <div class="envolve">
    <div class="secao__topo">
      <div>
        <p class="sobretitulo">Trabalho feito</p>
        <h2 class="h-secao">Algumas peças</h2>
      </div>
      <a class="ligacao" href="${u('pecas/')}">Ver todas as ${pecas.length} peças ${ic.seta}</a>
    </div>
    <div class="grelha">${lista.map((p, i) => cartaoPeca(p, i)).join('')}</div>
  </div>
</section>

<section class="secao secao--escura">
  <div class="envolve">
    <p class="sobretitulo sobretitulo--claro">Como se faz</p>
    <h2 class="h-secao h-secao--claro">Da tábua à peça</h2>
    <ol class="passos">
      <li class="passo"><span class="passo__n">1</span><h3>A madeira</h3>
        <p>Escolhe-se a tábua. É o desenho dela — os nós, as fendas, a borda — que decide o que a peça vai ser.</p></li>
      <li class="passo"><span class="passo__n">2</span><h3>A resina</h3>
        <p>A resina epóxi preenche o que a madeira deixou em aberto, na cor combinada consigo.</p></li>
      <li class="passo"><span class="passo__n">3</span><h3>O acabamento</h3>
        <p>Lixagem por fases até a superfície ficar contínua entre madeira e resina, e protecção final.</p></li>
      <li class="passo"><span class="passo__n">4</span><h3>A entrega</h3>
        <p>A peça é montada e entregue pronta a usar. Cada uma é feita de raiz para quem a encomendou.</p></li>
    </ol>
  </div>
</section>

<section class="secao">
  <div class="envolve">
    <div class="faixa">
      <div>
        <h2 class="h-secao">Tem uma medida e uma ideia?</h2>
        <p class="faixa__texto">Diga-nos o espaço, o tipo de peça e a cor que imagina. Respondemos com uma proposta.</p>
      </div>
      <div class="faixa__accoes">
        <a class="btn btn--cheio" href="${u('contactos/')}">Falar connosco ${ic.seta}</a>
        <a class="btn btn--linha" href="https://wa.me/${def.contactos.whatsapp}" target="_blank" rel="noopener">${ic.zap} WhatsApp</a>
      </div>
    </div>
  </div>
</section>`;

  return pagina({
    pag: '',
    titulo: 'Mesas em madeira maciça e resina epóxi | Valongo, Porto',
    descricao: `Atelier em Valongo, Porto. Mesas de jantar, aparadores e tampos em madeira maciça e resina epóxi, fabricados por encomenda e à medida.`,
    corpo,
    classe: 'pagina-inicial',
    jsonld: [negocioLD, {
      '@context': 'https://schema.org', '@type': 'WebSite',
      name: def.empresa.nome, url: abs(''), inLanguage: 'pt-PT',
      publisher: { '@id': abs('#atelier') },
    }],
  });
}

function paginaPecas() {
  const cats = [...new Set(pecas.map((p) => p.categoria))]
    .map((c) => ({ v: c, r: CATEGORIAS[c] || c, n: pecas.filter((p) => p.categoria === c).length }))
    .sort((a, b) => b.n - a.n);

  const corpo = `
<section class="secao secao--topo">
  <div class="envolve">
    <nav class="migalhas" aria-label="Migalhas"><a href="${u('')}">Início</a> <span>/</span> <span aria-current="page">Peças</span></nav>
    <p class="sobretitulo">Trabalho feito</p>
    <h1 class="h-pagina">Peças</h1>
    <p class="lead">Todas as peças aqui mostradas foram fabricadas por encomenda. Nenhuma se repete: a madeira decide.</p>

    <div class="filtros" id="filtros" role="group" aria-label="Filtrar por tipo de peça">
      <button class="filtro" type="button" data-cat="" aria-pressed="true">Todas <span>${pecas.length}</span></button>
      ${cats.map((c) => `<button class="filtro" type="button" data-cat="${esc(c.v)}" aria-pressed="false">${esc(c.r)} <span>${c.n}</span></button>`).join('')}
    </div>
    <p class="contagem" id="contagem" role="status">${pecas.length} peças</p>

    <div class="montra" id="grelha">
      ${pecas.map((p, i) => `<div class="grelha__item" data-cat="${esc(p.categoria)}">${cartaoPeca(p, i, { natural: true, nivel: 2, prioritarias: 2 })}</div>`).join('')}
    </div>
  </div>
</section>`;

  return pagina({
    pag: 'pecas/',
    titulo: `Peças em madeira maciça e resina | ${def.empresa.nome}`,
    descricao: `${pecas.length} peças fabricadas por encomenda no atelier, em Valongo: mesas de jantar, mesas redondas, aparadores e tampos em madeira maciça e resina epóxi.`,
    corpo,
    jsonld: [
      migalhasLD([{ nome: 'Início', href: '' }, { nome: 'Peças' }]),
      {
        '@context': 'https://schema.org', '@type': 'ItemList',
        name: `Peças do ${def.empresa.nome}`, numberOfItems: pecas.length,
        itemListElement: pecas.map((p, i) => ({
          '@type': 'ListItem', position: i + 1,
          url: abs('pecas/' + p.slug + '/'), name: nomePeca(p),
        })),
      },
    ],
  });
}

/* O Google corta a descrição a pouco mais de 160 caracteres. Em vez de
   escrever à sorte, junta-se a frase da peça ao remate e corta-se pela última
   palavra inteira que couber — assim nunca acaba a meio de uma palavra. */
function descricaoPeca(p) {
  const remate = ' Fabricada por encomenda no atelier Pau Ferro, em Valongo.';
  const espaco = 160 - remate.length;
  const texto = p.descricao.length <= espaco
    ? p.descricao
    : p.descricao.slice(0, p.descricao.lastIndexOf(' ', espaco - 1)) + '...';
  return texto + remate;
}

function paginaPeca(p) {
  const outras = pecas.filter((x) => x.slug !== p.slug && x.categoria === p.categoria).slice(0, 3);
  const restantes = outras.length ? outras : pecas.filter((x) => x.slug !== p.slug).slice(0, 3);
  const detalhes = [
    ['Tipo de peça', CATEGORIAS[p.categoria]],
    ['Madeira', p.madeira],
    ['Resina', p.resina ? `Resina ${p.resina}` : ''],
    ['Medidas', p.medidas],
  ].filter(([, v]) => v);

  const msg = encodeURIComponent(`Olá! Tenho interesse numa peça como esta: ${nomePeca(p)} — ${abs('pecas/' + p.slug + '/')}`);

  const corpo = `
<section class="secao secao--topo">
  <div class="envolve">
    <nav class="migalhas" aria-label="Migalhas">
      <a href="${u('')}">Início</a> <span>/</span>
      <a href="${u('pecas/')}">Peças</a> <span>/</span>
      <span aria-current="page">${esc(p.nome)}</span>
    </nav>

    <div class="peca">
      <div class="peca__galeria">
        <div class="peca__principal" style="view-transition-name: peca-${esc(p.slug)}">
          ${foto(p, p.fotos[0], { sizes: '(max-width: 980px) 100vw, 62vw', prioritaria: true, alt: nomePeca(p) })}
        </div>
        ${p.fotos.length > 1 ? `<div class="peca__mais">
          ${p.fotos.slice(1).map((n) => `<div class="peca__extra">${foto(p, n, { sizes: '(max-width: 980px) 50vw, 31vw', alt: `${nomePeca(p)} — outra vista` })}</div>`).join('')}
        </div>` : ''}
      </div>

      <aside class="peca__lado">
        <div class="ficha">
          <p class="sobretitulo">${esc(CATEGORIAS[p.categoria] || '')}</p>
          <h1 class="ficha__titulo">${esc(p.nome)}</h1>
          <p class="ficha__texto">${esc(p.descricao)}</p>

          ${detalhes.length ? `<dl class="ficha__detalhes">
            ${detalhes.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
          </dl>` : ''}

          <!-- Sem preço, de propósito: as peças são feitas por encomenda e o
               preço depende da madeira, da medida e do acabamento. Publicar um
               número seria uma promessa que o atelier não fez. -->
          <p class="ficha__nota">Peça única, já entregue. Fazemos outra à sua medida, na madeira e na cor que escolher.</p>

          <div class="ficha__accoes">
            <a class="btn btn--cheio" href="${u('contactos/')}">Pedir uma peça assim ${ic.seta}</a>
            <a class="btn btn--linha" href="https://wa.me/${def.contactos.whatsapp}?text=${msg}" target="_blank" rel="noopener">${ic.zap} Falar por WhatsApp</a>
          </div>
          <div class="ficha__tel">${telefone()}</div>
        </div>
      </aside>
    </div>

    ${restantes.length ? `<section class="secao__relacionadas">
      <h2 class="h-secao">Outras peças</h2>
      <div class="grelha">${restantes.map((x, i) => cartaoPeca(x, i)).join('')}</div>
    </section>` : ''}
  </div>
</section>`;

  return pagina({
    pag: `pecas/${p.slug}/`,
    titulo: `${p.nome} | ${def.empresa.nome}`,
    descricao: descricaoPeca(p),
    corpo,
    og: abs(`assets/pecas/${p.slug}/og.jpg`),
    jsonld: [
      {
        /* `CreativeWork` e não `Product`, e a razão é a mesma pela qual a
           página não tem preço: **estas peças não estão à venda**. Já foram
           feitas e entregues a um cliente, e estão aqui como trabalho feito.

           Foi o validador da Google que obrigou a arrumar isto. Com `Product`
           dava erro — «deve ser especificada a propriedade offers, review ou
           aggregateRating» — e as três estão fora de questão: não há preço
           publicado, não há avaliações, e inventar um preço que a página não
           mostra é expressamente proibido pelas regras dele. Um marcador
           inválido é pior do que nenhum: não traz benefício e ainda aparece
           como erro no Search Console.

           `CreativeWork` descreve exactamente o que isto é — uma obra feita
           por alguém — e não exige preço nenhum. */
        '@context': 'https://schema.org', '@type': 'CreativeWork',
        name: nomePeca(p),
        description: p.descricao,
        image: p.fotos.map((n) => abs(`assets/pecas/${p.slug}/${n}-1600.jpg`)),
        ...(p.madeira ? { material: p.madeira } : {}),
        keywords: CATEGORIAS[p.categoria],
        inLanguage: 'pt-PT',
        creator: { '@id': abs('#atelier') },
      },
      negocioLD,
      migalhasLD([{ nome: 'Início', href: '' }, { nome: 'Peças', href: 'pecas/' }, { nome: p.nome }]),
    ],
  });
}

function paginaAtelier() {
  const corpo = `
<section class="secao secao--topo">
  <div class="envolve">
    <nav class="migalhas" aria-label="Migalhas"><a href="${u('')}">Início</a> <span>/</span> <span aria-current="page">O atelier</span></nav>
    <div class="duas">
      <div>
        <p class="sobretitulo">Quem somos</p>
        <h1 class="h-pagina">${esc(def.textos.sobre_titulo)}</h1>
        <p class="lead">${esc(def.textos.sobre_texto)}</p>
        <div class="capa__accoes">
          <a class="btn btn--cheio" href="${u('pecas/')}">Ver as peças ${ic.seta}</a>
          <a class="btn btn--linha" href="${u('contactos/')}">Contactos</a>
        </div>
      </div>
      <div class="duas__foto">
        ${foto(pecas[7] || pecas[0], (pecas[7] || pecas[0]).fotos[0], { sizes: '(max-width: 900px) 92vw, 44vw', alt: 'Peça do atelier Pau Ferro' })}
      </div>
    </div>
  </div>
</section>

<section class="secao secao--tenue">
  <div class="envolve">
    <p class="sobretitulo">O que fazemos</p>
    <h2 class="h-secao h-secao--espaco">Por encomenda, sempre</h2>
    <div class="cartas">
      <div class="carta"><h3>Madeira maciça</h3>
        <p>Tábuas escolhidas uma a uma. A borda natural, os nós e as fendas ficam à vista — são eles que dão à peça o desenho que não se repete.</p></div>
      <div class="carta"><h3>Resina epóxi</h3>
        <p>A resina preenche o que a madeira deixou aberto, na cor que combinar consigo. Transparente, a cores, ou com iluminação embutida.</p></div>
      <div class="carta"><h3>À sua medida</h3>
        <p>Dimensões, acabamento e pés definidos para o seu espaço. Fazemos mesas de jantar, mesas de apoio, aparadores e tampos de casa de banho.</p></div>
    </div>
  </div>
</section>`;

  return pagina({
    pag: 'atelier/',
    titulo: `O atelier, em Valongo | ${def.empresa.nome}`,
    descricao: 'O Pau Ferro Atelier trabalha madeira maciça e resina epóxi em Valongo, Porto. Peças únicas, fabricadas por encomenda e à medida do espaço de cada cliente.',
    corpo,
    jsonld: [negocioLD, migalhasLD([{ nome: 'Início', href: '' }, { nome: 'O atelier' }])],
  });
}

/* O mapa só carrega depois de a pessoa autorizar: o embed clássico do Google
   instala cookies antes de qualquer interacção, e o consentimento tem de ser
   prévio (artigo 5.º da Lei 41/2004). Aponta para a localidade e não para uma
   porta, porque o atelier recebe por marcação. */
function mapa() {
  const q = encodeURIComponent(`${def.local.localidade}, ${def.local.distrito}, Portugal`);
  return `<div class="mapa" id="mapa" data-mapa="https://www.google.com/maps?q=${q}&z=12&output=embed">
  <div class="mapa__aviso" id="mapa-aviso">
    ${ic.pin}
    <p><b>Mapa do Google</b><br>
      Fica por carregar até o autorizar, porque vem dos servidores do Google e pode instalar cookies.</p>
    <div class="mapa__botoes">
      <button class="btn btn--cheio" type="button" id="btn-mapa">Carregar o mapa</button>
      <a class="btn btn--linha" href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener">Abrir no Google Maps</a>
    </div>
  </div>
</div>`;
}

function paginaContactos() {
  const corpo = `
<section class="secao secao--topo">
  <div class="envolve">
    <nav class="migalhas" aria-label="Migalhas"><a href="${u('')}">Início</a> <span>/</span> <span aria-current="page">Contactos</span></nav>
    <div class="painel-contacto">
      <div class="painel-contacto__info">
        <p class="sobretitulo">Falar connosco</p>
        <h1 class="h-pagina">Peça o seu orçamento</h1>
        <p class="lead">Diga-nos o tipo de peça, a medida aproximada e a cor que imagina. Se tiver uma fotografia de referência, melhor ainda.</p>

        <ul class="contacto__lista">
          <li>${ic.tel}<span><b><a href="tel:+351${def.contactos.telefone}">${esc(def.contactos.telefone_texto)}</a></b>
            <small>${NOTA_CHAMADA}</small></span></li>
          <li>${ic.relogio}<span><b>${esc(def.horario.texto)}</b></span></li>
          <li>${ic.mail}<span><b><a href="mailto:${esc(def.contactos.email)}">${esc(def.contactos.email)}</a></b></span></li>
          <li>${ic.zap}<span><b><a href="https://wa.me/${def.contactos.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></b>
            <small>Envie a medida e uma fotografia do espaço</small></span></li>
          <li>${ic.pin}<span><b>${esc(def.local.localidade)}, ${esc(def.local.distrito)}</b>
            <small>${esc(def.local.nota)}</small></span></li>
        </ul>

        <div class="capa__accoes">
          <a class="btn btn--cheio" href="tel:+351${def.contactos.telefone}">${ic.tel} Ligar agora</a>
          <a class="btn btn--linha" href="https://wa.me/${def.contactos.whatsapp}" target="_blank" rel="noopener">${ic.zap} WhatsApp</a>
        </div>
        <p class="nota-chamada">${NOTA_CHAMADA}</p>

        <div class="contacto__redes">
          <span>Siga o atelier</span>
          <a href="${esc(def.redes.instagram)}" target="_blank" rel="noopener" aria-label="Instagram do Pau Ferro Atelier">${ic.ig}</a>
          <a href="${esc(def.redes.facebook)}" target="_blank" rel="noopener" aria-label="Facebook do Pau Ferro Atelier">${ic.fb}</a>
        </div>
      </div>
      <div class="painel-contacto__mapa">${mapa()}</div>
    </div>
  </div>
</section>`;

  return pagina({
    pag: 'contactos/',
    titulo: `Contactos e orçamentos | ${def.empresa.nome}`,
    descricao: `Peça um orçamento ao Pau Ferro Atelier, em Valongo, Porto. Telefone ${def.contactos.telefone_texto}, email e WhatsApp. Atendimento por marcação.`,
    corpo,
    jsonld: [negocioLD, migalhasLD([{ nome: 'Início', href: '' }, { nome: 'Contactos' }])],
  });
}

/* ------------------------------------------------------ markdown mínimo */
function marcarDown(md) {
  const inline = (s) => esc(s)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
  let html = '', lista = false;
  for (const l of md.split('\n')) {
    const t = l.trim();
    if (/^- /.test(t)) {
      if (!lista) { html += '<ul>'; lista = true; }
      html += `<li>${inline(t.slice(2))}</li>`; continue;
    }
    if (lista) { html += '</ul>'; lista = false; }
    if (!t) continue;
    const h = t.match(/^(#{1,3})\s+(.*)$/);
    if (h) { const n = h[1].length; html += `<h${n}>${inline(h[2])}</h${n}>`; continue; }
    if (/^_.*_$/.test(t)) { html += `<p class="actualizado">${inline(t.slice(1, -1))}</p>`; continue; }
    html += `<p>${inline(t)}</p>`;
  }
  if (lista) html += '</ul>';
  return html;
}

function paginaTexto(ficheiro, pag) {
  const bruto = readFileSync(join(RAIZ, 'conteudo', ficheiro), 'utf8');
  const m = bruto.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta = {};
  m[1].split('\n').forEach((l) => {
    const i = l.indexOf(':');
    if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  });
  const corpo = `<section class="secao secao--topo">
  <div class="envolve envolve--texto">
    <nav class="migalhas" aria-label="Migalhas"><a href="${u('')}">Início</a> <span>/</span> <span aria-current="page">${esc(meta.titulo)}</span></nav>
    <article class="texto">${marcarDown(m[2])}</article>
  </div>
</section>`;
  return pagina({
    pag, titulo: `${meta.titulo} | ${def.empresa.nome}`, descricao: meta.descricao, corpo,
    jsonld: [migalhasLD([{ nome: 'Início', href: '' }, { nome: meta.titulo }])],
  });
}

/* ------------------------------------------------------------------ escrita */
function escrever(caminho, html) {
  const destino = join(SAIDA, caminho);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, html, 'utf8');
}

function main() {
  rmSync(SAIDA, { recursive: true, force: true });
  mkdirSync(SAIDA, { recursive: true });
  cpSync(join(RAIZ, 'assets'), join(SAIDA, 'assets'), { recursive: true });
  if (existsSync(join(RAIZ, 'CNAME'))) cpSync(join(RAIZ, 'CNAME'), join(SAIDA, 'CNAME'));

  escrever('index.html', paginaInicial());
  escrever('pecas/index.html', paginaPecas());
  escrever('atelier/index.html', paginaAtelier());
  escrever('contactos/index.html', paginaContactos());
  for (const p of pecas) escrever(`pecas/${p.slug}/index.html`, paginaPeca(p));

  const legais = {
    'privacidade.md': 'privacidade/',
    'termos.md': 'termos/',
    'resolucao-de-litigios.md': 'resolucao-de-litigios/',
  };
  for (const [f, pag] of Object.entries(legais)) {
    escrever(`${pag}index.html`, paginaTexto(f, pag));
  }

  const urls = ['', 'pecas/', 'atelier/', 'contactos/', ...Object.values(legais),
    ...pecas.map((p) => `pecas/${p.slug}/`)];
  const hoje = new Date().toISOString().slice(0, 10);
  escrever('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((p) => `  <url><loc>${abs(p)}</loc><lastmod>${hoje}</lastmod></url>`).join('\n')}
</urlset>
`);
  escrever('robots.txt', dominio
    ? `User-agent: *\nAllow: /\n\nSitemap: ${abs('sitemap.xml')}\n`
    : `# Endereço provisório, sem domínio próprio ainda. Não indexar.\nUser-agent: *\nDisallow: /\n`);

  console.log('gerado em _site/');
  console.log(`  ${pecas.length} peças`);
  console.log(`  ${urls.length} páginas no sitemap`);
  console.log(`  base: ${BASE || '/'}   site: ${SITE}`);
}

main();
