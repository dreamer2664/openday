"""Crea un singolo HTML con tutti i font, SVG, stili e script incorporati."""
from pathlib import Path
import base64
import mimetypes
import re
from html.parser import HTMLParser

WORKSPACE = Path(__file__).resolve().parent
PROJECT = WORKSPACE / 'oracolo-di-delfi'
OUTPUT = WORKSPACE / 'Oracolo-di-Delfi-Deluxe.html'


def data_uri(file):
    file = file.resolve()
    if not file.is_relative_to(PROJECT.resolve()):
        raise ValueError(f'Risorsa esterna al progetto: {file}')
    mime = {'.woff2': 'font/woff2', '.svg': 'image/svg+xml'}.get(file.suffix)
    mime = mime or mimetypes.guess_type(file.name)[0] or 'application/octet-stream'
    return f'data:{mime};base64,' + base64.b64encode(file.read_bytes()).decode('ascii')


def inline_css(match):
    file = PROJECT / match.group(1)
    css = file.read_text(encoding='utf-8')
    def replace_url(url_match):
        resource = url_match.group(1).strip(' \"\'')
        if resource.startswith('data:'):
            return url_match.group(0)
        return 'url("' + data_uri(file.parent / resource) + '")'
    css = re.sub(r'url\(([^)]+)\)', replace_url, css)
    return '<style>\n' + css + '\n</style>'


def inline_image(match):
    tag = match.group(0)
    return re.sub(r'src="([^"]+)"', lambda source: 'src="' + data_uri(PROJECT / source.group(1)) + '"', tag)


def inline_script(match):
    file = PROJECT / match.group(1)
    source = file.read_text(encoding='utf-8')
    if file.name == 'app.js':
        marker = '  // file:// funziona senza server;'
        if marker not in source or not source.rstrip().endswith('})();'):
            raise ValueError('Struttura di app.js non riconosciuta: nessun file prodotto.')
        source = source[:source.index(marker)]
        # Il gioco non invia form: usa eventi locali anche nei viewer isolati.
        source = source.replace("  form.addEventListener('submit', consult);", "  form.addEventListener('submit', consult);\n  consultButton.addEventListener('click', consult);")
        source = source.replace("if (phase === 'ask') form.requestSubmit();", "if (phase === 'ask') consultButton.click();")
        source += "  // Documento autonomo: niente service worker, server o risorse esterne.\n"
        source += "  byId('offlineStatus').textContent = 'HTML AUTONOMO';\n})();\n"
    source = source.replace('</script', '<\\/script')
    return '<script>\n' + source + '\n</script>'


html = (PROJECT / 'index.html').read_text(encoding='utf-8')
html = html.replace('<html lang="it">', '<html lang="it" data-standalone="true">', 1)
html = html.replace("<title>L'Oracolo di Delfi — Un incontro con il destino</title>", "<title>L'Oracolo di Delfi — HTML autonomo</title>")
html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', inline_css, html)
html = html.replace('href="assets/favicon.svg"', 'href="' + data_uri(PROJECT / 'assets/favicon.svg') + '"')
html = re.sub(r'<img\b[^>]*>', inline_image, html)
html = re.sub(r'<script src="([^"]+)"></script>', inline_script, html)
html = html.replace('<button type="submit" class="btn btn-consult"', '<button type="button" class="btn btn-consult"', 1)
html = html.replace('class="wordmark" href="index.html" aria-label="L\'Oracolo di Delfi, pagina iniziale"', 'class="wordmark" href="#cabinet" aria-label="Torna all\'inizio della pagina"')

# I collegamenti interni non devono navigare fuori dal documento nei viewer srcdoc.
fragment_navigation = '''
<script>
(function () {
  document.addEventListener('click', function (event) {
    if (!(event.target instanceof Element)) return;
    var link = event.target.closest('a[href^="#"]');
    if (!link) return;
    var target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    event.preventDefault();
    if (target.id === 'domanda' && target.disabled) {
      target = document.querySelector('#btnAgain:not([hidden])') || document.querySelector('#stateConsult:not([hidden])') || document.getElementById('santuario');
    }
    target.focus({preventScroll: true});
    target.scrollIntoView({block: target.id === 'domanda' ? 'center' : 'start', behavior: 'auto'});
  });
})();
</script>
'''
licenses = '\n\n'.join((PROJECT / 'assets/fonts' / name).read_text(encoding='utf-8') for name in ['PressStart2P-OFL.txt', 'VT323-OFL.txt'])
licenses = licenses.replace('</script', '<\\/script')
html = html.replace('</body>', fragment_navigation + '<script type="text/plain" id="licenze-font">\n' + licenses + '\n</script>\n</body>')
html = html.replace('<head>', '<head>\n<!-- FILE AUTONOMO: aprire questo HTML direttamente nel browser.\nTutti gli script, i font, gli stili e gli SVG sono incorporati. Nessun server richiesto. -->', 1)


class DependencyCheck(HTMLParser):
    def handle_starttag(self, tag, attributes):
        for key, value in attributes:
            if key in {'src', 'href'} and value and not value.startswith(('data:', '#')):
                raise ValueError(f'Dipendenza rimasta: {tag} {key}={value}')


DependencyCheck().feed(html)
assert not re.search(r'url\((?![\"\']?data:)', html)
assert 'navigator.serviceWorker.register' not in html
if OUTPUT.exists():
    previous = OUTPUT.read_text(encoding='utf-8')
    if 'data-standalone="true"' not in previous or '<!-- FILE AUTONOMO:' not in previous:
        raise SystemExit('Il file esistente non è una versione generata da questo strumento.')
OUTPUT.write_text(html, encoding='utf-8')
print(f'Creato: {OUTPUT.name}')
print(f'Dimensione: {OUTPUT.stat().st_size:,} byte')
print('Dipendenze esterne: nessuna. Font, SVG, CSS, JavaScript e licenze incorporati.')
