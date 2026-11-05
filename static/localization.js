'use strict';

// Display labels only: original names remain stable for history and Hevy import.
const exerciseTranslations = Object.freeze({
  'Warm Up': 'Розминка',
  'Shoulder Press (Dumbbell)': 'Жим гантелей над головою',
  'Shrug (Dumbbell)': 'Шраги з гантелями',
  'Leg Extension (Machine)': 'Розгинання ніг у тренажері',
  'Cable Fly Crossovers': 'Зведення рук у кросовері',
  'Face Pull': 'Тяга каната до обличчя',
  'Bent Over Row (Barbell)': 'Тяга штанги в нахилі',
  'Leg Press (Machine)': 'Жим ногами в тренажері',
  'Chest Press (Machine)': 'Жим від грудей у тренажері',
  'EZ Bar Biceps Curl': 'Згинання рук з EZ-штангою',
  'Lateral Raise (Dumbbell)': 'Підйоми гантелей через сторони',
  'Seated Calf Raise': 'Підйоми на носки сидячи',
  'Plank': 'Планка',
  'Squat (Barbell)': 'Присідання зі штангою',
  'Incline Bench Press (Dumbbell)': 'Жим гантелей на похилій лаві',
  'Lying Leg Curl (Machine)': 'Згинання ніг лежачи в тренажері',
  'Lat Pulldown (Cable)': 'Тяга верхнього блока до грудей',
  'Triceps Rope Pushdown': 'Розгинання рук з канатом на верхньому блоці',
  'Crunch (Machine)': 'Скручування в тренажері',
  'Back Extension (Weighted Hyperextension)': 'Гіперекстензія з додатковою вагою',
  'Shrug (Barbell)': 'Шраги зі штангою',
  'Preacher Curl (Dumbbell)': 'Згинання рук з гантелями на лаві Скотта',
  'Back Extension (Machine)': 'Розгинання спини в тренажері',
  'Lunge (Dumbbell)': 'Випади з гантелями',
  'Skullcrusher (Barbell)': 'Французький жим зі штангою лежачи',
  'Chest Dip': 'Віджимання на брусах з акцентом на груди',
  'Seated Cable Row - V Grip (Cable)': 'Тяга нижнього блока сидячи з V-подібною рукояткою',
  'Overhead Curl (Cable)': 'Згинання рук на біцепс на верхніх блоках',
  'Pull Up': 'Підтягування',
  'Chest Supported Reverse Fly (Dumbbell)': 'Розведення гантелей з опорою грудьми на лаву',
  'Bench Press (Barbell)': 'Жим штанги лежачи',
  'Seated Dip Machine': 'Віджимання сидячи в тренажері',
  'Deadlift (Barbell)': 'Станова тяга зі штангою',
  'Pull Up (Weighted)': 'Підтягування з додатковою вагою',
  'Rear Delt Reverse Fly (Machine)': 'Зворотні розведення в тренажері на задні дельти',
  'Romanian Deadlift (Barbell)': 'Румунська тяга зі штангою',
  'Iso-Lateral Low Row': 'Низька тяга в тренажері з незалежними важелями',
  'Seated Leg Curl (Machine)': 'Згинання ніг сидячи в тренажері',
  'Calf Extension (Machine)': 'Розгинання стоп у тренажері на литки',
  'Front Squat': 'Фронтальні присідання зі штангою',
  'Chest Supported T Bar Row': 'Тяга Т-грифа з опорою грудьми',
  'Seated Shoulder Press (Machine)': 'Жим над головою сидячи в тренажері',
  'Lat Pulldown (Machine)': 'Вертикальна тяга в тренажері',
  'Single Arm Triceps Pushdown (Cable)': 'Розгинання руки на трицепс на верхньому блоці',
  'Preacher Curl (Machine)': 'Згинання рук на біцепс у тренажері з упором ліктів',
  'Skiing': 'Катання на лижах',
  'Elliptical Trainer': 'Еліптичний тренажер',
  'Concentration Curl': 'Концентроване згинання руки на біцепс',
  'Triceps Dip': 'Віджимання на брусах з акцентом на трицепс',
  'Dead Hang': 'Вис на перекладині',
  'Triceps Pushdown': 'Розгинання рук на трицепс на верхньому блоці'
});

function exerciseLabel(name) {
  const ukrainian = Object.prototype.hasOwnProperty.call(exerciseTranslations, name) ? exerciseTranslations[name] : '';
  return ukrainian ? `${name} — ${ukrainian}` : name;
}

function exerciseNameHTML(name) {
  const ukrainian = Object.prototype.hasOwnProperty.call(exerciseTranslations, name) ? exerciseTranslations[name] : '';
  return esc(name) + (ukrainian ? ` <span class="exercise-translation" lang="uk">— ${esc(ukrainian)}</span>` : '');
}

function exerciseSearchText(name) {
  return exerciseLabel(name).normalize('NFKC').toLocaleLowerCase('uk-UA');
}

function pounds(kg) { return Number(kg) / 0.45359237; }
function poundsText(kg) { return `${decimal(pounds(kg))} lb`; }
function weightText(kg) { return `${decimal(kg)} кг (${poundsText(kg)})`; }
function weightHTML(kg, total = false) {
  return `<span class="weight-value"><span class="weight-kg">${total ? fmt(kg) : decimal(kg)} кг</span> <span class="weight-lb" title="Еквівалент у фунтах">(${poundsText(kg)})</span></span>`;
}

function refreshPounds(input) {
  const hint = input.closest?.('.stepper-field')?.querySelector('.weight-lb') || input.parentElement?.querySelector('.weight-lb');
  if (hint) hint.textContent = poundsText(input.value);
}
