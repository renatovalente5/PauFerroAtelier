#!/usr/bin/env python3
"""Favicons e imagem de partilha, feitos a partir do logótipo do cliente.

Não se redesenha nada: o monograma "PF" é recortado do próprio ficheiro que o
atelier usa. A 16 px o selo inteiro — círculo, legenda em volta, ramo de
loureiro e a assinatura "WOOD WORKING" — fica uma mancha ilegível; o monograma
sozinho ainda se lê no separador do browser.

TRÊS COISAS QUE TIVERAM DE SER MEDIDAS, porque a primeira versão era um quadrado
preto onde não se via nada:

1. **Tinta escura sobre fundo claro, e não o contrário.** A 16 px um traço
   branco fino sobre fundo escuro esbate-se — o branco "sangra" para o escuro e
   o traço perde-se. Ao contrário aguenta. Foram comparadas as duas versões
   reduzidas a 16 px, e a diferença não é subtil.

2. **O recorte não pode apanhar a linha ondulada.** Ela faz o monograma ficar
   com 1,6 de largura por 1 de altura; dentro de um ícone quadrado isso deixa as
   letras com 62 % da altura disponível. Cortada, a proporção passa a 1,35 e as
   letras crescem.

3. **O traço é engrossado antes de reduzir.** Sem isso o traço fino cai abaixo
   de um pixel e desaparece; o `MaxFilter` alarga-o na origem para que aterre com
   um pixel e meio no destino.
"""
import pathlib
from collections import deque
from PIL import Image, ImageChops, ImageDraw, ImageFilter

RAIZ = pathlib.Path(__file__).resolve().parent.parent
IMG = RAIZ / 'assets/img'
TINTA = (28, 26, 24)
PAPEL = (250, 249, 246)
BORDA = (200, 190, 175)

# Onde está o monograma dentro do logótipo, em fracções — para não depender do
# tamanho do ficheiro de origem. O 0,86 corta a linha ondulada à direita.
CAIXA = (0.345, 0.145, 0.645, 0.545)
SEM_ONDA = 0.86


def maiores_manchas(alfa, minimo=0.06):
    """Deita fora restos soltos: pedaços do anel e da legenda que o recorte
    apanha pelas pontas. Mantém tudo o que tenha pelo menos 6 % da maior mancha,
    e não só a maior — o "F" é uma mancha separada do "P" e cair-lhe em cima foi
    o primeiro erro desta função."""
    px = alfa.load()
    largura, altura = alfa.size
    visto = [[False] * altura for _ in range(largura)]
    manchas = []
    for x0 in range(largura):
        for y0 in range(altura):
            if not px[x0, y0] or visto[x0][y0]:
                continue
            fila, mancha = deque([(x0, y0)]), []
            visto[x0][y0] = True
            while fila:
                x, y = fila.popleft()
                mancha.append((x, y))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < largura and 0 <= ny < altura and px[nx, ny] and not visto[nx][ny]:
                            visto[nx][ny] = True
                            fila.append((nx, ny))
            manchas.append(mancha)
    maior = max(len(m) for m in manchas)
    limpo = Image.new('L', alfa.size, 0)
    lp = limpo.load()
    for mancha in manchas:
        if len(mancha) >= maior * minimo:
            for x, y in mancha:
                lp[x, y] = 255
    return limpo.crop(limpo.getbbox())


def extrair_monograma():
    original = Image.open(RAIZ / '_fonte/originais/logo.jpg').convert('L')
    original = original.crop(ImageChops.invert(original).getbbox())
    largura, altura = original.size
    recorte = original.crop((int(CAIXA[0] * largura), int(CAIXA[1] * altura),
                             int(CAIXA[2] * largura), int(CAIXA[3] * altura)))
    alfa = maiores_manchas(ImageChops.invert(recorte).point(lambda v: 255 if v > 90 else 0))
    alfa = alfa.crop((0, 0, int(alfa.width * SEM_ONDA), alfa.height))
    return alfa.crop(alfa.getbbox())


MONO = extrair_monograma()


