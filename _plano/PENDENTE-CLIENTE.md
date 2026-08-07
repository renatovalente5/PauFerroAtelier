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

- **Que dias abre.** O horário «das 9h às 19h» já está no sítio, mas sem dias:
  de segunda a sexta? ao sábado também? Sem isso não se pode declarar o horário
  nos dados estruturados (`openingHours` exige os dias), que é o que faz o
  Google mostrar «Aberto agora» na pesquisa. Assim que houver resposta, é uma
  linha.
- **Espécies de madeira** de cada peça (carvalho, castanho, suão…). As fichas
  das peças têm o campo pronto e vazio; assim que o atelier disser, aparece.
- **Medidas** das peças já feitas.
- **Ano de início de actividade** — dá para escrever «desde 20XX» no atelier.
- **Prazo médio de execução** de uma encomenda.
- **Google Business Profile**, se existir, para juntar aos dados estruturados e
  ao mapa.

Preços não entram: as peças são por encomenda e o preço depende da madeira, da
medida e do acabamento. Publicar um número seria uma promessa que o atelier não
fez.

---

## 4. Nome

O logótipo diz **ATELIER**. O pedido inicial escrevia «Atlier» e foi corrigido a
meio para «Atelier», que é o que ficou — no repositório, no site e nos textos.
Fica só registado que a grafia com «e» é a do logótipo.
