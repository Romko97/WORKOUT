const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const crypto = require('crypto');

const exercise = (kg, reps) => ({ name: 'Жим', sets: [{ id: crypto.randomUUID(), kg, reps, done: true }] });
const fixture = {
  workouts: [
    { id: 'first', name: 'Перше', started: 1000, finished: 2000, exercises: [exercise(100, 10), exercise(50, 10)] },
    { id: 'second', name: 'Друге', started: 3000, finished: 4000, exercises: [exercise(70, 10)] }
  ],
  routines: [{ id: 'plan', name: 'Програма', started: 1000, exercises: [exercise(80, 10)] }],
  active: { id: 'active', name: 'Активне', started: 5000, exercises: [exercise(20, 5)] },
  custom: ['Жим'], exerciseCatalog: [{ id: 'bench', name: 'Жим' }]
};
let allow = false, writes = [], fail = false;
const elements = new Map();
const element = id => {
  if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', hidden: false, value: '' });
  return elements.get(id);
};
const context = {
  window: {}, crypto: crypto.webcrypto, Date,
  document: { getElementById: element },
  localStorage: { setItem() {} },
  formaSync: { load: async () => JSON.parse(JSON.stringify(fixture)), save: state => {
    if (fail) throw Error('cache unavailable');
    writes.push(JSON.parse(JSON.stringify(state)));
  } },
  confirm: () => allow, setTimeout() {}, clearTimeout() {}, setInterval() {}, navigator: {}
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../static/effects.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../static/localization.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../static/muscles.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../static/anatomy.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../static/custom-exercises.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../static/set-controls.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../static/date-editor.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../static/app.js'), 'utf8'), context);
const run = code => vm.runInContext(code, context);

(async () => {
  await context.window.formaReady;
  run("go('history');deleteHistoryExercise('first', 0)");
  assert.equal(writes.length, 0, 'Cancel must not save or delete');
  assert.equal(run('db.workouts[0].exercises.length'), 2);
  allow = true;
  run("deleteHistoryExercise('missing', 0);deleteHistoryExercise('first', -1);deleteHistoryExercise('first', 999)");
  assert.equal(writes.length, 0, 'Invalid targets must not save');
  run("deleteHistoryExercise('first', 0)");
  assert.equal(run('db.workouts[0].exercises.length'), 1);
  assert.equal(run('volume(db.workouts[0])'), 500);
  assert.equal(run('completed(db.workouts[0])'), 1);
  assert.ok(run('progressView()').includes('70,0 кг'), 'Record must be recomputed from remaining history');
  assert.deepEqual(writes.at(-1).workouts[1], fixture.workouts[1]);
  assert.deepEqual(writes.at(-1).routines, fixture.routines);
  assert.deepEqual(writes.at(-1).active, fixture.active);
  assert.deepEqual(writes.at(-1).exerciseCatalog, fixture.exerciseCatalog);
  fail = true;
  run("deleteHistoryExercise('first', 0)");
  assert.equal(run('db.workouts[0].exercises.length'), 1, 'Save failure must restore the removed exercise');
  fail = false;
  run("deleteHistoryExercise('first', 0)");
  assert.equal(writes.at(-1).workouts.length, 2, 'Empty workout must remain in history');
  assert.equal(writes.at(-1).workouts[0].exercises.length, 0);
  assert.ok(run('history()').includes('У цьому тренуванні немає вправ.'));
  allow = false;
  const beforeDayDelete = writes.length;
  run("deleteHistoryWorkout('first')");
  assert.equal(writes.length, beforeDayDelete, 'Cancelled full-day deletion must not save');
  assert.equal(run('db.workouts.length'), 2);
  allow = true;
  fail = true;
  run("deleteHistoryWorkout('first')");
  assert.equal(run('db.workouts.length'), 2, 'Failed save must restore entire workout');
  assert.equal(run('db.deletedWorkoutIds'), undefined, 'Failed save must not retain tombstone');
  fail = false;
  run("deleteHistoryWorkout('first');deleteHistoryWorkout('missing')");
  assert.equal(run('db.workouts.length'), 1);
  assert.equal(run('db.workouts[0].id'), 'second');
  assert.equal(run('db.deletedWorkoutIds[0]'), 'first');
  assert.deepEqual(writes.at(-1).active, fixture.active);
  assert.deepEqual(writes.at(-1).routines, fixture.routines);
  run("deleteHistoryWorkout('second')");
  assert.equal(run('db.workouts.length'), 0);
  assert.ok(run('history()').includes('Тут буде ваша історія'));
  console.log('PASS: confirmation, target selection, recalculated totals and records, preserved other data, save rollback and last-exercise removal.');
  console.log('PASS: full-day removal, cancellation, failed-save recovery, deletion markers, preserved plans/active workout and empty history.');
})().catch(error => { console.error(error); process.exitCode = 1; });
