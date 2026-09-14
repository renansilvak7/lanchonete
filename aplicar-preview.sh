#!/data/data/com.termux/files/usr/bin/bash
set -e
cd "$HOME/lanchonete"

mkdir -p assets
cp "$(dirname "$0")/preview.png" assets/preview.png
cp "$(dirname "$0")/logo.png" assets/logo.png

python - <<'PY'
from pathlib import Path
p = Path("index.html")
s = p.read_text(encoding="utf-8")
meta = """    <!-- Lanchesk7 - compartilhamento e prévia -->
    <meta name="description" content="Lanchesk7 — lanches artesanais, porções caprichadas e bebidas geladas.">
    <meta property="og:type" content="website">
    <meta property="og:title" content="Lanchesk7 | Lanches">
    <meta property="og:description" content="Lanches artesanais, porções caprichadas e bebidas geladas.">
    <meta property="og:url" content="https://lanchonete.lanchesk7.workers.dev/">
    <meta property="og:image" content="https://lanchonete.lanchesk7.workers.dev/assets/preview.png">
    <meta property="og:image:alt" content="Hambúrguer, batatas fritas e Coca-Cola da Lanchesk7">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Lanchesk7 | Lanches">
    <meta name="twitter:description" content="Lanches artesanais, porções caprichadas e bebidas geladas.">
    <meta name="twitter:image" content="https://lanchonete.lanchesk7.workers.dev/assets/preview.png">
    <link rel="icon" type="image/png" href="assets/logo.png">
"""
if '<meta property="og:image"' in s:
    import re
    s = re.sub(r'\s*<!-- Lanchesk7 - compartilhamento e prévia -->.*?<link rel="icon" type="image/png" href="assets/logo\.png">\s*', '\n', s, flags=re.S)
head_close = s.lower().find("</head>")
if head_close == -1:
    raise SystemExit("Não encontrei </head> no index.html")
s = s[:head_close] + meta + s[head_close:]
p.write_text(s, encoding="utf-8")
PY

git add index.html assets/preview.png assets/logo.png
git commit -m "Adiciona prévia e identidade visual da Lanchesk7"
git push
echo
echo "Pronto. O Cloudflare vai publicar automaticamente."
