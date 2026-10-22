/* ==========================================================================
   Auditoria do site compilado.

   Corre depois do gerador e falha com código 1 se encontrar alguma coisa. Vive
   aqui, e não só na cabeça de quem publica, porque os erros que interessam são
   sempre os que ninguém se lembra de ir ver: uma ligação partida numa das 26
   páginas de peça, um número de telefone sem a nota do custo da chamada, um
   prefixo de subdirectório que deixa o site sem CSS num domínio próprio.
   ========================================================================== */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CENTROS, LISTA_DGC_URL, CNPD_URL, verificarIdentificacao } from '../legal-comum/index.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = join(RAIZ, '_site');
const RAIZ_PROJ = RAIZ;
const problemas = [];
const avisos = [];
const mal = (f, m) => problemas.push(`${f}: ${m}`);
const aviso = (f, m) => avisos.push(`${f}: ${m}`);

function todos(dir, ext, lista = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) todos(p, ext, lista);
    else if (e.name.endsWith(ext)) lista.push(p);
  }
  return lista;
}

const paginas = todos(SAIDA, '.html');
const rel = (p) => p.slice(SAIDA.length);

/* O prefixo esperado sai exactamente da mesma regra do gerador — incluindo a
   possibilidade de ser imposto pelo ambiente, que é como se constrói para o
   servidor local. Se esta linha se afastar da do gerador, a auditoria passa a
   verificar uma coisa diferente da que foi construída, e deixa de servir para
   nada. Esta é a verificação que teria apanhado, em minutos, o site que esteve
   dias sem CSS por ter sido construído para um subdirectório e servido na raiz. */
const DEF = JSON.parse(readFileSync(join(RAIZ_PROJ, 'data/definicoes.json'), 'utf8'));
const def_nome = DEF.empresa.nome;
const TELEFONE = DEF.contactos.telefone;
const RE_TELEFONE = new RegExp(TELEFONE.split('').join('\\s?'), 'g');

const PREFIXO = (process.env.BASE ?? (existsSync(join(SAIDA, 'CNAME')) ? '' : '/PauFerroAtelier'))
  .replace(/\/$/, '');

/* O próprio domínio aparece nos canónicos e nos Open Graph, que têm de ser
   absolutos. Sai do mesmo sítio de onde o gerador o tira — o CNAME —, para a
   auditoria não poder discordar do que foi construído. */
const SITE_HOST = new URL(
  process.env.SITE ?? (existsSync(join(SAIDA, 'CNAME'))
    ? `https://${readFileSync(join(SAIDA, 'CNAME'), 'utf8').trim()}`
    : 'https://renatovalente5.github.io'),
).host;

/* domínios que o site pode tocar, e a razão de cada um */
const EXTERNOS_OK = [
  SITE_HOST,
  'wa.me',                    // WhatsApp, sempre a partir de um clique
  'www.livroreclamacoes.pt',  // imposto por lei
  'www.google.com',           // mapa, só depois de consentimento
  'policies.google.com',
  'www.instagram.com', 'www.facebook.com',
  'schema.org', 'https://schema.org',
  /* os centros de arbitragem, a lista da DGC e a CNPD, tal como a biblioteca
     legal-comum os liga — lidos dela, para não discordarem do que foi gerado */
  ...CENTROS.map((c) => new URL(c.sitio).host),
  new URL(LISTA_DGC_URL).host,
  new URL(CNPD_URL).host,
];

