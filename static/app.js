'use strict';
const KEY='forma.server.cache.v1';
const catalog=['Жим штанги лежачи','Присідання зі штангою','Станова тяга','Жим гантелей на похилій лаві','Тяга верхнього блока','Тяга горизонтального блока','Жим гантелей сидячи','Підтягування','Віджимання на брусах','Згинання рук із гантелями','Розгинання рук на блоці','Жим ногами','Згинання ніг у тренажері','Розгинання ніг у тренажері','Підйоми гантелей у сторони','Підйоми на носки'];
const uid=()=>crypto.randomUUID();
let db={workouts:[],routines:[],active:null,custom:[]},tab='today',storageOK=true;

function validExercise(e){return e&&typeof e.name==='string'&&e.name.length<=100&&Array.isArray(e.sets)&&e.sets.length<=200&&e.sets.every(s=>s&&typeof s.id==='string'&&typeof s.done==='boolean'&&Number.isFinite(Number(s.kg))&&Number(s.kg)>=0&&Number(s.kg)<=2000&&Number.isInteger(Number(s.reps))&&Number(s.reps)>=0&&Number(s.reps)<=10000)}
function validWorkout(w){return w&&typeof w.id==='string'&&/^[a-zA-Z0-9-]{1,80}$/.test(w.id)&&typeof w.name==='string'&&w.name.length<=100&&Number.isFinite(w.started)&&Array.isArray(w.exercises)&&w.exercises.length<=100&&w.exercises.every(validExercise)}
function validDB(d){return d&&Array.isArray(d.workouts)&&d.workouts.every(w=>validWorkout(w)&&Number.isFinite(w.finished))&&Array.isArray(d.routines)&&d.routines.every(validWorkout)&&Array.isArray(d.custom)&&d.custom.every(x=>typeof x==='string'&&x.length<=100)&&(!d.active||validWorkout(d.active))}
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=n=>new Date(n).toLocaleDateString('uk-UA',{day:'numeric',month:'long'});
const completed=w=>w.exercises.reduce((n,e)=>n+e.sets.filter(s=>s.done).length,0);
const volume=w=>w.exercises.reduce((n,e)=>n+e.sets.reduce((v,s)=>v+(s.done?Number(s.kg)*Number(s.reps):0),0),0);
const fmt=n=>Number(n).toLocaleString('uk-UA',{maximumFractionDigits:1});
const decimal=n=>Number(n).toLocaleString('uk-UA',{minimumFractionDigits:1,maximumFractionDigits:1});
const rounded=n=>Math.round((Number(n)+Number.EPSILON)*10)/10;
function save(){try{localStorage.setItem(KEY,JSON.stringify(db));formaSync.save(db);storageOK=true;return true}catch(e){storageOK=false;toast('Не вдалося зберегти дані. Завантажте резервну копію у вкладці «Дані».');return false}}
function toast(s){const n=document.getElementById('notice');n.textContent=s;n.hidden=false;clearTimeout(window.toastTimeout);window.toastTimeout=setTimeout(()=>n.hidden=true,4500)}
function go(t){const changed=tab!==t;tab=t;render();if(changed)animateView()}
function render(){document.getElementById('nav').innerHTML=[['today','Тренування'],['catalogue','Мої вправи'],['routines','Програми'],['history','Історія'],['progress','Прогрес'],['data','Дані']].map(([id,name])=>`<button class="${tab===id?'active':''}" onclick="go('${id}')" ${tab===id?'aria-current="page"':''}>${name}</button>`).join('');document.getElementById('view').innerHTML=({today:today,catalogue:catalogueView,routines:routines,history:history,progress:progressView,data:dataView})[tab]();tick()}
function today(){if(db.active)return activeView();return `<div class="hero"><div><div class="eyebrow">${esc(new Date().toLocaleDateString('uk-UA',{weekday:'long',day:'numeric',month:'long'}))}</div><h1>Час стати сильнішим.</h1><p>Кожен підхід — ще один крок уперед.</p></div><button class="primary" onclick="start()">＋ Почати тренування</button></div><div class="cards stats"><div class="card"><div class="muted">Тренувань</div><div class="big">${db.workouts.length}</div></div><div class="card"><div class="muted">Підходів</div><div class="big">${fmt(db.workouts.reduce((n,w)=>n+completed(w),0))}</div></div><div class="card"><div class="muted">Обсяг, кг</div><div class="big">${fmt(db.workouts.reduce((n,w)=>n+volume(w),0))}</div><div class="weight-lb">${poundsText(db.workouts.reduce((n,w)=>n+volume(w),0))}</div></div></div><div style="margin-top:32px" class="row"><h2>Мої програми</h2><button class="subtle" onclick="go('routines')">Усі програми ↗</button></div>${db.routines.length?db.routines.slice(0,3).map(routineCard).join(''):`<div class="card empty"><div class="symbol">＋</div><h2>Ваш перший крок</h2><p>Почніть тренування, додайте вправи та збережіть його як програму для наступного разу.</p><button class="dark" onclick="start()">Створити тренування</button></div>`}`}
function start(id){if(db.active){go('today');toast('У вас уже є активне тренування.');return}const routine=db.routines.find(r=>r.id===id);db.active=routine?JSON.parse(JSON.stringify(routine)):{name:'Моє тренування',exercises:[]};Object.assign(db.active,{id:uid(),started:Date.now(),restEnd:null});db.active.exercises.forEach(e=>e.sets.forEach(s=>{s.id=uid();s.done=false}));save();go('today')}
function previous(name){for(const w of [...db.workouts].reverse()){const e=w.exercises.find(e=>e.name===name);if(e&&e.sets.some(s=>s.done))return e.sets.filter(s=>s.done).map(s=>setSummary(s,e)).join(' · ')}return 'Перше тренування з цією вправою'}
function activeView(){const w=db.active;return `<div class="hero"><div><div class="eyebrow">Тренування триває · <span id="elapsed"></span></div><h1>Ваш сьогоднішній максимум.</h1></div><button class="primary" onclick="finish()">Завершити ✓</button></div><div class="card"><label class="label" for="workoutName">Назва тренування</label><input id="workoutName" class="workout-name" maxlength="100" value="${esc(w.name)}" onchange="db.active.name=this.value.trim()||'Моє тренування';save()"><div class="row"><span class="muted">${completed(w)} підходів виконано · ${weightHTML(volume(w),true)}</span><button class="subtle" onclick="saveRoutine()">Зберегти програму</button></div></div>${w.exercises.map((e,i)=>`<section class="card exercise"><div class="exercise-head"><div><strong>${exerciseNameHTML(e.name)}</strong><div class="muted" style="margin-top:6px">Минулого разу: ${esc(previous(e.name))}</div></div><button class="subtle" onclick="removeExercise(${i})" aria-label="Видалити вправу ${esc(e.name)}">✕</button></div><div class="set label"><span>№</span><span style="text-align:center">${setColumnLabels(e)[0]}</span><span style="text-align:center">${setColumnLabels(e)[1]}</span><span>Готово</span><span></span></div>${e.sets.map((s,j)=>renderActiveSet(s,j,i,e)).join('')}<button class="subtle" style="width:100%;margin-top:12px" onclick="addSet(${i})">＋ Додати підхід</button></section>`).join('')}<div class="actions" style="margin:22px 0"><button class="dark" onclick="openPicker()">＋ Додати вправу</button><button class="danger" onclick="cancelWorkout()">Скасувати</button></div><div class="timer"><div><div class="label" style="color:#bfcbb5">Відпочинок</div><strong id="countdown">01:30</strong></div><label class="muted" for="restDuration">Після кожного підходу</label><select id="restDuration" aria-label="Тривалість відпочинку" onchange="db.active.restSeconds=Number(this.value);save()">${[30,60,90,120,180].map(n=>`<option value="${n}" ${(w.restSeconds||90)===n?'selected':''}>${n} с</option>`).join('')}</select><button onclick="db.active.restEnd=db.active.restEnd?null:Date.now()+(db.active.restSeconds||90)*1000;save();tick()" id="timerControl">Старт</button></div>`}
function updateSet(i,j,key,input){const n=Number(input.value);if(input.value===''||!Number.isFinite(n)||n<0||n>(key==='kg'?2000:key==='reps'?10000:10000000)||(key==='reps'&&!Number.isInteger(n))){input.value=db.active.exercises[i].sets[j][key];toast('Введіть коректне додатне число або 0.');return}const value=key==='reps'?n:rounded(n);db.active.exercises[i].sets[j][key]=value;input.value=key==='reps'?String(value):value.toFixed(1);if(key==='kg')refreshPounds(input);save()}
function toggle(i,j){const s=db.active.exercises[i].sets[j];if(!s.done&&s.reps===0&&!s.durationSeconds&&!s.distanceMeters){toast('Вкажіть повторення, тривалість або відстань перед завершенням підходу.');return}s.done=!s.done;if(s.done)db.active.restEnd=Date.now()+(db.active.restSeconds||90)*1000;save();render();if(s.done)animateCompletedSet(s.id)}
function addSet(i){const sets=db.active.exercises[i].sets,last=sets.at(-1);sets.push({...last,id:uid(),kg:last?.kg||0,reps:last?.reps??10,done:false});save();render()}
function removeSet(i,j){db.active.exercises[i].sets.splice(j,1);save();render()}
function removeExercise(i){if(confirm('Видалити вправу та її підходи?')){db.active.exercises.splice(i,1);save();render()}}
function openPicker(){document.getElementById('search').value='';renderChoices();document.getElementById('picker').showModal()}
function renderChoices() {
  const q = document.getElementById('search').value.trim().toLocaleLowerCase('uk-UA');
  window.filtered = [...new Set([...catalog, ...db.custom])].filter(name => exerciseMuscleSearchText(name).includes(q));
  const groups = groupExercisesByPrimary(filtered.map((name, pickerIndex) => ({ name, pickerIndex })));
  document.getElementById('choices').innerHTML = groups.map(group => muscleGroupHTML(group, group.items.map(exercise => `<button class="exercise-choice" onclick="addExercise(filtered[${exercise.pickerIndex}])">${exerciseNameHTML(exercise.name)} <span style="float:right">＋</span>${muscleDetailsHTML(exercise)}</button>`).join(''), 'picker', Boolean(q))).join('') || '<p>Не знайдено. Додайте свою вправу нижче.</p>';
}
function addExercise(name){if(!db.active)return;const last=[...db.workouts].reverse().flatMap(w=>w.exercises).find(e=>e.name===name);db.active.exercises.push({name,trackingType:last?.trackingType||db.exerciseCatalog?.find(e=>e.name===name)?.type||'weight_reps',sets:last?last.sets.filter(s=>s.done).map(s=>({...s,id:uid(),done:false})):Array.from({length:3},()=>({id:uid(),kg:0,reps:10,done:false}))});save();document.getElementById('picker').close();render()}
function addCustom(){const input=document.getElementById('custom'),n=input.value.trim();if(!n)return;db.custom.push(n);input.value='';addExercise(n)}
function finish(){if(!completed(db.active)){toast('Виконайте хоча б один підхід, щоб зберегти тренування.');return}if(!confirm('Завершити тренування та зберегти результат в історію?'))return;const w=JSON.parse(JSON.stringify(db.active));w.finished=Date.now();w.restEnd=null;db.workouts.push(w);db.active=null;save();go('history');toast('Тренування збережено. Гарна робота!')}
function cancelWorkout(){if(confirm('Скасувати поточне тренування? Його підходи не потраплять в історію.')){db.active=null;save();render()}}
function saveRoutine(){if(!db.active.exercises.length){toast('Спочатку додайте хоча б одну вправу.');return}const name=prompt('Назва програми',db.active.name);if(!name?.trim())return;const r=JSON.parse(JSON.stringify(db.active));Object.assign(r,{id:uid(),name:name.trim().slice(0,100),restEnd:null});r.exercises.forEach(e=>e.sets.forEach(s=>s.done=false));db.routines.push(r);save();toast('Програму збережено')}
function routineCard(r){return `<div class="card"><div class="row"><div><span class="tag">${r.exercises.length} вправ</span><h2 style="margin-top:13px">${esc(r.name)}</h2><p class="small">${r.exercises.map(e=>exerciseNameHTML(e.name)).join(' · ')}</p></div><button class="subtle" onclick="deleteRoutine('${r.id}')" aria-label="Видалити програму">✕</button></div><button class="primary" onclick="start('${r.id}')">Почати тренування ↗</button></div>`}
function routines(){return `<div class="hero"><div><div class="eyebrow">Ваш план</div><h1>Програми тренувань.</h1><p>Збережені вправи та підходи для наступного візиту в зал.</p></div><button class="primary" onclick="start()">＋ Створити через тренування</button></div>${db.routines.length?db.routines.map(routineCard).join(''):'<div class="card empty"><h2>Поки що тут чистий аркуш</h2><p>Додайте вправи в тренуванні та натисніть «Зберегти програму».</p></div>'}`}
function deleteRoutine(id){if(confirm('Видалити цю програму?')){db.routines=db.routines.filter(r=>r.id!==id);save();render()}}
function history() {
  const workouts = [...db.workouts].reverse();
  const cards = workouts.map(workout => `
    <details class="card history-day" data-workout-id="${esc(workout.id)}">
      <summary class="history-summary">
        <span class="history-summary-copy">
          <span class="history-summary-title"><span class="history-toggle" aria-hidden="true">▸</span><strong>${esc(workout.name)}</strong></span>
          <span class="muted history-summary-stats">${completed(workout)} підходів · ${weightHTML(volume(workout),true)} · ${Math.max(1, Math.round((workout.finished - workout.started) / 60000))} хв</span>
        </span>
        <time class="history-date-group" datetime="${new Date(workout.started).toISOString()}" aria-label="${esc(new Date(workout.started).toLocaleDateString('uk-UA', {day:'numeric',month:'long',year:'numeric'}))}">
          <span class="history-date-part">${String(new Date(workout.started).getDate()).padStart(2, '0')}</span>
          <span class="history-date-part">${String(new Date(workout.started).getMonth() + 1).padStart(2, '0')}</span>
          <span class="history-date-part">${String(new Date(workout.started).getFullYear()).slice(-2)}</span>
        </time>
      </summary>
      <div class="history-day-toolbar"><span class="muted">${workout.exercises.length} вправ у тренуванні</span><button class="danger history-delete-day" onclick="deleteHistoryWorkout('${workout.id}')">Видалити тренування</button></div>
      <div class="history-exercise-grid">
        ${workout.exercises.map((exercise, index) => `
          <div class="history-exercise">
            <div class="history-exercise-heading">
              <strong>${exerciseNameHTML(exercise.name)}</strong>
              <button class="danger history-delete"
                aria-label="Видалити ${esc(exercise.name)} з тренування ${esc(workout.name)}"
                title="Видалити вправу" onclick="deleteHistoryExercise('${workout.id}', ${index})">×</button>
            </div>
            <p class="small">${exercise.sets.filter(set => set.done).map(set => setSummary(set, exercise, true)).join(' · ') || 'Немає виконаних підходів'}</p>
          </div>
        `).join('') || '<p class="muted">У цьому тренуванні немає вправ.</p>'}
      </div>
    </details>
  `).join('');

  return `<div class="eyebrow">Кожне зусилля має значення</div>
    <h1>Ваша історія.</h1>
    <p>Розгорніть тренування, щоб переглянути підходи, видалити вправу або весь день.</p>
    ${cards || `<div class="card empty"><div class="symbol">↗</div>
      <h2>Тут буде ваша історія</h2><p>Завершіть перше тренування, щоб побачити результат.</p>
      <button class="dark" onclick="start()">Почати</button></div>`}`;
}