def quadrado(lado, margem=0.05, engrossar=11, raio=None,
             fundo=PAPEL, tinta=TINTA, borda=BORDA):
    alfa = MONO.filter(ImageFilter.MaxFilter(engrossar)) if engrossar else MONO
    util = int(lado * (1 - margem * 2))
    escala = min(util / alfa.width, util / alfa.height)
    alfa = alfa.resize((max(1, round(alfa.width * escala)), max(1, round(alfa.height * escala))), Image.LANCZOS)
    # A redução deixa os bordos em cinzento; puxá-los para cima fecha o traço.
    alfa = alfa.point(lambda v: min(255, int(v * 1.5)))

    icone = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    placa = Image.new('RGBA', (lado, lado), fundo + (255,))
    if raio:
        mascara = Image.new('L', (lado, lado), 0)
        ImageDraw.Draw(mascara).rounded_rectangle((0, 0, lado - 1, lado - 1), radius=raio, fill=255)
        placa.putalpha(mascara)
    icone.alpha_composite(placa)
    if borda:
        # sem contorno, um quadrado cor de papel desaparece numa barra de
        # separadores branca e fica só o monograma a flutuar
        ImageDraw.Draw(icone).rounded_rectangle(
            (0, 0, lado - 1, lado - 1), radius=raio or 0,
            outline=borda + (255,), width=max(1, lado // 24))

    cor = Image.new('RGBA', alfa.size, tinta + (0,))
    cor.putalpha(alfa)
    icone.alpha_composite(cor, ((lado - alfa.width) // 2, (lado - alfa.height) // 2))
    return icone


# 96 px, e não 512: o Google recomenda um favicon múltiplo de 48 px para o
# mostrar nos resultados, e 96 chega para isso. O de 512 pesava 39 KB em cada
# página para desenhar um quadrado de 16.
# O engrossamento é inversamente proporcional ao tamanho: a 180 px o traço
# original já tem uma dezena de pixéis e não precisa de ajuda nenhuma; a 32 px
# precisa de toda. Engrossar onde não é preciso estraga o desenho do cliente.
quadrado(180, margem=0.13, engrossar=0, raio=34).save(IMG / 'apple-touch-icon.png')
quadrado(96, margem=0.09, engrossar=3, raio=16).save(IMG / 'favicon-96.png')
quadrado(32, margem=0.05, engrossar=11, raio=5).save(IMG / 'favicon-32.png')
for n in ('apple-touch-icon', 'favicon-96', 'favicon-32'):
    print(f'{n}.png {(IMG / (n + ".png")).stat().st_size / 1024:.1f} KB')

# ---------------------------------------------------------------- partilha
# 1200x630 é a medida que o WhatsApp, o Facebook e o LinkedIn recortam sem
# cortar. Fotografia real da peça + véu escuro + logótipo claro: no telemóvel a
# pré-visualização é pequena, e sem o véu o logótipo desaparecia na madeira.
foto = Image.open(RAIZ / 'assets/pecas/mesa-jantar-rio-azul/01-1600.jpg').convert('RGB')
alvo = (1200, 630)
r = max(alvo[0] / foto.width, alvo[1] / foto.height)
foto = foto.resize((round(foto.width * r), round(foto.height * r)), Image.LANCZOS)
# Recorta em cima e não ao centro: o que interessa na pré-visualização é o
# tampo com o rio de resina, não o tapete. A fracção é baixa porque a
# fotografia de origem já vem cortada em `data/pecas` — se um dia se mexer
# nesse corte, é preciso confirmar aqui outra vez.
esq = (foto.width - alvo[0]) // 2
topo = min(max(0, round(foto.height * 0.12)), foto.height - alvo[1])
og = foto.crop((esq, topo, esq + alvo[0], topo + alvo[1]))

veu = Image.new('RGBA', alvo, (0, 0, 0, 0))
d = ImageDraw.Draw(veu)
for y in range(alvo[1]):
    d.line([(0, y), (alvo[0], y)], fill=(20, 18, 16, int(120 + 95 * (y / alvo[1]))))
og = Image.alpha_composite(og.convert('RGBA'), veu)

claro = Image.open(IMG / 'logo-claro.png').convert('RGBA')
lw = 470
claro = claro.resize((lw, round(claro.height * lw / claro.width)), Image.LANCZOS)
og.alpha_composite(claro, ((alvo[0] - lw) // 2, (alvo[1] - claro.height) // 2 - 12))

og.convert('RGB').save(IMG / 'og.jpg', quality=88, optimize=True, progressive=True)
print('og.jpg', og.size, (IMG / 'og.jpg').stat().st_size // 1024, 'KB')
