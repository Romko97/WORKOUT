'use strict';

let selectedProgressExercise=null,progressExerciseTab='stats';
const progressSections=new Map();
function progressExerciseNames(){return [...new Set([...(db.exerciseCatalog||[]).map(e=>e.name),...db.custom,...db.workouts.flatMap(w=>w.exercises.map(e=>e.name))])];}
function exerciseTimeline(name){
  return [...db.workouts].sort((a,b)=>a.started-b.started||a.id.localeCompare(b.id)).flatMap(workout=>{
    const sets=workout.exercises.filter(e=>e.name===name).flatMap(e=>e.sets).filter(s=>s.done);
    if(!sets.length)return [];
    const weights=sets.map(s=>Number(s.kg)).filter(n=>Number.isFinite(n)&&n>0);
    const reps=sets.map(s=>Number(s.reps)).filter(n=>Number.isFinite(n)&&n>0);
    return [{workout,sets,kg:weights.length?Math.max(...weights):null,reps:reps.length?Math.max(...reps):null}];
  });
}
function progressDate(timestamp){return new Date(timestamp).toLocaleDateString('uk-UA',{day:'numeric',month:'short',year:'numeric'});}
function progressSetCount(count){const last=count%10,lastTwo=count%100;return count+' '+(lastTwo>=11&&lastTwo<=14?'підходів':last===1?'підхід':last>=2&&last<=4?'підходи':'підходів');}
function progressSection(key,title,content){return `<details class="card progress-section" ${progressSections.get(key)?'open':''} ontoggle="progressSections.set('${key}',this.open)"><summary>${title}<span aria-hidden="true">⌄</span></summary><div class="progress-section-body">${content}</div></details>`;}
function exerciseProgressView(){
  const names=progressExerciseNames(),groups=groupExercisesByPrimary(names);
  const recordNames=names.filter(name=>exerciseTimeline(name).some(p=>p.kg!==null||p.reps!==null));
  const records=groupExercisesByPrimary(recordNames).map(group=>muscleGroupHTML(group,group.items.map(name=>{
    const points=exerciseTimeline(name),kg=Math.max(0,...points.map(p=>p.kg||0)),reps=Math.max(0,...points.map(p=>p.reps||0));
    return `<div class="list-item record-row"><span class="record-name">${exerciseNameHTML(name)}</span><span class="record-values">${kg?`<strong>${weightHTML(kg)}</strong>`:''}${reps?`<span>🏅 ${reps} повторень</span>`:''}</span></div>`;
  }).join(''),'records')).join('')||'<p>Ще немає виконаних підходів із вагою або повтореннями.</p>';
  const recent=[...db.workouts].sort((a,b)=>b.started-a.started).slice(0,8),maxVolume=Math.max(1,...recent.map(volume));
  const volumes='<p class="small">Останні 8 тренувань. Сума ваги × повторення виконаних підходів; вага тіла не враховується.</p>'+recent.map(w=>`<div class="list-item"><div class="row small"><span>${progressDate(w.started)} · ${esc(w.name)}</span><strong>${weightHTML(volume(w),true)}</strong></div><div class="bar"><i style="width:${volume(w)/maxVolume*100}%"></i></div></div>`).join('');
  const explorer=groups.map(group=>muscleGroupHTML(group,group.items.map(name=>{
    const index=names.indexOf(name),selected=selectedProgressExercise===name;
    return `<div class="progress-exercise"><button type="button" class="progress-exercise-button" data-progress-name="${esc(name)}" aria-expanded="${selected}" aria-controls="exercise-progress-${index}" onclick="selectProgressExercise(this)"><span>${exerciseNameHTML(name)}</span><span aria-hidden="true">⌄</span></button><div id="exercise-progress-${index}" ${selected?'':'hidden'}>${selected?progressExerciseContent(name):''}</div></div>`;
  }).join(''),'exercise-progress')).join('')||'<p>Додайте вправу або імпортуйте тренування.</p>';
  return `<div class="eyebrow">Сила в послідовності</div><h1>Особистий прогрес.</h1><p>Рекорди, зміни результатів і всі підходи кожної вправи.</p>${progressSection('records','Рекорди',records)}${progressSection('volume','Обсяг тренувань',recent.length?volumes:'<p>Ще немає тренувань.</p>')}${progressSection('explorer','Прогрес','<p class="small">Виберіть групу м’язів, а потім вправу.</p>'+explorer)}`;
}
function selectProgressExercise(button){
  const name=button.dataset.progressName,wasSelected=selectedProgressExercise===name;
  document.querySelectorAll('.progress-exercise-button').forEach(el=>{el.setAttribute('aria-expanded','false');const panel=document.getElementById(el.getAttribute('aria-controls'));panel.hidden=true;panel.innerHTML='';});
  selectedProgressExercise=wasSelected?null:name;if(wasSelected)return;
  progressExerciseTab='stats';button.setAttribute('aria-expanded','true');const panel=document.getElementById(button.getAttribute('aria-controls'));panel.hidden=false;panel.innerHTML=progressExerciseContent(name);
}
function setProgressExerciseTab(mode){
  if(!['stats','history'].includes(mode)||!selectedProgressExercise)return;
  progressExerciseTab=mode;const index=progressExerciseNames().indexOf(selectedProgressExercise);document.getElementById('exercise-progress-'+index).innerHTML=progressExerciseContent(selectedProgressExercise);
}
function progressExerciseContent(name){
  const points=exerciseTimeline(name);
  return `<div class="exercise-progress-tabs" aria-label="Перегляд вправи"><button type="button" aria-pressed="${progressExerciseTab==='stats'}" onclick="setProgressExerciseTab('stats')">Статистика</button><button type="button" aria-pressed="${progressExerciseTab==='history'}" onclick="setProgressExerciseTab('history')">Історія</button></div>${!points.length?'<p class="progress-empty">Цю вправу ще не виконували. Після завершення тренування тут з’являться результати.</p>':progressExerciseTab==='history'?exerciseHistoryTables(points):`<p class="small">Кожна точка — найбільша вага або кількість повторень за тренування, серед виконаних підходів. Натисніть точку, щоб побачити дату й перейти до тренування. Золотом позначено найкращий результат за весь час.</p>${exerciseProgressChart(points,'kg','Вага','кг')}${exerciseProgressChart(points,'reps','Повторення','повторень')}`}`;
}
function exerciseProgressChart(timeline,metric,title,unit){
  const points=timeline.filter(p=>p[metric]!==null);
  if(!points.length)return `<section class="exercise-chart"><h3>${title}</h3><p>Немає даних ${metric==='kg'?'із додатковою вагою':'про повторення'} для цієї вправи.</p></section>`;
  const best=Math.max(...points.map(p=>p[metric])),top=metric==='reps'?Math.max(4,Math.ceil(best*1.12)):best*1.12||1,first=points[0].workout.started,last=points.at(-1).workout.started;
  const x=p=>points.length===1?350:64+(p.workout.started-first)/Math.max(1,last-first)*612,y=p=>220-p[metric]/top*182;
  const ticks=Array.from({length:5},(_,i)=>{const value=top*i/4,py=220-value/top*182;return `<line x1="64" x2="676" y1="${py}" y2="${py}" class="chart-grid"/><text x="54" y="${py+4}" text-anchor="end">${metric==='reps'?Math.round(value):fmt(value)}</text>`;}).join('');
  const labels=(first===last?[.5]:[0,.5,1]).map(fraction=>`<text x="${first===last?350:64+fraction*612}" y="245" text-anchor="${fraction===0?'start':fraction===1?'end':'middle'}">${esc(progressDate(first+(last-first)*fraction))}</text>`).join('');
  return `<section class="exercise-chart"><div class="row"><h3>${title}</h3><span class="progress-best">🏅 ${metric==='kg'?weightHTML(best):best+' повторень'}</span></div><svg viewBox="0 0 720 265" class="progress-chart-svg" role="group" aria-label="${title}: зміна в часі"><text x="64" y="18">${unit}</text>${ticks}<polyline points="${points.map(p=>x(p)+','+y(p)).join(' ')}" class="chart-line"/>${points.map((p,index)=>`<circle cx="${x(p)}" cy="${y(p)}" r="${p[metric]===best?7:5}" class="chart-point ${p[metric]===best?'chart-record':''}" role="button" tabindex="0" aria-label="${esc(progressDate(p.workout.started))}: ${fmt(p[metric])} ${unit}${p[metric]===best?', рекорд':''}" onclick="showProgressPoint('${metric}',${index})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();showProgressPoint('${metric}',${index})}"><title>${esc(progressDate(p.workout.started))}: ${fmt(p[metric])} ${unit}</title></circle>`).join('')}${labels}<text x="370" y="263" text-anchor="middle">Дата тренування</text></svg><div id="progress-point-${metric}" class="progress-point-detail" role="status">Натисніть точку на графіку.</div></section>`;
}
function showProgressPoint(metric,index){
  if(!['kg','reps'].includes(metric)||!Number.isInteger(index))return;
  const points=exerciseTimeline(selectedProgressExercise).filter(p=>p[metric]!==null),point=points[index];if(!point)return;
  const best=Math.max(...points.map(p=>p[metric]));
  document.getElementById('progress-point-'+metric).innerHTML=`<div><strong>${esc(progressDate(point.workout.started))}</strong> · ${esc(point.workout.name)}<br>${metric==='kg'?weightHTML(point.kg):point.reps+' повторень'} ${point[metric]===best?'<span class="record-tag">🏅 Рекорд</span>':''}</div><button type="button" class="dark" onclick="openProgressWorkout('${point.workout.id}')">Перейти на це тренування ↗</button>`;
}
function exerciseHistoryTables(points){
  const bestKg=Math.max(0,...points.map(p=>p.kg||0)),bestReps=Math.max(0,...points.map(p=>p.reps||0));let previousKg=0,previousReps=0;
  const sessions=points.map(point=>{
    const tags=point.sets.map(set=>{
      const kg=Number(set.kg)||0,reps=Number(set.reps)||0,labels=[];
      if(kg>0&&kg===bestKg)labels.push('🏅 Рекорд ваги');else if(kg>previousKg)labels.push('↗ Новий рекорд ваги');
      if(reps>0&&reps===bestReps)labels.push('🏅 Рекорд повторень');else if(reps>previousReps)labels.push('↗ Новий рекорд повторень');
      previousKg=Math.max(previousKg,kg);previousReps=Math.max(previousReps,reps);return labels;
    });return {point,tags};
  });
  return `<p class="small">Усі виконані підходи, від новіших тренувань до давніших. 🏅 — найкращий результат за весь час; ↗ — покращення попереднього рекорду.</p>`+sessions.reverse().map(({point,tags})=>`<section class="exercise-history-session"><div class="row"><div><h3>${esc(point.workout.name)}</h3><p class="small">${esc(progressDate(point.workout.started))} · ${new Date(point.workout.started).toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'})} · ${progressSetCount(point.sets.length)}</p></div><button type="button" onclick="openProgressWorkout('${point.workout.id}')">Перейти на це тренування ↗</button></div><div class="progress-table-scroll"><table class="progress-table"><thead><tr><th scope="col">Підхід</th><th scope="col">Вага</th><th scope="col">Повторення</th><th scope="col">Результат / рекорд</th></tr></thead><tbody>${point.sets.map((set,index)=>`<tr class="${tags[index].length?'has-record':''}"><th scope="row">${index+1}</th><td>${Number(set.kg)>0?weightHTML(set.kg):'—'}</td><td>${Number(set.reps)>0?set.reps:'—'}</td><td>${[Number(set.durationSeconds)>0?fmt(set.durationSeconds)+' с':'',Number(set.distanceMeters)>0?fmt(set.distanceMeters)+' м':'',...tags[index].map(tag=>`<span class="record-tag">${tag}</span>`)].filter(Boolean).join(' ')||'—'}</td></tr>`).join('')}</tbody></table></div></section>`).join('');
}
function openProgressWorkout(id){
  if(!db.workouts.some(w=>w.id===id)){toast('Це тренування вже видалено.');return;}
  go('history');const card=document.querySelector(`[data-workout-id="${id}"]`);if(!card)return;
  card.open=true;card.classList.add('history-progress-target');card.scrollIntoView({block:'start',behavior:typeof motionAllowed==='function'&&motionAllowed()?'smooth':'auto'});card.querySelector('summary').focus();
}