function deleteHistoryExercise(workoutId, exerciseIndex) {
  const workout = db.workouts.find(item => item.id === workoutId);
  if (!workout || !Number.isInteger(exerciseIndex) || exerciseIndex < 0 || exerciseIndex >= workout.exercises.length) return;
  const exercise = workout.exercises[exerciseIndex];
  const message = `Видалити «${exercise.name}» та всі її підходи з тренування «${workout.name}» за ${date(workout.started)}?`;
  if (!confirm(message)) return;

  workout.exercises.splice(exerciseIndex, 1);
  if (!save()) {
    workout.exercises.splice(exerciseIndex, 0, exercise);
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (_) { /* Existing state remains in memory. */ }
    return;
  }
  render();
  const details = document.querySelector?.(`[data-workout-id="${workout.id}"]`);
  if (details) details.open = true;
  toast('Вправу видалено з цього тренування. Статистику оновлено.');
}

function deleteHistoryWorkout(workoutId) {
  const index = db.workouts.findIndex(item => item.id === workoutId);
  if (index < 0) return;
  const workout = db.workouts[index];
  if (!confirm(`Видалити тренування «${workout.name}» за ${date(workout.started)} повністю, разом з усіма вправами та підходами?`)) return;
  const previousDeleted = db.deletedWorkoutIds;
  db.workouts.splice(index, 1);
  db.deletedWorkoutIds = [...new Set([...(previousDeleted || []), workout.id])];
  if (!save()) {
    db.workouts.splice(index, 0, workout);
    if (previousDeleted === undefined) delete db.deletedWorkoutIds;
    else db.deletedWorkoutIds = previousDeleted;
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (_) { /* State restored in memory. */ }
    return;
  }
  render();
  toast('Тренування видалено з історії. Статистику оновлено.');
}

