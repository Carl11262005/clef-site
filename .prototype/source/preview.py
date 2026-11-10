"""Local-only static preview with SPA navigation; no app services."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=4174)
args = parser.parse_args()
output = Path(__file__).resolve().parent / 'output'

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(output), **kwargs)
    def do_GET(self):
        path = Path(self.translate_path(urlsplit(self.path).path))
        if not path.exists() and not path.suffix:
            self.path = '/index.html'
        return super().do_GET()

print(f'CLEF demo: http://127.0.0.1:{args.port}/demo/', flush=True)
ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
