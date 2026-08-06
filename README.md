# Pau Ferro Atelier

Sítio do atelier de marcenaria **Pau Ferro**, em Valongo, Porto: mesas em madeira
maciça e resina epóxi, fabricadas por encomenda.

Site estático, sem dependências, gerado por um script de Node e publicado no
GitHub Pages. Sem framework, sem `node_modules`, sem pedidos a terceiros — a
página que o visitante recebe é a que está no disco.

## Correr localmente

```bash
node scripts/gerar.mjs                 # escreve _site/
node scripts/auditar.mjs               # verifica o que foi escrito
python3 -m http.server 4300 --directory _site
```

O gerador aceita `BASE` e `SITE` no ambiente, mas normalmente não é preciso:
descobre-os sozinho (ver «Onde o site vive», abaixo).

## Como está organizado

```
data/definicoes.json     contactos, localização, redes, textos da entrada
data/pecas/*.json        uma peça por ficheiro — 26 no total
conteudo/*.md            os três textos legais
assets/pecas/<slug>/     as fotografias já tratadas (AVIF, WebP, JPEG × 3 larguras)
_fonte/originais/        as fotografias como vieram do cliente
scripts/gerar.mjs        o gerador
scripts/auditar.mjs      o travão que corre antes de publicar
scripts/imagens.py       fotografias originais → os três formatos
scripts/dimensoes.py     escreve as medidas reais de cada fotografia no JSON
scripts/logotipo.py      logótipo do cliente → dois PNG com transparência
scripts/icones.py        favicons e imagem de partilha
_plano/                  o plano de construção e o que falta ao cliente
```

## Acrescentar uma peça

1. Pôr as fotografias em `_fonte/originais/` como `conjunto_<n>_<m>.jpg`.
2. `python3 scripts/imagens.py` — gera os três formatos em três larguras.
3. Criar `data/pecas/<slug>.json` a copiar um existente.
4. `python3 scripts/dimensoes.py` — preenche as medidas reais das fotografias.
5. `node scripts/gerar.mjs && node scripts/auditar.mjs`.

Regra que vale para todos os passos: **o que o cliente não disser, não se
escreve**. Sem preços, sem medidas inventadas, sem espécies de madeira a palpite.

## Onde o site vive

O prefixo dos caminhos e o endereço canónico saem os dois de um único facto:
existe, ou não, um ficheiro `CNAME` na raiz.

| | prefixo | canónicos |
|---|---|---|
| **com** `CNAME` | vazio | `https://<domínio>` |
| **sem** `CNAME` | `/PauFerroAtelier` | `https://renatovalente5.github.io` |

É de propósito que não há uma segunda linha para actualizar. Num projecto
anterior o prefixo e o endereço real discordaram e o site esteve dias sem folha
de estilo, sem navegação e com o sitemap rejeitado pelo Google — a página de
teste redireccionava e parecia bem. `scripts/auditar.mjs` confirma que os dois
concordam e a Action recusa-se a publicar se não concordarem.

## Decisões que não são óbvias

**A cor.** O logótipo não tem cor nenhuma — foi medido: 259 tons, todos
cinzentos. Não havia paleta para copiar dele. A cor foi medida nas 66
fotografias (79 % madeira quente, o resto resina azul, turquesa e verde), e a
decisão foi deixar o site monocromático como o logótipo e **dar a cor às
fotografias**. Competir com a madeira era ruído.

**A montra em colunas e não em grelha.** As peças foram fotografadas umas ao alto
e outras ao baixo. Uma grelha alinha tudo pela mais alta e obriga a cortar; em
colunas, cada fotografia aparece inteira. As medidas de cada uma são lidas do
ficheiro, não assumidas.

**Os cortes vivem nos dados, não nos originais.** Várias fotografias foram
tiradas com muito tecto ou muita parede e a peça ficava pequena no meio do nada.
Quando isso acontece, o corte fica escrito no JSON da peça:

```json
"cortes": { "01": [0.0, 0.38, 1.0, 1.0] }
```

São fracções da imagem, com 0,0 no canto superior esquerdo. O ficheiro original
**nunca é alterado** — o corte é aplicado na geração das variantes. Desfaz-se
apagando a linha e correndo `python3 scripts/imagens.py --peca <slug>`. Depois de
mexer num corte é preciso correr também `scripts/dimensoes.py`, senão o HTML fica
a declarar a proporção antiga e a página salta ao carregar.

**Sem preços.** As peças são por encomenda. Não há `offers` nos dados
estruturados por causa disso — marcar um preço que não está visível na página é
expressamente proibido pelo Google.

**O mapa não carrega sozinho.** O embed do Google instala cookies mal é
carregado e o consentimento tem de ser prévio (art. 5.º da Lei 41/2004). O
endereço fica num atributo e só vira `<iframe>` depois do clique.

**O telefone nunca aparece sem «(Chamada para a rede móvel nacional)».** Há uma
função só para isso, e a auditoria falha se algum número escapar.

## O que falta

Ver [`_plano/PENDENTE-CLIENTE.md`](_plano/PENDENTE-CLIENTE.md). O ponto 1 —
a morada e o artigo 10.º do DL 7/2004 — precisa de decisão do cliente.