for (const f of paginas) {
  const h = readFileSync(f, 'utf8');
  const n = rel(f);

  /* 1. o prefixo dos caminhos tem de bater certo com onde o site vai ser
        servido — é a avaria que deixou outro site sem CSS durante dias */
  const css = (h.match(/<link rel="stylesheet" href="([^"?]+)/) || [])[1];
  if (css !== `${PREFIXO}/assets/css/estilo.css`) {
    mal(n, `a folha de estilo aponta para ${css}, e devia apontar para ${PREFIXO}/assets/css/estilo.css`);
  }

  /* 2. ligações e recursos internos apontam para ficheiros que existem */
  const refs = [...h.matchAll(/(?:href|src|srcset)="([^"]+)"/g)].flatMap(([, v]) =>
    v.includes(' ') && v.includes(',') ? v.split(',').map((s) => s.trim().split(/\s+/)[0]) : [v]);
  for (const r of refs) {
    if (/^(https?:|mailto:|tel:|#|data:)/.test(r)) continue;
    const semQuery = r.split('?')[0].split('#')[0];
    if (!semQuery) continue;
    const alvo = semQuery.startsWith('/') ? join(SAIDA, semQuery.slice(PREFIXO.length)) : resolve(dirname(f), semQuery);
    const existe = existsSync(alvo) && (statSync(alvo).isFile() || existsSync(join(alvo, 'index.html')));
    if (!existe) mal(n, `aponta para ${semQuery}, que não existe`);
  }

  /* 3. domínios externos */
  for (const [, url] of h.matchAll(/(?:href|src)="(https?:\/\/[^"]+)"/g)) {
    const host = new URL(url).host;
    if (!EXTERNOS_OK.includes(host)) mal(n, `recurso externo não previsto: ${host}`);
  }

  /* 4. imagens: o atributo alt tem de existir sempre. Vazio é uma escolha
        legítima — diz "esta imagem é decorativa, não a leias" — mas ausente é
        sempre um esquecimento. Sem width/height, a página salta ao carregar. */
  for (const [, tag] of h.matchAll(/<img\b([^>]*)>/g)) {
    if (!/\salt="/.test(tag)) mal(n, `<img> sem atributo alt: ${tag.trim().slice(0, 70)}`);
    if (!/\swidth="\d/.test(tag) || !/\sheight="\d/.test(tag)) mal(n, '<img> sem width/height');
  }

  /* 4b. toda a ligação tem de ter nome — texto, aria-label, ou uma imagem com
         descrição. Uma ligação muda é um beco sem saída num leitor de ecrã. */
  for (const [, atributos, dentro] of h.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    if (/aria-label="[^"]/.test(atributos)) continue;
    const texto = dentro.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').trim();
    const altDentro = /<img[^>]*\salt="[^"]/.test(dentro);
    if (!texto && !altDentro) mal(n, `ligação sem nome acessível: ${atributos.trim().slice(0, 60)}`);
  }

  /* 5. títulos: exactamente um <h1>, e nenhum salto de nível */
  const h1 = (h.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) mal(n, `tem ${h1} elementos <h1> (devia ter 1)`);
  let anterior = 0;
  for (const [, nivel] of h.matchAll(/<h([1-6])[\s>]/g)) {
    const v = +nivel;
    if (anterior && v > anterior + 1) mal(n, `salto de <h${anterior}> para <h${v}>`);
    anterior = v;
  }

  /* 6. cabeça: canónico, descrição, OG */
  for (const [re, m] of [
    [/<link rel="canonical" href="https?:\/\/[^"]+"/, 'sem canonical'],
    [/<meta name="description" content="[^"]{50,}"/, 'sem description (ou com menos de 50 caracteres)'],
    [/<meta property="og:image" content="https?:\/\/[^"]+"/, 'sem og:image absoluto'],
    [/<html lang="pt-PT">/, 'sem lang="pt-PT"'],
  ]) if (!re.test(h)) mal(n, m);

  const titulo = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  if (titulo.length > 60) aviso(n, `título com ${titulo.length} caracteres (o Google corta perto dos 60)`);
  /* Basta a raiz da marca: vários títulos de peça usam «Pau Ferro» em vez do
     nome completo, para caberem nos 60 caracteres sem cortar o nome da peça.
     E nos nomes mais longos, com «em resina epóxi», a marca sai de todo — o
     Google mostra o nome do sítio por cima do título. Só se avisa quando a
     marca cabia e mesmo assim falta. */
  if (!titulo.includes('Pau Ferro') && `${titulo} | Pau Ferro`.length <= 60) {
    aviso(n, 'título sem o nome do atelier, e cabia');
  }
  const desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (desc.length > 160) aviso(n, `description com ${desc.length} caracteres (o Google corta aos 160)`);

  /* 7. o custo da chamada, obrigatório onde quer que apareça um número.
        O número vem das definições e não escrito à mão: já foi trocado uma vez,
        e uma auditoria que procura um número velho deixa de encontrar seja o
        que for e passa sempre, calada. */
  const nums = (h.match(RE_TELEFONE) || []).length;
  const notas = (h.match(/\(Chamada para a rede móvel nacional\)/g) || []).length;
  if (nums && !notas) mal(n, 'mostra o telefone sem a nota do custo da chamada');

  /* 8. JSON-LD tem de ser JSON válido — e não pode declarar `Product` sem
        preço. A Google recusa um Product sem `offers`, `review` ou
        `aggregateRating`, e este site nunca vai ter nenhum dos três: as peças
        já foram entregues e não têm preço publicado. Estava assim e o validador
        acusou; fica aqui para não voltar. */
  for (const [, bruto] of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let dados;
    try { dados = JSON.parse(bruto); } catch (e) { mal(n, `JSON-LD inválido: ${e.message}`); continue; }
    for (const item of [dados].flat()) {
      if (item['@type'] !== 'Product') continue;
      if (!item.offers && !item.review && !item.aggregateRating) {
        mal(n, 'declara Product sem offers/review/aggregateRating — a Google recusa-o');
      }
    }
  }

  /* 9. abrir noutro separador sem rel="noopener" é uma falha de segurança */
  for (const [, tag] of h.matchAll(/<a\b([^>]*target="_blank"[^>]*)>/g)) {
    if (!/rel="[^"]*noopener/.test(tag)) mal(n, 'target="_blank" sem rel="noopener"');
  }
}

