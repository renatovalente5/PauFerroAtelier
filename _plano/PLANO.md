# Pau Ferro Atelier — plano de construção

Documento de trabalho. Cada fase tem passos que se fecham um a um, e cada passo
diz **como se prova que ficou feito**. Sem prova, o passo não está feito.

---

## O que se apurou antes de planear

**O logótipo não tem cor nenhuma.** Medido: 259 tons, todos cinzentos, saturação
média 0,000, zero pixéis com cor. É traço preto sobre branco — círculo com «PAU
FERRO ATELIER», monograma PF manuscrito, coroa de louros, «WOOD WORKING».

Isto tem uma consequência directa no pedido «as cores do site devem ser baseadas
no logo»: **não há cores para copiar**. O que o logótipo dá é um *carácter* —
traço fino, monocromático, serifado, de ourivesaria. A cor tem de vir do produto.

**A cor do produto, medida nas 66 fotografias** (miolo de cada uma, fora cinzentos
e pretos):

| Família | Peso | Média |
|---|---|---|
| Madeira quente | 78,9 % | `#87694C` |
| Azul (resina) | 9,9 % | `#4B5F75` |
| Turquesa/teal (resina) | 4,9 % | `#3D5F65` |
| Verde (resina) | 3,5 % | `#3F5544` |

**Decisão de direcção:** o site é **monocromático como o logótipo** — tinta quase
preta sobre papel — e **são as fotografias que trazem a cor**. A madeira e a
resina já são intensas; competir com elas seria ruído. O único acento é um
petróleo escuro tirado da própria resina, usado com conta.

Isto resolve as duas instruções ao mesmo tempo: o site é do estilo do logótipo, e
a paleta vem do produto. E afasta-se do «site básico» — uma montra de atelier,
não um folheto.

**O que são as 26 peças** (vistas uma a uma):
mesas-rio de madeira maciça com veio de resina (turquesa, petróleo, esmeralda,
preto), tampos de borda natural, mesas redondas, mesas de apoio em conjunto,
tampos de casa de banho com lavatório, aparadores, e um louceiro clássico em
madeira sem resina. Várias com iluminação LED embutida na resina.

**Nome:** o logótipo diz **ATELIER**. O pedido escreve «Atlier» e manda criar o
repositório com esse nome. Fica: repositório `PauFerroAtlier` como pedido, marca
escrita `Pau Ferro Atelier` como está no logótipo. A confirmar com o cliente.

---

## O que se traz de novo (e porquê, não por moda)

Pesquisa feita hoje, com o suporte verificado:

1. **AVIF primeiro, WebP a seguir, JPEG por baixo.** AVIF tem 94,9 % de suporte e
   é ~50 % mais pequeno que JPEG; WebP tem 96,4 %. Num site que é 90 %
   fotografia de madeira, é aqui que se ganha ou perde. *(Nos sites anteriores
   servi só WebP — isto é um degrau acima.)*
2. **View Transitions entre páginas.** Da galeria para a peça, a fotografia
   *cresce* para a página seguinte em vez de haver um salto branco. É nativo,
   zero JavaScript, e é exactamente o gesto que um site de peças únicas pede.
   Baseline no mesmo documento; entre páginas funciona em Chromium e Safari
   18.2+, e no Firefox degrada para uma navegação normal. Melhoria progressiva.
3. **Animações conduzidas pelo scroll**, nativas e no compositor, para as peças
   entrarem à medida que se lê. Sem biblioteca, sem JavaScript de scroll.
4. **`content-visibility`** nas secções abaixo da dobra — com 26 peças e 66
   fotografias, poupa trabalho de layout que o browser não precisa de fazer já.

Riscos assumidos e como se mitigam: tudo isto é melhoria progressiva. Se o
browser não souber, o site funciona na mesma — é a regra que mando aplicar a
todos os passos abaixo.

---

## Fase 0 — Fundação

| # | Passo | Como se prova |
|---|---|---|
| 0.1 | Criar o repositório `PauFerroAtlier` no GitHub | `gh repo view` responde |
| 0.2 | Estrutura do projecto e gerador Node sem dependências | `node scripts/gerar.mjs` escreve o `_site/` |
| 0.3 | Pipeline de imagens: AVIF + WebP + JPEG, três larguras | contagem de ficheiros por peça e pesos medidos |
| 0.4 | Action de publicação + domínio na raiz desde o início | corrida verde e `_site/CNAME` presente |

