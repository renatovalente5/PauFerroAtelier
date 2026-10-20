/* ==========================================================================
   Avisa o IndexNow das páginas que mudaram.

   O IndexNow é a forma de dizer ao Bing — e ao DuckDuckGo, ao Ecosia e ao
   Yahoo, que usam o índice dele — «esta página mudou, venham buscá-la». O
   Google não participa: para ele valem o sitemap e o Search Console.

   Corre DEPOIS de publicar, nunca antes: avisar com a versão antiga ainda no
   ar faz o Bing vir buscar a antiga. A lista vem de `scripts/datas.mjs`, que
   só põe lá o que mudou de facto — mandar o site inteiro a cada publicação é
   ruído, e eles contam-no.

   Uma falha aqui é um aviso e não um erro: o site já está no ar, e perder um
   aviso ao Bing não justifica pintar a publicação de vermelho.
   ========================================================================== */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const { chave } = JSON.parse(readFileSync(join(RAIZ, 'data/indexnow.json'), 'utf8'));
const dominio = readFileSync(join(RAIZ, 'CNAME'), 'utf8').trim();

const bruto = process.env.ALTERADAS
  ?? (existsSync(join(RAIZ, 'alteradas.txt')) ? readFileSync(join(RAIZ, 'alteradas.txt'), 'utf8') : '');
const urls = bruto.split(/\s+/).filter((u) => u.startsWith(`https://${dominio}/`));

if (!urls.length) {
  console.log('nenhuma página mudou: não há nada a avisar');
  process.exit(0);
}

try {
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: dominio,
      key: chave,
      keyLocation: `https://${dominio}/${chave}.txt`,
      urlList: urls,
    }),
    signal: AbortSignal.timeout(20000),
  });
  /* 200 é aceite; 202 é aceite com a chave ainda por validar — o normal da
     primeira vez. Nenhum dos dois é erro. */
  if (r.status === 200 || r.status === 202) {
    console.log(`IndexNow: ${urls.length} ${urls.length === 1 ? 'página avisada' : 'páginas avisadas'} (HTTP ${r.status})`);
  } else {
    console.log(`::warning::o IndexNow respondeu HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  }
} catch (e) {
  console.log(`::warning::o IndexNow não respondeu: ${e.message}`);
}
