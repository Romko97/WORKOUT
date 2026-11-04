CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS exercises (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, equipment TEXT, tracking_type TEXT,
 primary_muscle TEXT, secondary_muscles_json TEXT NOT NULL, is_custom INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS workouts (
 id TEXT PRIMARY KEY, title TEXT NOT NULL, started_at TEXT NOT NULL, ended_at TEXT NOT NULL,
 description TEXT, source_routine_id TEXT);
CREATE TABLE IF NOT EXISTS workout_exercises (
 id INTEGER PRIMARY KEY, workout_id TEXT NOT NULL REFERENCES workouts(id),
 exercise_id TEXT NOT NULL REFERENCES exercises(id), position INTEGER NOT NULL, notes TEXT, superset_id INTEGER,
 UNIQUE(workout_id,position));
CREATE TABLE IF NOT EXISTS workout_sets (
 id INTEGER PRIMARY KEY, workout_exercise_id INTEGER NOT NULL REFERENCES workout_exercises(id),
 position INTEGER NOT NULL, set_type TEXT NOT NULL, weight_kg REAL, reps INTEGER,
 duration_seconds REAL, distance_meters REAL, rpe REAL, custom_metric REAL,
 UNIQUE(workout_exercise_id,position));
CREATE TABLE IF NOT EXISTS routines (id TEXT PRIMARY KEY, title TEXT NOT NULL, source_folder_id INTEGER);
CREATE TABLE IF NOT EXISTS routine_exercises (
 id INTEGER PRIMARY KEY, routine_id TEXT NOT NULL REFERENCES routines(id),
 exercise_id TEXT NOT NULL REFERENCES exercises(id), position INTEGER NOT NULL, notes TEXT,
 rest_seconds INTEGER, superset_id INTEGER, UNIQUE(routine_id,position));
CREATE TABLE IF NOT EXISTS routine_sets (
 id INTEGER PRIMARY KEY, routine_exercise_id INTEGER NOT NULL REFERENCES routine_exercises(id),
 position INTEGER NOT NULL, set_type TEXT NOT NULL, weight_kg REAL, reps INTEGER,
 rep_range_start INTEGER, rep_range_end INTEGER, duration_seconds REAL, distance_meters REAL, custom_metric REAL,
 UNIQUE(routine_exercise_id,position));
CREATE INDEX IF NOT EXISTS workout_exercise_lookup ON workout_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS workout_date_lookup ON workouts(started_at);