**Nota aprendida no projecto anterior:** o `BASE` tem de estar certo desde o
primeiro dia. Um site publicado num subdirectório e depois mudado para domínio
próprio fica sem CSS e sem navegação, e o sitemap é rejeitado pelo Google.

## Fase 1 — Identidade

| # | Passo | Como se prova |
|---|---|---|
| 1.1 | Extrair o logótipo do JPEG para SVG de traço único, a uma cor | renderiza a 40 px e a 400 px sem sujidade |
| 1.2 | Paleta e escala tipográfica, com contrastes medidos | todos os pares ≥ 4,5:1 (texto) e ≥ 3:1 (controlos) |
| 1.3 | Cabeçalho com logótipo grande que encolhe no scroll | alturas medidas nos dois estados, com histerese |
| 1.4 | Menu de ecrã inteiro no telemóvel | ocupa 100 % do ecrã, foco preso, fecha no Esc |

## Fase 2 — As peças

| # | Passo | Como se prova |
|---|---|---|
| 2.1 | Modelo de dados por peça (26), com o que se sabe e sem inventar | 26 ficheiros válidos |
| 2.2 | Galeria da montra, com filtro por tipo de peça | filtragem medida: nº visível = nº do contador |
| 2.3 | Página por peça, com galeria e pedido de orçamento | 26 páginas, todas com fotografias a 200 |
| 2.4 | View Transitions entre a montra e a peça | funciona no Chrome; no Firefox navega normal |

**Cuidado registado:** não inventar preços, medidas nem madeiras. As peças são
por encomenda e não têm preço; o que não se souber, não se escreve.

## Fase 3 — Páginas e conteúdo

| # | Passo | Como se prova |
|---|---|---|
| 3.1 | Início: montra, processo, materiais, chamada para orçamento | responsivo a 375 / 768 / 1440 |
| 3.2 | Sobre o atelier | sem afirmações que o cliente não confirmou |
| 3.3 | Contactos com mapa do Google **com consentimento prévio** | o mapa não faz um pedido antes do clique |
| 3.4 | Telefone com «(Chamada para a rede móvel nacional)» em **todos** os sítios | contagem: nº de telefones = nº de avisos |

**Morada:** o cliente não a quer publicada. O mapa aponta para **Valongo, Porto**
como zona, não para uma porta. Isto tem uma consequência legal tratada na fase 4.

## Fase 4 — Legal (UE + ASAE)

| # | Passo | Como se prova |
|---|---|---|
| 4.1 | Identificação do prestador — DL 7/2004, art. 10.º | NIF e denominação no rodapé |
| 4.2 | Livro de Reclamações electrónico, junto aos restantes links legais | link presente em todas as páginas |
| 4.3 | Resolução alternativa de litígios — entidade competente para Valongo | entidade verificada, não copiada de outro projecto |
| 4.4 | Privacidade (RGPD) e Termos, com o formulário de orçamento descrito | páginas existem e descrevem o que o site faz mesmo |
| 4.5 | Garantia legal de conformidade — DL 84/2021, bens por encomenda | texto correcto para bens fabricados por medida |
| 4.6 | Direito de livre resolução: **bens feitos por medida estão excluídos** | escrito de forma clara, é a excepção que protege o cliente |

**A verificar, não assumir:** a morada não publicada colide com o art. 10.º do
DL 7/2004, que obriga o prestador a dar a sua morada geográfica. Tem de ser
investigado antes de escrever — e possivelmente contrariar o cliente.

## Fase 5 — SEO

| # | Passo | Como se prova |
|---|---|---|
| 5.1 | Títulos e descrições por página, com «Valongo» e «Porto» | únicos e dentro dos limites |
| 5.2 | Dados estruturados: `LocalBusiness` + `Product` por peça | validados |
| 5.3 | Sitemap, robots, canónicos no domínio final | nenhum canónico para endereço que redireccione |
| 5.4 | Imagem de partilha para WhatsApp e Facebook, em JPEG | 1200×630 e o logótipo legível no corte quadrado |

## Fase 6 — Prova

| # | Passo | Como se prova |
|---|---|---|
| 6.1 | Medição a 375, 768, 1024 e 1440 | zero transbordo horizontal em todas |
| 6.2 | Contraste e teclado em todas as páginas | pares medidos; Tab alcança tudo |
| 6.3 | Peso e LCP da página inicial | LCP < 2,5 s e a imagem principal < 200 KB |
| 6.4 | Publicação e verificação no domínio a sério | percorrer as páginas no endereço final |

