#!/usr/bin/env python3
"""
Escreve os dados das 26 peças a partir do que se vê nas fotografias.

Regra que mandou nisto: **não se inventa nada**. Não se nomeia a espécie da
madeira, não se dão medidas, não se põem preços — as peças são por encomenda e
o cliente não forneceu nada disso. Descreve-se o que a fotografia mostra e mais
nada. A cor da resina só aparece quando é inequívoca na imagem.

O que fica por preencher, o cliente preenche no backoffice.
"""
import json
import re
import shutil
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DADOS = RAIZ / 'data' / 'pecas'
FOTOS = RAIZ / 'assets' / 'pecas'

# conjunto: (slug, categoria, nome, resina, nota visível na fotografia)
PECAS = [
    (1,  'mesa-jantar-veio-central-carvalho', 'mesa-jantar', 'Mesa de jantar com veio central', 'clara',
     'Tampo de madeira maciça atravessado por um veio de resina, sobre pés metálicos em V.'),
    (2,  'tampo-macico-grande-formato', 'mesa-jantar', 'Tampo maciço de grande formato', '',
     'Tampo de grande formato em madeira maciça, ainda em oficina, antes do acabamento final.'),
    (3,  'mesa-jantar-borda-natural-rio-escuro', 'mesa-jantar', 'Mesa de jantar de borda natural', 'preta',
     'Duas abas de borda natural unidas por um rio de resina escura, que segue o contorno irregular da madeira.'),
    (4,  'mesa-jantar-rio-azul', 'mesa-jantar', 'Mesa de jantar com rio azul', 'azul',
     'Rio de resina azul a percorrer o tampo de ponta a ponta, com os nós da madeira à vista.'),
    (5,  'mesa-jantar-rio-turquesa-iluminado', 'mesa-jantar', 'Mesa de jantar com rio turquesa iluminado', 'turquesa',
     'Rio de resina turquesa com iluminação embutida, que acende por baixo da resina.'),
    (6,  'mesa-jantar-rio-escuro-borda-natural', 'mesa-jantar', 'Mesa de jantar com rio escuro', 'preta',
     'Tampo de borda natural com rio de resina escura e pés metálicos.'),
    (7,  'mesa-jantar-tampo-claro', 'mesa-jantar', 'Mesa de jantar de tampo claro', 'clara',
     'Madeira clara com veio de resina translúcida, sobre pernas metálicas rectas.'),
    (8,  'mesa-jantar-rio-esmeralda-pes-dourados', 'mesa-jantar', 'Mesa de jantar com rio esmeralda', 'esmeralda',
     'Rio de resina verde esmeralda entre duas abas de borda natural, sobre pés em X dourados.'),
    (9,  'mesa-centro-tronco', 'mesa-centro', 'Mesa de centro em tronco', '',
     'Peça baixa feita de uma secção de tronco, com o contorno natural mantido.'),
    (10, 'mesa-jantar-longa-rio-escuro', 'mesa-jantar', 'Mesa de jantar longa', 'preta',
     'Mesa de grande comprimento para muitos lugares, com rio de resina escura ao centro.'),
    (11, 'mesa-jantar-rio-turquesa', 'mesa-jantar', 'Mesa de jantar com rio turquesa', 'turquesa',
     'Rio de resina turquesa iluminado, num tampo de borda natural.'),
    (12, 'mesa-jantar-rio-verde-azulado', 'mesa-jantar', 'Mesa de jantar com rio verde-azulado', 'esmeralda',
     'Rio de resina entre verde e azul, num tampo com nós e fendas preenchidas.'),
    (13, 'mesa-jantar-longa-rio-turquesa', 'mesa-jantar', 'Mesa de jantar longa com rio turquesa', 'turquesa',
     'Tampo longo de borda natural com um rio de resina turquesa a toda a extensão.'),
    (14, 'mesa-jantar-borda-natural-macica', 'mesa-jantar', 'Mesa de jantar de borda natural', '',
     'Tampo maciço com as duas bordas naturais preservadas e a superfície polida.'),
    (15, 'mesa-jantar-madeira-escura', 'mesa-jantar', 'Mesa de jantar em madeira escura', 'preta',
     'Tampo de tom escuro com veio de resina e pés metálicos.'),
    (16, 'louceiro-madeira-macica', 'movel', 'Louceiro em madeira maciça', '',
     'Móvel de arrumação em madeira maciça, com portas envidraçadas e gavetas. Marcenaria tradicional, sem resina.'),
    (17, 'mesa-jantar-rio-escuro-interior', 'mesa-jantar', 'Mesa de jantar com rio escuro', 'preta',
     'Tampo de borda natural com rio de resina escura, sobre pés em X.'),
    (18, 'mesa-jantar-resina-translucida', 'mesa-jantar', 'Mesa de jantar com resina translúcida', 'clara',
     'Resina translúcida a preencher o vão entre as duas abas, deixando ver o contorno da madeira.'),
    (19, 'mesa-jantar-rio-turquesa-moderna', 'mesa-jantar', 'Mesa de jantar com rio turquesa', 'turquesa',
     'Rio de resina turquesa num tampo longo de borda natural.'),
    (20, 'aparador-resina-verde', 'aparador', 'Aparador com resina verde', 'esmeralda',
     'Aparador de madeira maciça com uma faixa de resina verde a atravessar as portas e o tampo.'),
    (21, 'mesa-jantar-rio-escuro-espaco-comercial', 'mesa-jantar', 'Mesa de jantar com rio escuro', 'preta',
     'Tampo de borda natural com rio de resina escura, num espaço comercial.'),
    (22, 'conjunto-mesas-apoio-redondas', 'mesa-apoio', 'Conjunto de mesas de apoio', 'preta',
     'Três mesas redondas de alturas diferentes, com tampos de madeira e resina e estruturas metálicas em tom cobre.'),
    (23, 'tampo-casa-banho-dois-lavatorios', 'casa-de-banho', 'Tampo de casa de banho', '',
     'Tampo de madeira maciça para dois lavatórios de pousar, tratado para ambiente húmido.'),
    (24, 'mesa-redonda-rio-preto', 'mesa-redonda', 'Mesa redonda com rio preto', 'preta',
     'Tampo redondo dividido por veios de resina preta que seguem o desenho da madeira.'),
    (25, 'mesa-redonda-resina-clara', 'mesa-redonda', 'Mesa redonda com resina clara', 'clara',
     'Tampo redondo com veios de resina clara, sobre pé central metálico.'),
    (26, 'movel-casa-banho-resina-escura', 'casa-de-banho', 'Móvel de casa de banho', 'preta',
     'Móvel suspenso com frentes em madeira e resina escura, com lavatório integrado.'),
]