/* 10. o rodapé legal, em todas as páginas */
for (const f of paginas) {
  const h = readFileSync(f, 'utf8');
  for (const t of ['Livro de Reclamações', 'Política de privacidade', 'Termos e condições', 'Resolução de litígios']) {
    if (!h.includes(t)) mal(rel(f), `o rodapé não tem a ligação "${t}"`);
  }
  if (/Capital social|capital social/.test(h)) mal(rel(f), 'menciona capital social (o cliente é em nome individual)');
}

/* 10c. a identificação do prestador (DL 7/2004, art. 10.º: nome, morada
        geográfica, email em texto e NIF), pela guarda da biblioteca legal-comum.
        Em modo «avisar», e não «bloquear», porque o site já está no ar e o nome
        civil e a morada do titular estão por decidir com o cliente desde agosto
        (_plano/PENDENTE-CLIENTE.md): a auditoria lembra-o a cada publicação sem
        a travar. Quando ele os der, entram em data/definicoes.json («empresa»:
        «titular» e «morada») e o modo passa a «bloquear». */
{
  const { problemas: faltas } = verificarIdentificacao({
    nome: DEF.empresa.titular,      // o nome civil do ENI; «Pau Ferro Atelier» é só o nome comercial
    formaJuridica: 'eni',
    nif: DEF.empresa.nif,
    morada: DEF.empresa.morada,     // por indicar: «A morada é combinada directamente com o cliente»
    email: DEF.contactos.email,
    telefone: DEF.contactos.telefone,
  }, { modo: 'avisar', ecra: 'data/definicoes.json › empresa' });
  for (const p of faltas) aviso('identificação', `${p.campo}: ${p.mensagem}`);
}

