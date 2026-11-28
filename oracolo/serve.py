#!/usr/bin/env python3
"""Server statico locale senza dipendenze. Avvio: python3 serve.py [--port 8080]."""
from argparse import ArgumentParser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class LocalHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()


def main():
    parser = ArgumentParser(description="L'Oracolo di Delfi — server statico locale")
    parser.add_argument('--port', type=int, default=8080)
    parser.add_argument('--host', default='127.0.0.1')
    args = parser.parse_args()
    directory = Path(__file__).resolve().parent
    handler = partial(LocalHandler, directory=str(directory))
    try:
        server = ThreadingHTTPServer((args.host, args.port), handler)
    except OSError as error:
        parser.exit(1, f'Impossibile avviare il server: {error}. Prova --port 8081.\n')
    print(f"L'Oracolo di Delfi è pronto: http://{args.host}:{server.server_address[1]}", flush=True)
    print('Premi Ctrl+C per fermare il server.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nIl santuario chiude. A presto!', flush=True)
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
