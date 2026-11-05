'use strict';

let catalogueEquipment='all';
const catalogueEquipmentOrder=['dumbbell','barbell','machine','none','plate','suspension','kettlebell','resistance_band','other'];
const catalogueEquipmentLabels={dumbbell:'Гантелі',barbell:'Штанга',machine:'Тренажер',none:'Без обладнання',plate:'Диски',suspension:'Петлі',kettlebell:'Гирі',resistance_band:'Еспандери',other:'Інше'};
function performedExerciseNames(){return new Set(db.workouts.flatMap(workout=>workout.exercises.filter(exercise=>exercise.sets.some(set=>set.done)).map(exercise=>exercise.name)));}
function catalogueEquipmentKey(exercise){return catalogueEquipmentOrder.includes(exercise.equipment)?exercise.equipment:'other';}
function fullCatalogue(){const records=db.exerciseCatalog||[],names=new Set(records.map(e=>e.name));return [...records,...db.custom.filter(name=>!names.has(name)).map(name=>({name}))];}
function equipmentCatalogueRows(query){
  const all=fullCatalogue(),q=query.trim().toLocaleLowerCase('uk-UA'),performed=performedExerciseNames();
  const matching=all.filter(exercise=>[exerciseMuscleSearchText(exercise),catalogueEquipmentLabels[catalogueEquipmentKey(exercise)],equipmentUk[exercise.equipment]||''].join(' ').toLocaleLowerCase('uk-UA').includes(q));
  const filtered=matching.filter(exercise=>catalogueEquipment==='all'||catalogueEquipmentKey(exercise)===catalogueEquipment);
  const filters=[['all','Усе обладнання'],...catalogueEquipmentOrder.map(key=>[key,catalogueEquipmentLabels[key]])].map(([key,label])=>{
    const count=key==='all'?matching.length:matching.filter(exercise=>catalogueEquipmentKey(exercise)===key).length;
    return `<button type="button" class="equipment-filter" aria-pressed="${key===catalogueEquipment}" onclick="filterCatalogueEquipment('${key}')">${esc(label)} <span>(${count})</span></button>`;
  }).join('');
  const groups=groupExercisesByPrimary(filtered);
  return `<div class="equipment-filters" role="group" aria-label="Обладнання">${filters}</div><div class="muted">${filtered.length} із ${all.length} вправ · виберіть групу м’язів</div>`+groups.map(group=>muscleGroupHTML(group,group.items.map(exercise=>{
    const done=performed.has(exercise.name);
    return `<div class="list-item custom-catalogue-item ${done?'exercise-performed':''}">${exerciseImageHTML(exercise)}<div class="catalogue-exercise-copy"><strong class="catalogue-exercise-name">${exerciseNameHTML(exercise.name)}</strong>${muscleDetailsHTML(exercise)}<div class="muted">${esc(catalogueEquipmentLabels[catalogueEquipmentKey(exercise)])}${done?' · Виконували раніше':''}</div>${done?`<button type="button" class="exercise-history-link" data-exercise-name="${esc(exercise.name)}" onclick="openCatalogueExerciseHistory(this.dataset.exerciseName)">Історія цієї вправи ↗</button>`:''}</div></div>`;
  }).join(''),'catalogue',Boolean(q))).join('')+(!all.length?'<p>Додайте власну вправу або імпортуйте каталог.</p>':!filtered.length?'<p>За цими фільтрами вправ не знайдено.</p>':'');
}
function filterCatalogueEquipment(key){if(key!=='all'&&!catalogueEquipmentOrder.includes(key))return;catalogueEquipment=key;renderCatalogueRows(document.getElementById('catalogueSearch')?.value||'');}
function openCatalogueExerciseHistory(name){
  if(!performedExerciseNames().has(name))return;
  selectedProgressExercise=name;progressExerciseTab='history';progressSections.set('explorer',true);
  expandedMuscleGroups.set('exercise-progress:'+exerciseMuscles(name).primary,true);
  go('progress');
  const index=progressExerciseNames().indexOf(name),panel=document.getElementById('exercise-progress-'+index);
  if(panel){panel.scrollIntoView({block:'start',behavior:typeof motionAllowed==='function'&&motionAllowed()?'smooth':'auto'});document.querySelector(`[aria-controls="exercise-progress-${index}"]`)?.focus({preventScroll:true});}
}
