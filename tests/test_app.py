import copy
import http.client
import json
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from http.server import ThreadingHTTPServer

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from database import Database, ConflictError
from app import make_handler

TEST_ROOT = Path(__file__).resolve().parents[1]/'data'

def temporary_directory():
    TEST_ROOT.mkdir(exist_ok=True)
    return tempfile.TemporaryDirectory(prefix='test-', dir=TEST_ROOT)

def cleanup(directory):
    target = Path(directory.name).resolve()
    assert target.parent == TEST_ROOT.resolve() and target.name.startswith('test-')
    directory.cleanup()

def example():
    return {'workouts': [], 'routines': [], 'active': {
        'id': 'test-workout', 'name': 'Моє тренування', 'started': 1000,
        'exercises': [{'name': 'Жим', 'sets': [{'id': 'set-1', 'kg': 22.7, 'reps': 10, 'done': True}]}]
    }, 'custom': ['Жим'], 'exerciseCatalog': []}


class PersistenceTests(unittest.TestCase):
    def setUp(self):
        self.directory = temporary_directory()
        self.path = Path(self.directory.name)/'test.sqlite'
        self.database = Database(self.path)

    def tearDown(self):
        cleanup(self.directory)

    def test_reopen_preserves_active_sets(self):
        state = example()
        revision = self.database.write(state, 0)
        reopened = Database(self.path).read()
        self.assertEqual(reopened['revision'], revision)
        self.assertEqual(reopened['state'], state)

    def test_completed_history_routines_and_metadata_roundtrip(self):
        state = example()
        state['workouts'] = [{**state['active'], 'finished': 5000}]
        state['routines'] = [copy.deepcopy(state['active'])]
        state['exerciseCatalog'] = [{'id': 'exercise-1', 'name': 'Жим', 'type': 'weight_reps'}]
        state['hevySeedVersion'] = 'test-version'
        self.database.write(state, 0)
        self.assertEqual(self.database.read()['state'], state)

    def test_stale_revision_cannot_overwrite(self):
        self.database.write(example(), 0)
        changed = example()
        changed['active']['name'] = 'Інша вкладка'
        with self.assertRaises(ConflictError):
            self.database.write(changed, 0)
        self.assertEqual(self.database.read()['state']['active']['name'], 'Моє тренування')

    def test_invalid_state_does_not_erase_existing_data(self):
        self.database.write(example(), 0)
        invalid = example()
        invalid['active']['exercises'][0]['sets'][0]['reps'] = 1.5
        with self.assertRaises(ValueError):
            self.database.write(invalid, 1)
        self.assertEqual(self.database.read()['revision'], 1)

    def test_seed_applied_only_once(self):
        seed = Path(self.directory.name)/'seed.json'
        seed.write_text(json.dumps(example()), encoding='utf-8')
        another_path = Path(self.directory.name)/'seeded.sqlite'
        seeded = Database(another_path, seed)
        updated = example()
        updated['active']['name'] = 'Змінено'
        seeded.write(updated, 1)
        self.assertEqual(Database(another_path, seed).read()['state']['active']['name'], 'Змінено')


class APITests(unittest.TestCase):
    def setUp(self):
        self.directory = temporary_directory()
        database = Database(Path(self.directory.name)/'test.sqlite')
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), make_handler(database))
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.port = self.server.server_port

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        cleanup(self.directory)

    def request(self, method, path, body=None, extra_headers=None):
        connection = http.client.HTTPConnection('127.0.0.1', self.port)
        headers = {'Content-Type': 'application/json', 'Origin': f'http://127.0.0.1:{self.port}'}
        headers.update(extra_headers or {})
        connection.request(method, path, json.dumps(body) if body is not None else None, headers)
        response = connection.getresponse()
        result = response.status, response.read()
        connection.close()
        return result

    def test_api_save_read_and_conflict(self):
        self.assertEqual(self.request('PUT', '/api/state', {'revision': 0, 'state': example()})[0], 200)
        status, body = self.request('GET', '/api/state')
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body)['state']['active'], example()['active'])
        self.assertEqual(self.request('PUT', '/api/state', {'revision': 0, 'state': example()})[0], 409)

    def test_private_files_and_path_traversal_not_served(self):
        for path in ['/data/initial-state.json', '/data/forma.sqlite', '/static/../app.py', '/static/%2e%2e/app.py']:
            self.assertEqual(self.request('GET', path)[0], 404)

    def test_origin_and_host_checks(self):
        self.assertEqual(self.request('PUT', '/api/state', {'revision': 0, 'state': example()}, {'Origin': 'https://example.com'})[0], 403)
        self.assertEqual(self.request('GET', '/api/state', extra_headers={'Host': 'example.com'})[0], 403)

    def test_frontend_files_served(self):
        for path in ['/', '/static/app.js', '/static/api.js', '/static/styles.css']:
            status, body = self.request('GET', path)
            self.assertEqual(status, 200)
            self.assertTrue(body)


if __name__ == '__main__':
    unittest.main()
