# O que falta ao cliente decidir ou fornecer

Ordenado por urgência. O primeiro ponto é o único que tem consequência legal.

---

## 1. A morada. Isto é um problema legal, não uma preferência de design

**O que o cliente disse:** não quer a morada publicada; é dada ao cliente quando
se marca a visita.

**O que a lei diz:** o artigo 10.º do **Decreto-Lei n.º 7/2004** obriga quem
presta serviços por via electrónica a disponibilizar, de forma permanente e de
acesso fácil, o **endereço geográfico** onde está estabelecido — a par do nome e
do NIF. Não é o mesmo que a sede social nem admite substituição por «Valongo».
Quem fiscaliza é a **ASAE**, e a falta é contra-ordenação.

**O que está no site neste momento:** identificação completa (nome, natureza
jurídica, NIF, telefone, correio electrónico) e **Valongo, distrito do Porto**
como localização. O mapa aponta para o concelho, não para uma porta. Isto cumpre
tudo menos o endereço exacto.

**As três saídas, e o que cada uma custa:**

| Opção | O que implica |
|---|---|
| **Publicar a morada do atelier** | Cumpre a lei. É o que recomendo se o atelier tem espaço próprio, ainda que só receba por marcação — pode escrever-se «visitas apenas por marcação» ao lado. |
| **Publicar uma morada de contacto** (contabilista, caixa postal, espaço partilhado) | Cumpre a forma da lei sem expor a casa, se for mesmo um endereço onde a empresa possa ser contactada. Muito usado por empresários em nome individual que trabalham de casa. |
| **Manter só «Valongo»** | É a situação actual. Fica em incumprimento do art. 10.º. O risco prático é baixo mas existe, e aumenta se houver uma reclamação. |

**Não avancei sozinho** porque publicar a morada de alguém é irreversível e o
cliente disse expressamente o contrário. Assim que houver decisão, muda-se numa
linha em `data/definicoes.json` e nos termos.

---

## 2. Domínio

O site está preparado para ambos os cenários e **decide sozinho**: se existir um
ficheiro `CNAME` na raiz do repositório, constrói para a raiz desse domínio; se
não existir, constrói para o endereço de projecto do GitHub Pages.

Para ligar um domínio (por exemplo `pauferroatelier.pt`), basta:

1. criar o ficheiro `CNAME` com o domínio lá dentro, e
2. apontar o DNS ao GitHub Pages.

Nada mais muda. Não há um segundo sítio para actualizar.

---

## 3. Informação que o site ainda não tem porque ninguém a confirmou

Nada disto foi inventado — está tudo em falta de propósito:

- **Espécies de madeira** de cada peça (carvalho, castanho, suão…). As fichas
  das peças têm o campo pronto e vazio; assim que o atelier disser, aparece.
- **Medidas** das peças já feitas.
- **Ano de início de actividade** — dá para escrever «desde 20XX» no atelier.
- **Prazo médio de execução** de uma encomenda.
- **Para onde entregam.** O Instagram fala de entregas em Braga e em Coimbra,
  mas o site não o diz enquanto o atelier não o confirmar.
- **Um preço «a partir de»**, se o atelier o quiser dar. «Mesa com resina
  epóxi preço» é das pesquisas que o Google mais sugere; a página das mesas em
  resina explica o que pesa no preço, mas não tem número nenhum.
- **A mesa de 5 metros entregue em Braga**, que aparece no Instagram: se o
  atelier confirmar, entra na página das mesas em resina.

O Perfil de Empresa do Google já existe (visto a 20 out 2026: «Fabricante de
móveis», área de serviço em Valongo, sem morada à vista) — ver o ponto 5.

Preços não entram: as peças são por encomenda e o preço depende da madeira, da
medida e do acabamento. Publicar um número seria uma promessa que o atelier não
fez.

---

## 4. Nome

O logótipo diz **ATELIER**. O pedido inicial escrevia «Atlier» e foi corrigido a
meio para «Atelier», que é o que ficou — no repositório, no site e nos textos.
Fica só registado que a grafia com «e» é a do logótipo.

---

## 5. Para aparecer mais no Google — o que já não depende do site

Medido a 20 out 2026 (ver «Pesquisa no Google» no README). O site já tem a
página das mesas em resina, os títulos das peças e o sitemap arrumados. O que
falta faz-se fora do código, e pesa tanto ou mais:

1. **Avaliações no Google.** O Perfil de Empresa tem **zero**. É o que mais
   conta para aparecer no Maps e no bloco de empresas da pesquisa. Pedir aos
   clientes das peças já entregues que deixem uma avaliação, com a ligação
   «Pedir críticas» do perfil.
2. **Os serviços do perfil.** Hoje são os que o Google sugeriu sozinho, em
   inglês («Carpenter», «Woodworker», «Cabinet maker»…); nenhum fala de mesas
   em resina. Proposta: «Mesas em resina epóxi por medida», «Mesas rio (river
   table)», «Mesas de centro em resina», «Tampos e móveis de casa de banho em
   resina». **Mexer no perfil é público: precisa do «sim» do Renato.**
3. **Fotografias e novidades no perfil.** A última fotografia foi há 69 dias.
   Uma peça nova por mês, com fotografia, mantém o perfil vivo.
4. **A ligação do Instagram** (`pauferro_2021`, 2026 seguidores) aponta para
   uma página do Facebook e não para o site. Trocar, ou acrescentar,
   `https://pauferroatelier.pt` na bio.
5. **Duas páginas do Facebook?** O site liga a `profile.php?id=100064370160594`,
   e o Instagram a `Pau-Ferro-Atelier-100985145381515`. Confirmar qual é a
   verdadeira e pôr o site no campo «Website» dela.
