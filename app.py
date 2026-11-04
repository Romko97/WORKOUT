"""Run the personal Forma app: python app.py (Python 3.10+)."""
import argparse
import json
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, unquote
from database import Database, ConflictError

ROOT = Path(__file__).resolve().parent
MAX_BODY = 10 * 1024 * 1024


def make_handler(database):
    class Handler(BaseHTTPRequestHandler):
        def respond(self, status, body, content_type='application/json; charset=utf-8'):
            payload = body if isinstance(body, bytes) else json.dumps(body, ensure_ascii=False).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(payload)))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('X-Frame-Options', 'DENY')
            self.end_headers()
            self.wfile.write(payload)

        def allowed(self):
            expected = f'127.0.0.1:{self.server.server_port}'
            if self.headers.get('Host') != expected:
                self.respond(403, {'error': 'Відкрийте сайт через 127.0.0.1'})
                return False
            if self.command == 'PUT' and self.headers.get('Origin') != 'http://' + expected:
                self.respond(403, {'error': 'Запит з іншого сайту заборонено'})
                return False
            return True

        def do_GET(self):
            if not self.allowed():
                return
            path = unquote(urlsplit(self.path).path)
            if path == '/api/state':
                self.respond(200, database.read())
            elif path == '/':
                self.respond(200, (ROOT/'templates/index.html').read_bytes(), 'text/html; charset=utf-8')
            elif path.startswith('/static/'):
                target = (ROOT/path.lstrip('/')).resolve()
                if not target.is_relative_to(ROOT/'static') or not target.is_file():
                    self.respond(404, {'error': 'Файл не знайдено'})
                    return
                mime = mimetypes.guess_type(target.name)[0] or 'application/octet-stream'
                self.respond(200, target.read_bytes(), mime + '; charset=utf-8')
            else:
                self.respond(404, {'error': 'Не знайдено'})

        def do_PUT(self):
            if not self.allowed():
                return
            if urlsplit(self.path).path != '/api/state':
                self.respond(404, {'error': 'Не знайдено'})
                return
            try:
                if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
                    self.respond(415, {'error': 'Потрібен JSON'})
                    return
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= MAX_BODY:
                    self.respond(413, {'error': 'Файл завеликий або порожній'})
                    return
                body = json.loads(self.rfile.read(length))
                revision = database.write(body['state'], body['revision'])
                self.respond(200, {'revision': revision})
            except ConflictError as error:
                self.respond(409, {'error': str(error)})
            except (ValueError, TypeError, KeyError) as error:
                self.respond(400, {'error': 'Некоректні дані: ' + str(error)})
            except Exception:
                self.respond(500, {'error': 'Не вдалося зберегти дані. Спробуйте ще раз.'})

    return Handler


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()
    database = Database(ROOT/'data/forma.sqlite', ROOT/'data/initial-state.json')
    server = ThreadingHTTPServer(('127.0.0.1', args.port), make_handler(database))
    print(f'Forma: http://127.0.0.1:{args.port}', flush=True)
    print('Keep this window open. Press Ctrl+C to stop.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
