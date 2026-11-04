'use strict';

// Primary and secondary muscle metadata from Hevy exercise templates.
const hevyMuscleReference = Object.freeze({
  "Warm Up": {
    "primary": "full_body",
    "secondary": []
  },
  "Shoulder Press (Dumbbell)": {
    "primary": "shoulders",
    "secondary": [
      "triceps"
    ]
  },
  "Shrug (Dumbbell)": {
    "primary": "traps",
    "secondary": [
      "neck"
    ]
  },
  "Leg Extension (Machine)": {
    "primary": "quadriceps",
    "secondary": []
  },
  "Cable Fly Crossovers": {
    "primary": "chest",
    "secondary": []
  },
  "Face Pull": {
    "primary": "shoulders",
    "secondary": [
      "biceps"
    ]
  },
  "Bent Over Row (Barbell)": {
    "primary": "upper_back",
    "secondary": [
      "lats",
      "biceps",
      "forearms"
    ]
  },
  "Leg Press (Machine)": {
    "primary": "quadriceps",
    "secondary": [
      "glutes",
      "hamstrings"
    ]
  },
  "Chest Press (Machine)": {
    "primary": "chest",
    "secondary": [
      "shoulders",
      "triceps"
    ]
  },
  "EZ Bar Biceps Curl": {
    "primary": "biceps",
    "secondary": []
  },
  "Lateral Raise (Dumbbell)": {
    "primary": "shoulders",
    "secondary": []
  },
  "Seated Calf Raise": {
    "primary": "calves",
    "secondary": []
  },
  "Plank": {
    "primary": "abdominals",
    "secondary": []
  },
  "Squat (Barbell)": {
    "primary": "quadriceps",
    "secondary": [
      "hamstrings",
      "glutes"
    ]
  },
  "Incline Bench Press (Dumbbell)": {
    "primary": "chest",
    "secondary": [
      "triceps",
      "shoulders"
    ]
  },
  "Lying Leg Curl (Machine)": {
    "primary": "hamstrings",
    "secondary": [
      "calves"
    ]
  },
  "Lat Pulldown (Cable)": {
    "primary": "lats",
    "secondary": [
      "upper_back",
      "biceps",
      "forearms"
    ]
  },
  "Triceps Rope Pushdown": {
    "primary": "triceps",
    "secondary": []
  },
  "Crunch (Machine)": {
    "primary": "abdominals",
    "secondary": []
  },
  "Back Extension (Weighted Hyperextension)": {
    "primary": "lower_back",
    "secondary": [
      "hamstrings",
      "glutes"
    ]
  },
  "Shrug (Barbell)": {
    "primary": "traps",
    "secondary": [
      "neck"
    ]
  },
  "Preacher Curl (Dumbbell)": {
    "primary": "biceps",
    "secondary": []
  },
  "Back Extension (Machine)": {
    "primary": "lower_back",
    "secondary": []
  },
  "Lunge (Dumbbell)": {
    "primary": "quadriceps",
    "secondary": [
      "hamstrings",
      "glutes"
    ]
  },
  "Skullcrusher (Barbell)": {
    "primary": "triceps",
    "secondary": []
  },
  "Chest Dip": {
    "primary": "chest",
    "secondary": [
      "shoulders",
      "triceps"
    ]
  },
  "Seated Cable Row - V Grip (Cable)": {
    "primary": "upper_back",
    "secondary": [
      "lats",
      "biceps",
      "forearms"
    ]
  },
  "Overhead Curl (Cable)": {
    "primary": "biceps",
    "secondary": []
  },
  "Pull Up": {
    "primary": "lats",
    "secondary": [
      "upper_back",
      "biceps",
      "forearms"
    ]
  },
  "Chest Supported Reverse Fly (Dumbbell)": {
    "primary": "shoulders",
    "secondary": [
      "upper_back"
    ]
  },
  "Bench Press (Barbell)": {
    "primary": "chest",
    "secondary": [
      "triceps",
      "shoulders"
    ]
  },
  "Seated Dip Machine": {
    "primary": "triceps",
    "secondary": [
      "chest",
      "shoulders"
    ]
  },
  "Deadlift (Barbell)": {
    "primary": "glutes",
    "secondary": [
      "hamstrings",
      "quadriceps",
      "lower_back",
      "upper_back",
      "lats",
      "traps"
    ]
  },
  "Pull Up (Weighted)": {
    "primary": "lats",
    "secondary": [
      "upper_back",
      "biceps",
      "forearms"
    ]
  },
  "Rear Delt Reverse Fly (Machine)": {
    "primary": "shoulders",
    "secondary": [
      "upper_back"
    ]
  },
  "Romanian Deadlift (Barbell)": {
    "primary": "hamstrings",
    "secondary": [
      "glutes",
      "lower_back",
      "upper_back",
      "lats"
    ]
  },
  "Iso-Lateral Low Row": {
    "primary": "upper_back",
    "secondary": [
      "lats",
      "biceps",
      "forearms"
    ]
  },
  "Seated Leg Curl (Machine)": {
    "primary": "hamstrings",
    "secondary": [
      "calves"
    ]
  },
  "Calf Extension (Machine)": {
    "primary": "calves",
    "secondary": []
  },
  "Front Squat": {
    "primary": "quadriceps",
    "secondary": [
      "hamstrings",
      "glutes"
    ]
  },
  "Chest Supported T Bar Row": {
    "primary": "upper_back",
    "secondary": [
      "lats",
      "biceps",
      "forearms"
    ]
  },
  "Seated Shoulder Press (Machine)": {
    "primary": "shoulders",
    "secondary": [
      "triceps"
    ]
  },
  "Lat Pulldown (Machine)": {
    "primary": "lats",
    "secondary": [
      "upper_back",
      "biceps",
      "forearms"
    ]
  },
  "Single Arm Triceps Pushdown (Cable)": {
    "primary": "triceps",
    "secondary": []
  },
  "Preacher Curl (Machine)": {
    "primary": "biceps",
    "secondary": []
  },
  "Skiing": {
    "primary": "cardio",
    "secondary": []
  },
  "Elliptical Trainer": {
    "primary": "cardio",
    "secondary": []
  },
  "Concentration Curl": {
    "primary": "biceps",
    "secondary": []
  },
  "Triceps Dip": {
    "primary": "triceps",
    "secondary": [
      "chest",
      "shoulders"
    ]
  },
  "Dead Hang": {
    "primary": "upper_back",
    "secondary": [
      "lats",
      "forearms"
    ]
  },
  "Triceps Pushdown": {
    "primary": "triceps",
    "secondary": []
  },
  "Жим штанги лежачи": {
    "primary": "chest",
    "secondary": [
      "triceps",
      "shoulders"
    ]
  },
  "Присідання зі штангою": {
    "primary": "quadriceps",
    "secondary": [
      "hamstrings",
      "glutes"
    ]
  },
  "Станова тяга": {
    "primary": "glutes",
    "secondary": [
      "hamstrings",
      "quadriceps",
      "lower_back",
      "upper_back",
      "lats",
      "traps"
    ]
  },
  "Жим гантелей на похилій лаві": {
    "primary": "chest",
    "secondary": [
      "triceps",
      "shoulders"
    ]
  },
  "Тяга верхнього блока": {
    "primary": "lats",
    "secondary": [
      "upper_back",
      "biceps",
      "forearms"
    ]
  },
  "Тяга горизонтального блока": {
    "primary": "upper_back",
    "secondary": [
      "lats",
      "biceps",
      "forearms"
    ]
  },
  "Жим гантелей сидячи": {
    "primary": "shoulders",
    "secondary": [
      "triceps"
    ]
  },
  "Підтягування": {
    "primary": "lats",
    "secondary": [
      "upper_back",
      "biceps",
      "forearms"
    ]
  },
  "Віджимання на брусах": {
    "primary": "triceps",
    "secondary": [
      "chest",
      "shoulders"
    ]
  },
  "Згинання рук із гантелями": {
    "primary": "biceps",
    "secondary": []
  },
  "Розгинання рук на блоці": {
    "primary": "triceps",
    "secondary": []
  },
  "Жим ногами": {
    "primary": "quadriceps",
    "secondary": [
      "glutes",
      "hamstrings"
    ]
  },
  "Згинання ніг у тренажері": {
    "primary": "hamstrings",
    "secondary": [
      "calves"
    ]
  },
  "Розгинання ніг у тренажері": {
    "primary": "quadriceps",
    "secondary": []
  },
  "Підйоми гантелей у сторони": {
    "primary": "shoulders",
    "secondary": []
  },
  "Підйоми на носки": {
    "primary": "calves",
    "secondary": []
  }
});

