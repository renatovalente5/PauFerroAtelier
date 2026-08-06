#!/usr/bin/env python3
"""Extrai o logótipo do JPEG original para dois PNG com transparência.

Não se redesenha nem se vectoriza nada: é o traço do cliente, tal como ele o
tem. O que se faz é tirar o fundo branco e guardar o desenho em dois tons — um
para o papel, outro para o rodapé escuro.

O tamanho é escolhido, não herdado. O ficheiro de origem tem 900 px de largura e
o site mostra o logótipo no máximo a 92 px de altura; guardá-lo com 900 px de
largura custava 197 KB em **todas** as páginas para desenhar 76. A 420 px cobre
três vezes a maior utilização, que chega para qualquer ecrã.

E vai em modo LA (cinzento + transparência) em vez de RGBA: o desenho é a uma
cor, os três canais de cor eram três cópias da mesma coisa.
"""
import pathlib
from PIL import Image, ImageChops, ImageOps

RAIZ = pathlib.Path(__file__).resolve().parent.parent
LARGURA = 420

orig = Image.open(RAIZ / '_fonte/originais/logo.jpg').convert('L')

# corta a margem branca à volta do desenho
caixa = ImageChops.invert(orig).getbbox()
orig = orig.crop(caixa)

alt = round(orig.height * LARGURA / orig.width)
orig = orig.resize((LARGURA, alt), Image.LANCZOS)

# a tinta do desenho vira opacidade; o branco do papel vira transparência
alfa = ImageOps.invert(orig).point(lambda v: min(255, int(v * 1.15)))

for nome, tom in (('logo-tinta', 17), ('logo-claro', 255)):
    im = Image.merge('LA', (Image.new('L', orig.size, tom), alfa))
    caminho = RAIZ / f'assets/img/{nome}.png'
    im.save(caminho, optimize=True)
    print(f'{nome}.png  {LARGURA}x{alt}  {caminho.stat().st_size / 1024:.1f} KB')