---

## Regras para todos os passos

1. **Nada é dado por feito sem medição.** Capturas de ecrã enganam — a imagem
   pode estar a meio do carregamento, a transição congelada, o separador oculto.
2. **Nada de inventar factos do cliente.** Sem preços, sem prazos, sem medidas,
   sem «mais de X clientes». O que ele não disser, não vai.
3. **Tudo degrada.** Sem JavaScript, o site lê-se e navega-se.
4. **Mobile primeiro na verificação**, não só no CSS.

---

# O que foi medido, no fim

As provas que cada passo exigia. Os números são os que saíram das medições, não
estimativas.

| Passo | Prova pedida | Resultado |
|---|---|---|
| 0.3 | pesos por formato | 66 fotografias × 3 formatos × 3 larguras = 594 ficheiros. A 1600 px: AVIF 108 KB · WebP 159 KB · JPEG 261 KB de média |
| 0.4 | prefixo certo desde o início | prefixo e canónico derivam ambos do CNAME; a auditoria confirma que concordam |
| 1.2 | todos os pares ≥ 4,5:1 | **duas falhas encontradas e corrigidas**: `--tinta-3` dava 4,44:1 (agora 4,92) e os títulos do rodapé 4,3:1 (agora 5,78). Zero falhas nas páginas medidas |
| 1.3 | alturas nos dois estados, com histerese | 116 → 78 px (logótipo 76 → 46). Encolhe aos 90 px de scroll, cresce abaixo dos 40 — dois limiares para não piscar na fronteira |
| 1.4 | ecrã inteiro, foco preso, fecha no Esc | ocupa 0,0 → 427×924 (o ecrã todo), Esc fecha, `aria-expanded` volta a `false`, o scroll do corpo é devolvido |
| 2.2 | nº visível = nº do contador | filtro «Casa de banho»: contador diz 2, elementos mesmo renderizados = 2. Testado também por ligação directa (`?tipo=`) e com o botão de retroceder |
| 2.4 | View Transitions | `@view-transition` reconhecida pelo browser, 26 nomes na montra, **zero duplicados** |
| 3.3 | o mapa não pede nada antes do clique | zero pedidos ao Google antes; depois do clique, `<iframe>` criado e escolha guardada em `pf:mapa` |
| 3.4 | nº de telefones = nº de avisos | verificado pela auditoria em todas as 33 páginas |
| 5.1 | títulos e descrições dentro dos limites | **28 avisos corrigidos** — o mais longo tinha 82 caracteres |
| 6.1 | zero transbordo horizontal | **72 combinações** (11 larguras de 320 a 2560 × as páginas todas). Uma falha real encontrada: `min-height: 320px` com `aspect-ratio: 4/3` dava 427 px de largura num ecrã de 320. Corrigida; zero falhas depois |
| 6.2 | Tab alcança tudo | 14 paragens na entrada, todas com nome e contorno de 2 px |
| 6.3 | LCP < 2,5 s, imagem principal < 200 KB | **LCP 624 ms**, imagem principal 147 KB (AVIF, 1600 px). Primeira pintura 199 KB no total |

## Coisas que mudaram em relação ao plano, e porquê

**1.1 — o logótipo não foi vectorizado.** O plano dizia «extrair para SVG de
traço único». Não se fez: vectorizar é redesenhar, e o traço manuscrito do
monograma perde-se. Ficou o desenho do cliente, com o fundo branco retirado e
guardado em dois tons. Custava 197 KB **em todas as páginas** para ser mostrado
a 76 px; passou a 420 px de largura em modo cinzento+alfa e ficou em 29 KB.

**A montra não usa animação de entrada.** Estava no plano (ponto 3 das
inovações) e foi retirada da montra depois de medida: um `animation-timeline:
view()` num filho de contentor multicoluna **colapsa as três colunas numa só** no
Chromium — as 26 peças passaram todas para a mesma coluna e a página ficou com
4378 px de altura em vez de 1460. A animação ficou onde funciona (grelhas,
cartões, passos); a montra fica sem ela. Uma montra em coluna única não é uma
montra.

**Favicon a 96 px e não a 512.** O de 512 pesava 39 KB em cada página para
desenhar um quadrado de 16 px no separador.