CATEGORIAS = {
    'mesa-jantar': 'Mesas de jantar',
    'mesa-redonda': 'Mesas redondas',
    'mesa-centro': 'Mesas de centro',
    'mesa-apoio': 'Mesas de apoio',
    'aparador': 'Aparadores',
    'casa-de-banho': 'Casa de banho',
    'movel': 'Outros móveis',
}

# As que abrem a montra. Escolhidas pelas que mostram melhor o que o atelier faz:
# rio de resina a cores, borda natural, e uma peça que não é mesa.
DESTAQUES = {8, 13, 5, 20, 24, 4}


def main():
    DADOS.mkdir(parents=True, exist_ok=True)
    for f in DADOS.glob('*.json'):
        f.unlink()

    for i, (n, slug, cat, nome, resina, desc) in enumerate(PECAS, 1):
        antiga = FOTOS / f'peca-{n:02d}'
        nova = FOTOS / slug
        if antiga.exists() and not nova.exists():
            shutil.move(str(antiga), str(nova))
        fotos = sorted({re.match(r'(\d+)-', f.name).group(1)
                        for f in nova.glob('*-1600.avif')}) if nova.exists() else []
        d = {
            'slug': slug,
            'conjunto': n,
            'nome': nome,
            'categoria': cat,
            'resina': resina,
            'descricao': desc,
            # Sem preço e sem medidas de propósito: as peças são por encomenda e
            # o cliente não forneceu nenhum dos dois. Inventar seria mentir ao
            # comprador e criar uma promessa que o atelier não fez.
            'madeira': '',
            'medidas': '',
            'destaque': n in DESTAQUES,
            'publicado': True,
            'ordem': i,
            'fotos': fotos,
        }
        (DADOS / f'{slug}.json').write_text(
            json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    print(f'{len(PECAS)} peças escritas')
    from collections import Counter
    for cat, n in Counter(p[2] for p in PECAS).most_common():
        print(f'  {CATEGORIAS[cat]:20} {n}')


if __name__ == '__main__':
    main()