/* 10a. os dados das peças, antes de olhar para o HTML.

       Nomes repetidos passam despercebidos: duas peças diferentes com o mesmo
       nome ficam indistinguíveis na montra, e o Google vê dois títulos iguais
       em duas páginas — que é ele próprio a escolher qual ignorar. Aconteceu
       com sete das 26 peças. */
{
  const CATS = ['mesa-jantar', 'mesa-redonda', 'mesa-centro', 'mesa-apoio', 'aparador', 'casa-de-banho', 'movel'];
  const vistos = new Map();
  for (const f of readdirSync(join(RAIZ_PROJ, 'data/pecas')).filter((x) => x.endsWith('.json'))) {
    const peca = JSON.parse(readFileSync(join(RAIZ_PROJ, 'data/pecas', f), 'utf8'));
    if (`${peca.slug}.json` !== f) mal(`data/pecas/${f}`, `o slug diz "${peca.slug}" e o ficheiro chama-se outra coisa`);
    if (!CATS.includes(peca.categoria)) mal(`data/pecas/${f}`, `categoria desconhecida: ${peca.categoria}`);
    const chave = peca.nome.toLowerCase();
    if (vistos.has(chave)) mal(`data/pecas/${f}`, `o nome "${peca.nome}" já é usado por ${vistos.get(chave)}`);
    else vistos.set(chave, peca.slug);
    for (const n of peca.fotos) {
      if (!existsSync(join(RAIZ_PROJ, `assets/pecas/${peca.slug}/${n}-1600.jpg`))) {
        mal(`data/pecas/${f}`, `a fotografia ${n} não existe em assets/pecas/${peca.slug}/`);
      }
    }
  }
}

/* 10a-bis. o horário na página e o horário nos dados estruturados têm de dizer
        a mesma coisa. São dois sítios diferentes alimentados pelo mesmo campo,
        e é exactamente por aí que estas coisas se desencontram sem ninguém dar
        por isso — o Google passaria a anunciar horas que a página não mostra. */
{
  const horario = JSON.parse(readFileSync(join(RAIZ_PROJ, 'data/definicoes.json'), 'utf8')).horario;
  const contactos = readFileSync(join(SAIDA, 'contactos/index.html'), 'utf8');
  if (!contactos.includes(horario.texto)) mal('/contactos/index.html', `não mostra o horário "${horario.texto}"`);
  const negocio = [...contactos.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(([, j]) => JSON.parse(j)).find((j) => j['@type'] === 'LocalBusiness');
  const spec = negocio?.openingHoursSpecification?.[0];
  if (!spec) mal('/contactos/index.html', 'o LocalBusiness não declara openingHoursSpecification');
  else if (spec.opens !== horario.abre || spec.closes !== horario.fecha
           || spec.dayOfWeek.join() !== horario.dias.join()) {
    mal('/contactos/index.html', 'o horário dos dados estruturados não bate certo com as definições');
  }
}

/* 10b. indexação: só quando houver domínio próprio. A regra e a verificação
        saem do mesmo facto, por isso não podem discordar. */
const temDominio = existsSync(join(SAIDA, 'CNAME'));
const robots = readFileSync(join(SAIDA, 'robots.txt'), 'utf8');
for (const f of paginas) {
  /* O 404 leva `noindex` sempre e de propósito: é uma página de erro, não tem
     conteúdo próprio, e indexá-la só serve para a Google mostrar «página não
     encontrada» nos resultados. Pelo mesmo motivo não entra no sitemap. */
  if (rel(f) === '/404.html') continue;
  const noindex = /<meta name="robots" content="noindex/.test(readFileSync(f, 'utf8'));
  if (temDominio && noindex) mal(rel(f), 'tem noindex apesar de haver domínio próprio');
  if (!temDominio && !noindex) mal(rel(f), 'sem noindex, e o site ainda está no endereço provisório');
}
if (temDominio !== robots.includes('Allow: /')) mal('robots.txt', 'não condiz com a existência de domínio');

/* 11. o sitemap cobre todas as páginas e nada a mais */
const mapa = readFileSync(join(SAIDA, 'sitemap.xml'), 'utf8');
const noMapa = [...mapa.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, v]) => new URL(v).pathname.slice(PREFIXO.length));
const noDisco = paginas.map((p) => rel(p).replace(/index\.html$/, '')).filter((p) => p !== '/404.html');
for (const p of noDisco) if (!noMapa.includes(p)) mal('sitemap.xml', `falta ${p}`);
for (const p of noMapa) if (!noDisco.includes(p)) mal('sitemap.xml', `${p} não existe`);