function progressView() {
  const names = [...new Set(db.workouts.flatMap(workout => workout.exercises.filter(exercise => exercise.sets.some(set => set.done && set.kg > 0)).map(exercise => exercise.name)))];
  const groups = groupExercisesByPrimary(names);
  const records = groups.map(group => muscleGroupHTML(group, group.items.map(name => {
    const best = Math.max(...db.workouts.flatMap(workout => workout.exercises.filter(exercise => exercise.name === name).flatMap(exercise => exercise.sets.filter(set => set.done).map(set => set.kg))));
    return `<div class="row list-item record-row"><span class="record-name">${exerciseNameHTML(name)}${muscleDetailsHTML(name)}</span><strong class="record-values">${weightHTML(best)}</strong></div>`;
  }).join(''), 'progress')).join('');
  return `<div class="eyebrow">Сила в послідовності</div><h1>Особистий прогрес.</h1><p>Максимальна вага у виконаному підході та обсяг останніх тренувань.</p>
    <div class="card"><h2>Ваші рекорди</h2><p class="muscle-source">Натисніть на групу, щоб розгорнути вправи. Кольором на схемі позначено основну ділянку. Схеми умовні; класифікація вправ — за даними Hevy.</p>
      ${records || '<p>Рекорди з’являться після першого завершеного тренування.</p>'}
    </div>
    <div class="card"><h2>Обсяг тренувань</h2><p class="small">Сума ваги × повторення для виконаних підходів; вага тіла не враховується.</p>
      ${db.workouts.slice(-8).map(workout => `<div class="list-item"><div class="row small"><span>${date(workout.started)} · ${esc(workout.name)}</span><strong>${weightHTML(volume(workout), true)}</strong></div><div class="bar" style="margin-top:10px"><i style="width:${volume(workout) / Math.max(1, ...db.workouts.slice(-8).map(volume)) * 100}%"></i></div></div>`).join('') || '<p>Ще немає даних.</p>'}
    </div>`;
}
function dataView(){return `<div class="eyebrow">Ваші дані</div><h1>Усе під контролем.</h1><div class="card"><h2>Дані з Hevy</h2><p>Імпортуйте повний файл forma-personal-data.json: тренування, підходи, програми та каталог вправ. Локальні записи зберігаються, повторний імпорт не створює дублікатів.</p><button class="primary" onclick="document.getElementById('hevyImport').click()">↑ Імпортувати всі дані Hevy</button><input id="hevyImport" type="file" hidden style="display:none" accept=".json,application/json" onchange="importHevy(this.files[0]);this.value='' "></div><div class="card"><h2>Резервна копія</h2><p>Завантажте свої тренування та програми у файл. Його можна імпортувати в цьому прототипі в іншому браузері. Це ручне перенесення даних.</p><div class="actions"><button class="primary" onclick="exportData()">↓ Завантажити копію</button><button onclick="document.getElementById('import').click()">↑ Імпортувати копію</button><input hidden id="import" type="file" accept="application/json,.json" onchange="importData(this.files[0]);this.value=''" style="display:none"></div></div><div class="card"><h2>Статус особистої версії</h2><p>Локальний кеш браузера: <strong>${storageOK?'доступне':'помилка — завантажте копію'}</strong>.<br>Дані зберігаються Python-сервером у SQLite на цьому комп’ютері. Статус збереження показано над меню. Синхронізацію з iPhone ще не підключено.</p></div>`}
function exportData(){const url=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`forma-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function importData(file){if(!file)return;try{if(file.size>10*1024*1024)throw Error();const data=JSON.parse(await file.text());if(data.source==='Hevy'&&Array.isArray(data.workouts)){mergeHevyData(data);render();toast('Усі дані Hevy імпортовано');return}if(!validDB(data))throw Error();if(!confirm('Замінити поточні дані вмістом резервної копії? Перед цим рекомендуємо завантажити поточну копію.'))return;db=data;save();render();toast('Резервну копію імпортовано')}catch(e){toast('Файл не є коректною резервною копією Форма. Дані не змінено.')}}
function tick(){if(!db.active||tab!=='today')return;const elapsed=document.getElementById('elapsed');if(elapsed){const m=Math.floor((Date.now()-db.active.started)/60000);elapsed.textContent=`${Math.max(0,m)} хв`}const counter=document.getElementById('countdown'),control=document.getElementById('timerControl');if(!counter)return;let left=db.active.restEnd?Math.max(0,Math.ceil((db.active.restEnd-Date.now())/1000)):(db.active.restSeconds||90);if(db.active.restEnd&&left===0){db.active.restEnd=null;save();toast('Відпочинок завершено. Час наступного підходу.');if(navigator.vibrate)navigator.vibrate([100,100,100])}counter.textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;control.textContent=db.active.restEnd?'Стоп':'Старт'}

function catalogueView(){return `<div class="eyebrow">Особиста бібліотека</div><h1>Мої вправи.</h1><p>Повний файл forma-personal-data.json додає вправи, історію тренувань і програми з Hevy. Ваші локальні записи зберігаються.</p><div class="actions" style="margin-bottom:22px"><button class="primary" onclick="document.getElementById('catalogueImport').click()">↑ Імпортувати Hevy</button><button onclick="createCatalogueExercise()">＋ Своя вправа</button><input id="catalogueImport" type="file" hidden style="display:none" accept=".json,application/json" onchange="importCatalogue(this.files[0]);this.value='' "></div><div class="card"><label for="catalogueSearch">Пошук за назвою, м’язами або обладнанням</label><input id="catalogueSearch" style="width:100%;margin:12px 0" placeholder="Назва вправи…" oninput="renderCatalogueRows(this.value)"><div id="catalogueRows">${catalogueRows('')}</div></div>`}
const musclesUk={chest:'Груди',shoulders:'Плечі',biceps:'Біцепс',triceps:'Трицепс',quadriceps:'Квадрицепс',hamstrings:'Задня поверхня стегна',calves:'Литки',glutes:'Сідниці',lats:'Найширші м’язи',upper_back:'Верх спини',lower_back:'Поперек',traps:'Трапеції',abdominals:'Прес',cardio:'Кардіо',full_body:'Усе тіло',forearms:'Передпліччя',other:'Інше',neck:'Шия',abductors:'Відвідні м’язи стегна',adductors:'Привідні м’язи стегна'};
const equipmentUk={barbell:'Штанга',dumbbell:'Гантелі',machine:'Тренажер',none:'Без обладнання',other:'Інше',kettlebell:'Гиря',plate:'Диск',resistance_band:'Еспандер',suspension:'Петлі'};
function catalogueRows(query) {
  const records = db.exerciseCatalog || [], byName = new Set(records.map(exercise => exercise.name));
  const all = [...records, ...db.custom.filter(name => !byName.has(name)).map(name => ({ name }))];
  const q = query.trim().toLocaleLowerCase('uk-UA');
  const filtered = all.filter(exercise => [exerciseMuscleSearchText(exercise), equipmentUk[exercise.equipment] || exercise.equipment || ''].join(' ').toLocaleLowerCase('uk-UA').includes(q));
  const groups = groupExercisesByPrimary(filtered);
  return `<div class="muted">${filtered.length} із ${all.length} вправ · натисніть на групу, щоб розгорнути</div>` + groups.map(group => muscleGroupHTML(group, group.items.map(exercise => `<div class="list-item"><strong>${exerciseNameHTML(exercise.name)}</strong>${muscleDetailsHTML(exercise)}<div class="muted" style="margin-top:4px">${esc(equipmentUk[exercise.equipment] || exercise.equipment || 'Обладнання не зазначено')}</div></div>`).join(''), 'catalogue', Boolean(q))).join('') + (!all.length ? '<p>Додайте власну вправу або імпортуйте особистий каталог.</p>' : !filtered.length ? '<p>За цим запитом вправ не знайдено.</p>' : '');
}
function renderCatalogueRows(q){document.getElementById('catalogueRows').innerHTML=catalogueRows(q)}
function createCatalogueExercise(){const name=prompt('Назва вашої вправи');if(!name?.trim())return;const n=name.trim().slice(0,100);if(!db.custom.includes(n))db.custom.push(n);save();render()}
async function importCatalogue(file){if(!file)return;try{if(file.size>10*1024*1024)throw Error();const data=JSON.parse(await file.text());if(!Array.isArray(data.exercises)||data.exercises.length>5000)throw Error();if(data.source==='Hevy'&&Array.isArray(data.workouts)){const result=mergeHevyData(data);render();toast('Hevy: '+result.workouts+' тренувань і '+result.routines+' програм імпортовано');return}const records=data.exercises.map(e=>{if(!e||typeof e.id!=='string'||typeof e.name!=='string'||!e.name.trim()||e.name.length>100)throw Error();return {id:e.id.slice(0,100),name:e.name,secondary_muscle_groups:Array.isArray(e.secondary_muscle_groups)?e.secondary_muscle_groups.filter(value=>typeof value==='string').slice(0,30):undefined,primary_muscle_group:typeof e.primary_muscle_group==='string'?e.primary_muscle_group.slice(0,80):'',equipment:typeof e.equipment==='string'?e.equipment.slice(0,80):'',type:typeof e.type==='string'?e.type.slice(0,80):''}});const merged=new Map((db.exerciseCatalog||[]).map(e=>[e.id,e]));records.forEach(e=>merged.set(e.id,e));db.exerciseCatalog=[...merged.values()];db.custom=[...new Set([...db.custom,...records.map(e=>e.name)])];save();render();toast('Каталог імпортовано: '+records.length+' вправ. Тренування не змінено.')}catch(e){toast('Некоректний файл каталогу. Дані не змінено.')}}

function hevyNumber(value, fallback=0){if(value===null||value===undefined)return fallback;if(typeof value!=='number'||!Number.isFinite(value)||value<0)throw Error('Некоректне числове значення');return value}
function convertHevySnapshot(data){
 if(!data||!Array.isArray(data.workouts)||!Array.isArray(data.routines)||!Array.isArray(data.exercises))throw Error('Потрібен повний файл Hevy');
 const templates=new Map(data.exercises.map(e=>[e.id,e]));
 const text=value=>{if(typeof value!=='string'||!value.trim()||value.length>100)throw Error('Некоректна назва');return value};
 const id=value=>{if(typeof value!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(value))throw Error('Некоректний ідентифікатор');return value};
 const convert=(source,routine)=>{
  if(!Array.isArray(source.exercises)||source.exercises.length>100)throw Error('Некоректні вправи');
  const started=routine?Date.parse(source.created_at):Date.parse(source.start_time),finished=routine?null:Date.parse(source.end_time);
  if(!Number.isFinite(started)||(!routine&&(!Number.isFinite(finished)||finished<started)))throw Error('Некоректна дата');
  return {id:id(source.id),name:text(source.title),started,...(!routine?{finished}:{}),source:'Hevy',notes:source.description||'',exercises:source.exercises.map(e=>{
   if(!Array.isArray(e.sets)||e.sets.length>200)throw Error('Некоректні підходи');
   return {name:text(e.title),exerciseId:id(e.exercise_template_id),trackingType:templates.get(e.exercise_template_id)?.type||'weight_reps',notes:e.notes||'',restSeconds:e.rest_seconds??90,sets:e.sets.map((s,j)=>({id:source.id+'-'+e.index+'-'+j,kg:hevyNumber(s.weight_kg),reps:hevyNumber(s.reps,routine?hevyNumber(s.rep_range?.start):0),durationSeconds:hevyNumber(s.duration_seconds),distanceMeters:hevyNumber(s.distance_meters),repRange:s.rep_range||null,setType:s.type||'normal',rpe:s.rpe??null,done:!routine}))};
  })};
 };
 const workouts=data.workouts.map(w=>convert(w,false)),routines=data.routines.map(w=>convert(w,true));
 const result={workouts,routines,active:null,custom:[],exerciseCatalog:data.exercises.map(e=>({id:id(e.id),name:text(e.name||e.title),secondary_muscle_groups:Array.isArray(e.secondary_muscle_groups)?e.secondary_muscle_groups.filter(value=>typeof value==='string').slice(0,30):undefined,primary_muscle_group:typeof e.primary_muscle_group==='string'?e.primary_muscle_group:'',equipment:typeof e.equipment==='string'?e.equipment:'',type:typeof e.type==='string'?e.type:''}))};
 if(!validDB(result))throw Error('Дані поза допустимими межами');return result;
}
function mergeHevyData(data){
 const incoming=convertHevySnapshot(data);
 const merge=(current,added)=>[...new Map([...added,...current].map(x=>[x.id,x])).values()];
 const next={...db,workouts:merge(db.workouts,incoming.workouts).filter(workout=>!(db.deletedWorkoutIds||[]).includes(workout.id)).sort((a,b)=>a.started-b.started),routines:merge(db.routines,incoming.routines),exerciseCatalog:merge(db.exerciseCatalog||[],incoming.exerciseCatalog),custom:[...new Set([...db.custom,...incoming.exerciseCatalog.map(e=>e.name)])]};
 // Commit only after validation and successful persistence; preserve current data on failure.
 localStorage.setItem(KEY,JSON.stringify(next));formaSync.save(next);db=next;storageOK=true;
 return {workouts:incoming.workouts.length,routines:incoming.routines.length};
}
async function importHevy(file){if(!file)return;try{if(file.size>10*1024*1024)throw Error();const result=mergeHevyData(JSON.parse(await file.text()));render();toast(`Hevy: ${result.workouts} тренувань і ${result.routines} програм імпортовано.`)}catch(e){toast('Не вдалося імпортувати Hevy. Перевірте файл і доступність збереження. Поточні дані не змінено.')}}
function setSummary(s,e,html=false){const type=e.trackingType||'weight_reps',parts=[],weight=html?weightHTML:weightText;if(s.durationSeconds)parts.push(`${fmt(s.durationSeconds)} с`);if(s.distanceMeters)parts.push(`${fmt(s.distanceMeters)} м`);if(s.reps)parts.push((['reps_only','bodyweight_weighted','bodyweight_assisted','bodyweight_reps','bodyweight_assisted_reps'].includes(type)&&!s.kg)?`${s.reps} повторень`:`${weight(s.kg)} × ${s.reps}`);else if(s.kg)parts.push(weight(s.kg));return parts.join(' · ')||'Виконано'}
function renderActiveSet(s,j,i,e){
 const type=e.trackingType||'weight_reps',timed=['duration','weight_duration','distance_duration'].includes(type),distance=['distance_duration','short_distance_weight'].includes(type);
 const firstKey=type==='duration'?'durationSeconds':type==='distance_duration'?'distanceMeters':'kg';
 const secondKey=type==='duration'?null:timed?'durationSeconds':distance?'distanceMeters':'reps';
 const labels={kg:'Вага, кг',reps:'Повторення',durationSeconds:'Тривалість, с',distanceMeters:'Відстань, м'};
 const input=key=>{
  if(!key)return '<span></span>';
  const field=`<input type="number" inputmode="decimal" min="0" step="${key==='reps'?'1':'0.1'}" aria-label="${labels[key]}, підхід ${j+1}" value="${key==='reps'?(s[key]||0):Number(s[key]||0).toFixed(1)}" onchange="updateSet(${i},${j},'${key}',this)">`;
  return key==='kg'?`<label class="weight-input">${field}<span class="weight-lb" title="Еквівалент у фунтах">${poundsText(s.kg||0)}</span></label>`:field;
 };
 return `<div id="set-${esc(s.id)}" class="set ${s.done?'done':''}"><span class="muted">${j+1}</span>${input(firstKey)}${input(secondKey)}<button class="check" aria-label="Позначити підхід ${j+1}" aria-pressed="${s.done}" onclick="toggle(${i},${j})">${s.done?'✓':'○'}</button><button class="subtle" style="padding:4px" onclick="removeSet(${i},${j})" aria-label="Видалити підхід ${j+1}">×</button></div>`;
}
function setColumnLabels(e){const t=e.trackingType||'weight_reps';return t==='duration'?['Секунди','']:t==='distance_duration'?['Метри','Секунди']:t==='weight_duration'?['Кг','Секунди']:t==='short_distance_weight'?['Кг','Метри']:['Кг','Повтори']}
function applyPersonalSeed(){const element=document.getElementById('hevyPersonalSeed');if(!element?.textContent)return;try{const data=JSON.parse(element.textContent),version=data.exported_at;if(db.hevySeedVersion===version)return;mergeHevyData(data);db.hevySeedVersion=version;save()}catch(e){toast('Автоматичний імпорт Hevy не завершено. Спробуйте імпорт у вкладці «Дані».')}}

window.formaReady = (async () => {
  try {
    const state = await formaSync.load();
    if (!validDB(state)) throw Error('Некоректні дані на сервері');
    db = state;
    if (enrichExerciseMuscles(db)) save();
    render();
    setInterval(tick, 1000);
  } catch (error) {
    document.getElementById('view').innerHTML = '<div class="card"><h2>Не вдалося відкрити базу</h2><p>Перевірте, чи працює Python-сервер, та оновіть сторінку.</p></div>';
  }
})();
