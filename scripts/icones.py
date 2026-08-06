#!/usr/bin/env python3
"""Favicons e imagem de partilha, feitos a partir do logótipo do cliente.

Não se redesenha nada: o monograma "PF" é recortado do próprio ficheiro que o
atelier usa. A 16 px o selo inteiro — círculo, legenda em volta, ramo de
loureiro e a assinatura "WOOD WORKING" — fica uma mancha ilegível; o monograma
sozinho ainda se lê no separador do browser.
"""
import pathlib
from PIL import Image, ImageDraw

RAIZ = pathlib.Path(__file__).resolve().parent.parent
IMG = RAIZ / 'assets/img'
TINTA = (28, 26, 24)

logo = Image.open(IMG / 'logo-tinta.png').convert('RGBA')

# recorte do monograma no ficheiro original (900x635), depois ajustado à tinta
mono = logo.crop((305, 140, 600, 402))
mono = mono.crop(mono.split()[-1].getbbox())


def quadrado(lado, margem=0.17, fundo=TINTA, tinta=(255, 255, 255), raio=None):
    """Monograma branco, centrado, sobre um quadrado de tinta."""
    fundo_img = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    placa = Image.new('RGBA', (lado, lado), fundo + (255,))
    if raio:
        mascara = Image.new('L', (lado, lado), 0)
        ImageDraw.Draw(mascara).rounded_rectangle((0, 0, lado - 1, lado - 1), radius=raio, fill=255)
        placa.putalpha(mascara)
    fundo_img.alpha_composite(placa)

    util = int(lado * (1 - margem * 2))
    escala = min(util / mono.width, util / mono.height)
    m = mono.resize((max(1, round(mono.width * escala)), max(1, round(mono.height * escala))), Image.LANCZOS)
    cor = Image.new('RGBA', m.size, tinta + (0,))
    cor.putalpha(m.split()[-1])
    fundo_img.alpha_composite(cor, ((lado - m.width) // 2, (lado - m.height) // 2))
    return fundo_img


# 96 px, e não 512: o Google recomenda um favicon múltiplo de 48 px para o
# mostrar nos resultados, e 96 chega para isso. O de 512 pesava 39 KB em cada
# página para desenhar um quadrado de 16.
quadrado(180, raio=34).save(IMG / 'apple-touch-icon.png')
quadrado(96, margem=0.12, raio=16).save(IMG / 'favicon-96.png')
quadrado(32, margem=0.10, raio=5).save(IMG / 'favicon-32.png')
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
# recorta pelo terço superior: é onde está o tampo, e não o chão
esq = (foto.width - alvo[0]) // 2
topo = min(max(0, round(foto.height * 0.26)), foto.height - alvo[1])
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