/* 11b. as datas do sitemap. Podem faltar — sem o sitemap do ar para comparar,
        `scripts/datas.mjs` deixa-as de fora em vez de as inventar —, mas uma
        data que lá esteja tem de ser uma data, e não pode ser do futuro. */
for (const [, data] of mapa.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)) {
  const t = Date.parse(data);
  if (!Number.isFinite(t)) mal('sitemap.xml', `lastmod que não é uma data: ${data}`);
  else if (t > Date.now() + 60 * 60 * 1000) mal('sitemap.xml', `lastmod no futuro: ${data}`);
}

/* 11c. a pesquisa por que o site existe. Medido a 20 out 2026: «mesas em
        resina epoxy» não encontrava o site, e nenhum título de peça dizia
        «resina epóxi». Isto vigia as três coisas que se fizeram por causa
        disso, para não se desfazerem caladas numa arrumação futura:
        a página das mesas em resina existe e está no menu de todas as
        páginas, e cada peça com resina leva o material no título. */
{
  const RESINA = '/mesas-resina-epoxi/';
  if (!existsSync(join(SAIDA, RESINA, 'index.html'))) mal(RESINA, 'a página das mesas em resina não foi gerada');
  for (const f of paginas) {
    const h = readFileSync(f, 'utf8');
    const nav = (h.match(/<nav class="topo__nav"[\s\S]*?<\/nav>/) || [''])[0];
    if (!nav.includes(`href="${PREFIXO}${RESINA}"`)) mal(rel(f), 'o menu não tem a ligação para as mesas em resina');
  }
  for (const f of readdirSync(join(RAIZ_PROJ, 'data/pecas')).filter((x) => x.endsWith('.json'))) {
    const peca = JSON.parse(readFileSync(join(RAIZ_PROJ, 'data/pecas', f), 'utf8'));
    if (!peca.resina || peca.publicado === false) continue;
    const h = readFileSync(join(SAIDA, 'pecas', peca.slug, 'index.html'), 'utf8');
    const titulo = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    if (!titulo.includes('resina epóxi')) mal(`/pecas/${peca.slug}/`, `o título não diz «resina epóxi»: ${titulo}`);
  }
}

/* 11d. a chave do IndexNow tem de estar servida na raiz, com a chave dentro —
        é assim que o Bing confirma que o aviso vem de quem manda no domínio. */
{
  const { chave } = JSON.parse(readFileSync(join(RAIZ_PROJ, 'data/indexnow.json'), 'utf8'));
  if (!/^[0-9a-f]{32}$/.test(chave)) mal('data/indexnow.json', 'a chave do IndexNow não tem o formato esperado');
  const ficheiro = join(SAIDA, `${chave}.txt`);
  if (!existsSync(ficheiro) || readFileSync(ficheiro, 'utf8').trim() !== chave) {
    mal(`/${chave}.txt`, 'o ficheiro da chave do IndexNow falta ou não tem a chave');
  }
}

/* 12. peso: o que o visitante descarrega na primeira página */
const inicio = readFileSync(join(SAIDA, 'index.html'), 'utf8');
const kb = (p) => Math.round(statSync(join(SAIDA, p)).size / 102.4) / 10;
console.log(`índice ${Math.round(inicio.length / 1024)} KB · css ${kb('assets/css/estilo.css')} KB · js ${kb('assets/js/site.js')} KB`);

console.log(`${paginas.length} páginas auditadas`);
if (avisos.length) { console.log('\nAvisos:'); avisos.forEach((a) => console.log('  ~ ' + a)); }
if (problemas.length) {
  console.log(`\n${problemas.length} problemas:`);
  problemas.forEach((p) => console.log('  ✗ ' + p));
  process.exit(1);
}
console.log('sem problemas');
