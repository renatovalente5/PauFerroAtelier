#!/usr/bin/env python3
"""Escreve as dimensões reais de cada fotografia dentro do JSON da peça.

Sem isto o gerador teria de assumir um tamanho, e assumir está errado: 16 das
26 peças foram fotografadas ao alto e 10 ao baixo. Um `width`/`height` errado
no `<img>` reserva o espaço errado e a página salta quando a imagem chega
(Cumulative Layout Shift) — e obrigava a cortar tudo ao mesmo formato, que é
justamente o que faz uma montra parecer um catálogo.
"""
import json
import pathlib
from PIL import Image

RAIZ = pathlib.Path(__file__).resolve().parent.parent

for jf in sorted((RAIZ / 'data/pecas').glob('*.json')):
    peca = json.loads(jf.read_text(encoding='utf-8'))
    dims = {}
    for n in peca['fotos']:
        with Image.open(RAIZ / f"assets/pecas/{peca['slug']}/{n}-1600.jpg") as im:
            dims[n] = list(im.size)
    peca['dimensoes'] = dims
    jf.write_text(json.dumps(peca, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    w, h = dims[peca['fotos'][0]]
    print(f"{peca['slug']:<44} {w}x{h}  {'ao alto' if h > w else 'ao baixo'}")
