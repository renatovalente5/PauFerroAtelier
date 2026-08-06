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

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = join(RAIZ, '_site');
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

/* O prefixo esperado sai do mesmo facto que o gerador usa: existe CNAME ou não.
   Esta é a verificação que teria apanhado, em minutos, o site que esteve dias
   sem CSS por ter sido construído para um subdirectório e servido na raiz. */
const PREFIXO = existsSync(join(SAIDA, 'CNAME')) ? '' : '/PauFerroAtelier';

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
  'www.cnpd.pt', 'www.cicap.pt', 'www.consumidor.gov.pt',
  'www.instagram.com', 'www.facebook.com',
  'schema.org', 'https://schema.org',
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
  if (titulo.length > 65) aviso(n, `título com ${titulo.length} caracteres (o Google corta perto dos 60)`);
  const desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (desc.length > 165) aviso(n, `description com ${desc.length} caracteres`);

  /* 7. o custo da chamada, obrigatório onde quer que apareça um número */
  const nums = (h.match(/925\s?110\s?570/g) || []).length;
  const notas = (h.match(/\(Chamada para a rede móvel nacional\)/g) || []).length;
  if (nums && !notas) mal(n, 'mostra o telefone sem a nota do custo da chamada');

  /* 8. JSON-LD tem de ser JSON válido */
  for (const [, bruto] of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(bruto); } catch (e) { mal(n, `JSON-LD inválido: ${e.message}`); }
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

/* 11. o sitemap cobre todas as páginas e nada a mais */
const mapa = readFileSync(join(SAIDA, 'sitemap.xml'), 'utf8');
const noMapa = [...mapa.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, v]) => new URL(v).pathname.slice(PREFIXO.length));
const noDisco = paginas.map((p) => rel(p).replace(/index\.html$/, ''));
for (const p of noDisco) if (!noMapa.includes(p)) mal('sitemap.xml', `falta ${p}`);
for (const p of noMapa) if (!noDisco.includes(p)) mal('sitemap.xml', `${p} não existe`);

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
