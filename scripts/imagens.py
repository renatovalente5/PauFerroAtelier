#!/usr/bin/env python3
"""
Prepara as fotografias das peças.

Porque existe: este site é 90 % fotografia de madeira. As originais são de
telemóvel e de máquina — até 3024 px e 675 KB cada — e são 66. Servidas em
bruto seriam 20 MB por visita e o site não abriria em dados móveis.

O que faz de diferente dos projectos anteriores: gera **três formatos** por
tamanho, e não só WebP.

    AVIF  → primeiro na lista. Cerca de metade do peso do JPEG à mesma
            qualidade percebida, e é onde se ganha o carregamento numa página
            que é toda imagem.
    WebP  → a rede de segurança, com suporte praticamente universal.
    JPEG  → o último recurso, e o único formato que o WhatsApp aceita nas
            pré-visualizações de link.

O `<picture>` do gerador oferece-os por esta ordem e o browser escolhe o
primeiro que souber ler. Quem não souber nenhum dos dois primeiros recebe JPEG,
que qualquer coisa lê.

Correr:  python3 scripts/imagens.py            (só o que falta)
         python3 scripts/imagens.py --tudo     (refaz tudo)
"""
import json
import re
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps, features
except ImportError:
    sys.exit('Falta o Pillow:  pip3 install Pillow')

RAIZ = Path(__file__).resolve().parent.parent
ORIGINAIS = RAIZ / '_fonte' / 'originais'
DESTINO = RAIZ / 'assets' / 'pecas'
PECAS = RAIZ / 'data' / 'pecas'

LARGURAS = [480, 960, 1600]
# Qualidades afinadas por formato: o AVIF aguenta um número mais baixo para o
# mesmo resultado visível, e é daí que vem a poupança.
QUALIDADE = {'AVIF': 52, 'WEBP': 78, 'JPEG': 82}
OG = (1200, 630)

TUDO = '--tudo' in sys.argv


def carregar(caminho: Path) -> Image.Image:
    im = Image.open(caminho)
    # Sem isto, fotografias de telemóvel aparecem deitadas: a rotação está nos
    # metadados EXIF e não nos pixéis.
    return ImageOps.exif_transpose(im).convert('RGB')


def variantes(im: Image.Image, pasta: Path, base: str) -> int:
    feitas = 0
    for w in LARGURAS:
        escala = im.copy()
        if escala.width > w:
            escala.thumbnail((w, w * 10), Image.LANCZOS)
        for fmt, ext in (('AVIF', 'avif'), ('WEBP', 'webp'), ('JPEG', 'jpg')):
            saida = pasta / f'{base}-{w}.{ext}'
            if saida.exists() and not TUDO:
                continue
            escala.save(saida, fmt, quality=QUALIDADE[fmt], **({'method': 6} if fmt == 'WEBP' else {}))
            feitas += 1
    return feitas


def cartao_partilha(im: Image.Image, pasta: Path):
    """1200×630 em JPEG. É a única imagem do site neste formato e neste rácio,
    e existe só para as pré-visualizações do WhatsApp e do Facebook — que não
    mostram AVIF nem WebP de forma fiável."""
    ImageOps.fit(im, OG, Image.LANCZOS, centering=(0.5, 0.45)).save(
        pasta / 'og.jpg', 'JPEG', quality=82, optimize=True)


def main():
    if not features.check('avif'):
        print('AVISO: este Pillow não escreve AVIF — só saem WebP e JPEG.')
    if not ORIGINAIS.exists():
        sys.exit(f'não encontrei {ORIGINAIS}')

    # Agrupar por conjunto: conjunto_<n>_<i>.jpg
    conjuntos = {}
    for f in sorted(ORIGINAIS.glob('conjunto_*.jpg')):
        m = re.match(r'conjunto_(\d+)_(\d+)\.jpg$', f.name)
        if m:
            conjuntos.setdefault(int(m.group(1)), []).append((int(m.group(2)), f))

    # O slug de cada peça vem dos dados, se já existirem; senão é o número. Isto
    # deixa renomear as peças mais tarde sem refazer as imagens à mão.
    slugs = {}
    for j in PECAS.glob('*.json'):
        d = json.loads(j.read_text(encoding='utf-8'))
        if d.get('conjunto'):
            slugs[int(d['conjunto'])] = d['slug']

    total = 0
    for n in sorted(conjuntos):
        slug = slugs.get(n, f'peca-{n:02d}')
        pasta = DESTINO / slug
        pasta.mkdir(parents=True, exist_ok=True)
        fotos = sorted(conjuntos[n])
        for i, (_, f) in enumerate(fotos, 1):
            im = carregar(f)
            total += variantes(im, pasta, f'{i:02d}')
            if i == 1:
                cartao_partilha(im, pasta)
        print(f'  {slug}: {len(fotos)} fotografias')

    print(f'\n{len(conjuntos)} peças · {total} ficheiros novos')

    if total:
        pesos = {}
        for ext in ('avif', 'webp', 'jpg'):
            fs = list(DESTINO.rglob(f'*-1600.{ext}'))
            if fs:
                pesos[ext] = sum(f.stat().st_size for f in fs) // max(1, len(fs))
        if 'jpg' in pesos:
            print('\npeso médio de uma fotografia a 1600 px:')
            for ext, p in pesos.items():
                poupanca = f'  ({100 - 100 * p // pesos["jpg"]}% mais leve que JPEG)' if ext != 'jpg' else ''
                print(f'  {ext.upper():5} {p // 1024:4} KB{poupanca}')


if __name__ == '__main__':
    main()