const muscleGroupOrder = ['chest', 'lats', 'upper_back', 'traps', 'lower_back', 'shoulders', 'biceps', 'triceps', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals', 'forearms', 'neck', 'abductors', 'adductors', 'full_body', 'cardio', 'other', 'unknown'];

function muscleLabel(key) {
  if (key === 'unknown') return 'Без визначеної групи';
  return Object.prototype.hasOwnProperty.call(musclesUk, key) ? musclesUk[key] : 'Інші м’язи';
}

function exerciseMuscles(exercise) {
  const name = typeof exercise === 'string' ? exercise : exercise.name;
  const stored = db.exerciseCatalog?.find(item => item.name === name);
  const record = typeof exercise === 'string' ? stored : { ...stored, ...exercise };
  const reference = Object.prototype.hasOwnProperty.call(hevyMuscleReference, name) ? hevyMuscleReference[name] : null;
  const primary = record?.primary_muscle_group || reference?.primary || 'unknown';
  const source = Array.isArray(record?.secondary_muscle_groups) ? record.secondary_muscle_groups : primary === reference?.primary ? reference.secondary : [];
  const secondary = [...new Set(source.filter(key => typeof key === 'string' && key !== primary && Object.prototype.hasOwnProperty.call(musclesUk, key)))];
  return { primary, secondary };
}

function muscleDetailsHTML(exercise) {
  const info = exerciseMuscles(exercise);
  const secondary = info.secondary.length ? info.secondary.map(muscleLabel).join(', ') : 'Не зазначено';
  return `<span class="muscle-details"><span><span class="muscle-field">Головні:</span> ${esc(muscleLabel(info.primary))}</span><span><span class="muscle-field">Другорядні:</span> ${esc(secondary)}</span></span>`;
}

function exerciseMuscleSearchText(exercise) {
  const info = exerciseMuscles(exercise);
  return [exerciseLabel(typeof exercise === 'string' ? exercise : exercise.name), muscleLabel(info.primary), ...info.secondary.map(muscleLabel)].join(' ').toLocaleLowerCase('uk-UA');
}

function groupExercisesByPrimary(exercises) {
  const groups = new Map();
  exercises.forEach(exercise => {
    const key = exerciseMuscles(exercise).primary;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(exercise);
  });
  const rank = key => { const index = muscleGroupOrder.indexOf(key); return index === -1 ? muscleGroupOrder.length : index; };
  return [...groups].sort(([a], [b]) => rank(a) - rank(b)).map(([key, items]) => ({ key, title: muscleLabel(key), items }));
}

function exerciseCountLabel(count) {
  const last = count % 10, lastTwo = count % 100;
  const word = lastTwo >= 11 && lastTwo <= 14 ? 'вправ' : last === 1 ? 'вправа' : last >= 2 && last <= 4 ? 'вправи' : 'вправ';
  return `${count} ${word}`;
}

function muscleGroupHeading(group) {
  return `<h3 class="muscle-group-title">${esc(group.title)} <span class="muscle-group-count">${exerciseCountLabel(group.items.length)}</span></h3>`;
}

const expandedMuscleGroups = new Map();

function rememberMuscleGroup(element) {
  if (element.dataset.forcedOpen === 'true') return;
  expandedMuscleGroups.set(element.dataset.groupScope + ':' + element.dataset.muscleKey, element.open);
}

function muscleGroupHTML(group, content, scope, forceOpen = false) {
  const open = forceOpen || expandedMuscleGroups.get(scope + ':' + group.key) === true;
  return `<details class="muscle-group muscle-fold" data-group-scope="${esc(scope)}" data-muscle-key="${esc(group.key)}" data-forced-open="${forceOpen}" ontoggle="rememberMuscleGroup(this)" ${open ? 'open' : ''}>
    <summary class="muscle-fold-heading">
      <span class="muscle-illustration">${muscleDiagramSVG(group.key)}</span>
      <span class="muscle-fold-caption"><span class="muscle-fold-title">${esc(group.title)}</span><span class="muscle-group-count">${exerciseCountLabel(group.items.length)}</span><span class="muscle-fold-hint"><span class="when-closed">Показати вправи</span><span class="when-open">Згорнути вправи</span></span></span>
      <span class="muscle-fold-arrow" aria-hidden="true">⌄</span>
    </summary>
    <div class="muscle-fold-content">${content}</div>
  </details>`;
}

function enrichExerciseMuscles(state) {
  let changed = false;
  for (const exercise of state.exerciseCatalog || []) {
    if (!Object.prototype.hasOwnProperty.call(hevyMuscleReference, exercise.name)) continue;
    const reference = hevyMuscleReference[exercise.name];
    if (!exercise.primary_muscle_group) { exercise.primary_muscle_group = reference.primary; changed = true; }
    if (!Array.isArray(exercise.secondary_muscle_groups) && exercise.primary_muscle_group === reference.primary) {
      exercise.secondary_muscle_groups = [...reference.secondary];
      changed = true;
    }
  }
  return changed;
}
