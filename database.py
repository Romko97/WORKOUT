"""Local SQLite persistence. Updates are atomic and protected by a revision."""
import json
import math
import re
import sqlite3
from contextlib import contextmanager
from pathlib import Path


class ConflictError(Exception):
    pass


def validate_state(state):
    def text(value, maximum=100):
        if not isinstance(value, str) or len(value) > maximum:
            raise ValueError('Некоректний текст')

    def number(value, maximum=10_000_000):
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not 0 <= value <= maximum:
            raise ValueError('Некоректне число')

    def workout(value, finished=False):
        if not isinstance(value, dict):
            raise ValueError('Некоректне тренування')
        if not isinstance(value.get('id'), str) or not re.fullmatch(r'[a-zA-Z0-9-]{1,80}', value['id']):
            raise ValueError('Некоректний ідентифікатор')
        text(value.get('name'))
        number(value.get('started'), 10**15)
        if finished:
            number(value.get('finished'), 10**15)
            if value['finished'] < value['started']:
                raise ValueError('Некоректна дата завершення')
        exercises = value.get('exercises')
        if not isinstance(exercises, list) or len(exercises) > 100:
            raise ValueError('Некоректний список вправ')
        for exercise in exercises:
            if not isinstance(exercise, dict):
                raise ValueError('Некоректна вправа')
            text(exercise.get('name'))
            sets = exercise.get('sets')
            if not isinstance(sets, list) or len(sets) > 200:
                raise ValueError('Некоректні підходи')
            for item in sets:
                if not isinstance(item, dict) or not isinstance(item.get('done'), bool):
                    raise ValueError('Некоректний підхід')
                text(item.get('id'), 200)
                number(item.get('kg'), 2000)
                number(item.get('reps'), 10000)
                if int(item['reps']) != item['reps']:
                    raise ValueError('Повторення мають бути цілими')
                for field in ('durationSeconds', 'distanceMeters'):
                    if field in item:
                        number(item[field])

    if not isinstance(state, dict):
        raise ValueError('Очікується об’єкт даних')
    for name in ('workouts', 'routines', 'custom'):
        if not isinstance(state.get(name), list) or len(state[name]) > 10000:
            raise ValueError('Некоректний список ' + name)
    for name in ('workouts', 'routines'):
        ids = set()
        for value in state[name]:
            workout(value, name == 'workouts')
            if value['id'] in ids:
                raise ValueError('Дубльований ідентифікатор')
            ids.add(value['id'])
    if state.get('active') is not None:
        workout(state['active'])
    for value in state['custom']:
        text(value)
    catalogue = state.get('exerciseCatalog', [])
    if not isinstance(catalogue, list) or len(catalogue) > 5000:
        raise ValueError('Некоректний каталог')
    ids = set()
    for value in catalogue:
        if not isinstance(value, dict):
            raise ValueError('Некоректна вправа каталогу')
        text(value.get('id'))
        text(value.get('name'))
        if value['id'] in ids:
            raise ValueError('Дубльована вправа каталогу')
        ids.add(value['id'])
    # Reject NaN and Infinity even inside optional metadata.
    json.dumps(state, allow_nan=False)


class Database:
    def __init__(self, path, seed=None):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        first_start = not self.path.exists()
        with self.connect() as connection:
            connection.executescript(Path(__file__).with_name('schema.sql').read_text(encoding='utf-8'))
        if first_start and seed and Path(seed).exists():
            self.write(json.loads(Path(seed).read_text(encoding='utf-8-sig')), 0)

    @contextmanager
    def connect(self):
        connection = sqlite3.connect(self.path, timeout=15)
        try:
            with connection:
                yield connection
        finally:
            connection.close()

    def read(self):
        with self.connect() as connection:
            connection.execute('BEGIN')
            revision, extra = connection.execute('SELECT revision, extra_json FROM app_meta WHERE id=1').fetchone()
            state = json.loads(extra)
            for key, order in [('workouts', 'started, id'), ('routines', 'position'), ('exercises', 'position')]:
                target = 'exerciseCatalog' if key == 'exercises' else key
                state[target] = [json.loads(row[0]) for row in connection.execute(f'SELECT data_json FROM {key} ORDER BY {order}')]
            state.setdefault('custom', [])
            state.setdefault('active', None)
            return {'revision': revision, 'state': state}

    def write(self, state, revision):
        validate_state(state)
        if isinstance(revision, bool) or not isinstance(revision, int) or revision < 0:
            raise ValueError('Некоректна версія')
        dump = lambda value: json.dumps(value, ensure_ascii=False, allow_nan=False, separators=(',', ':'))
        with self.connect() as connection:
            connection.execute('BEGIN IMMEDIATE')
            current = connection.execute('SELECT revision FROM app_meta WHERE id=1').fetchone()[0]
            if revision != current:
                raise ConflictError('Дані змінились в іншій вкладці')
            for table in ('workouts', 'routines', 'exercises'):
                connection.execute(f'DELETE FROM {table}')
            connection.executemany('INSERT INTO workouts VALUES (?,?,?,?)', [(w['id'], w['name'], w['started'], dump(w)) for w in state['workouts']])
            connection.executemany('INSERT INTO routines VALUES (?,?,?,?)', [(r['id'], r['name'], i, dump(r)) for i, r in enumerate(state['routines'])])
            connection.executemany('INSERT INTO exercises VALUES (?,?,?,?)', [(e['id'], e['name'], i, dump(e)) for i, e in enumerate(state.get('exerciseCatalog', []))])
            extra = {key: value for key, value in state.items() if key not in ('workouts', 'routines', 'exerciseCatalog')}
            connection.execute('UPDATE app_meta SET revision=?,extra_json=? WHERE id=1', (current + 1, dump(extra)))
            return current + 1
