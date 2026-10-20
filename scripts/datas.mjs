/* ==========================================================================
   As datas do sitemap, tiradas da diferença para o que está no ar.

   Corre na publicação, depois do gerador e antes da auditoria. Para cada
   endereço do sitemap acabado de gerar vai buscar a página que está no ar e
   compara-a com a nova:

     igual       → fica a data que o sitemap do ar já lhe dava
     diferente   → agora
     não existia → agora

   Porquê assim, e não a data do git nem a de hoje. A data de hoje em todas as
   páginas dizia ao Google «mudou tudo» a cada publicação — e ele aprende a
   ignorar um sitemap que mente. A do git também não serve aqui: há um único
   gerador para todas as páginas, e as peças mostram as vizinhas em «Outras
   peças», por isso mexer numa linha do gerador ou numa peça muda páginas que
   nenhum ficheiro dela diria. Só o HTML final sabe o que mudou.

   O que nunca faz é inventar. Sem o sitemap do ar, o novo sai sem datas; sem
   a página do ar (um erro de rede, não um 404), essa fica sem data. Mais vale
   uma data a menos do que uma errada.

   Os endereços que mudaram vão para `alteradas.txt` (e para a saída do passo
   no GitHub), para o aviso ao Bing depois de publicar — scripts/indexnow.mjs.

   Correr à mão:  node scripts/gerar.mjs && node scripts/datas.mjs
   ========================================================================== */
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = join(RAIZ, '_site');
const LISTA = join(RAIZ, 'alteradas.txt');

const mapaNovo = readFileSync(join(SAIDA, 'sitemap.xml'), 'utf8');
const locs = [...mapaNovo.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, v]) => v);

function terminar(alteradas, msg) {
  writeFileSync(LISTA, alteradas.length ? alteradas.join('\n') + '\n' : '');
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `alteradas=${alteradas.join(' ')}\n`);
  console.log(msg);
}

/* Sem domínio próprio o site vive num endereço provisório, com `noindex`, e
   não há nada para datar nem ninguém para avisar. */
if (!existsSync(join(SAIDA, 'CNAME'))) {
  terminar([], 'sem domínio próprio: o sitemap fica sem datas');
  process.exit(0);
}

/* A cache do GitHub Pages guarda cada página até dez minutos. Um parâmetro
   que muda a cada pedido obriga-a a ir buscar a versão que está mesmo no ar —
   sem isto, duas publicações seguidas podiam comparar-se com a de antes. */
const fresco = (url) => `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`;

async function buscar(url) {
  try {
    const r = await fetch(fresco(url), { signal: AbortSignal.timeout(20000), redirect: 'follow' });
    if (r.status === 404) return { nao: true };
    if (!r.ok) return { erro: `HTTP ${r.status}` };
    return { texto: await r.text() };
  } catch (e) {
    return { erro: e.message };
  }
}

/* O que muda a cada publicação sem mudar a página: o `?v=` que obriga o
   browser a ir buscar a folha de estilo e o script novos. */
const normal = (html) => html.replace(/\?v=[0-9a-f]{8}/g, '');

const site = new URL(locs[0]).origin;
const doAr = await buscar(`${site}/sitemap.xml`);
if (!doAr.texto) {
  console.log(`::warning::o sitemap do ar não respondeu (${doAr.erro ?? 'não existe'}); o novo sai sem datas`);
  terminar([], 'sem datas');
  process.exit(0);
}
const datasNoAr = new Map(
  [...doAr.texto.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, bloco]) => [
    (bloco.match(/<loc>([^<]+)<\/loc>/) || [])[1],
    (bloco.match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1],
  ]),
);

const agora = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const datas = new Map();
const alteradas = [];
const semDados = [];

/* Seis pedidos de cada vez: são 35 páginas, e não há pressa que justifique
   mais do que isso a um servidor que não é nosso. */
const fila = [...locs];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (fila.length) {
    const loc = fila.shift();
    const caminho = new URL(loc).pathname;
    const novo = readFileSync(join(SAIDA, caminho, caminho.endsWith('/') ? 'index.html' : ''), 'utf8');
    const ar = await buscar(loc);
    if (ar.erro) { semDados.push(`${caminho} (${ar.erro})`); continue; }
    if (ar.nao || normal(ar.texto) !== normal(novo)) {
      datas.set(loc, agora);
      alteradas.push(loc);
    } else if (datasNoAr.get(loc)) {
      datas.set(loc, datasNoAr.get(loc));
    }
  }
}));

/* Uma data que já lá viesse é substituída — ou retirada, se não se souber a
   verdadeira. O gerador de agora não escreve nenhuma, mas este passo não deve
   depender disso para dizer a verdade. */
const mapaDatado = mapaNovo.replace(/<url><loc>([^<]+)<\/loc>(?:<lastmod>[^<]*<\/lastmod>)?<\/url>/g, (_, loc) => (
  datas.has(loc) ? `<url><loc>${loc}</loc><lastmod>${datas.get(loc)}</lastmod></url>` : `<url><loc>${loc}</loc></url>`
));
writeFileSync(join(SAIDA, 'sitemap.xml'), mapaDatado);

if (semDados.length) console.log(`::warning::sem a página do ar, ficaram sem data: ${semDados.join(', ')}`);
alteradas.sort();
terminar(alteradas, `${alteradas.length} de ${locs.length} páginas mudaram${alteradas.length ? ':\n  ' + alteradas.join('\n  ') : ''}`);
