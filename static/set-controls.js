'use strict';

function setValueControl(set, exerciseIndex, setIndex, key, label) {
  if (!key) return '<span></span>';
  const step=key==='kg'?.1:1, max=key==='kg'?2000:key==='reps'?10000:10000000;
  const value=key==='reps'?String(set[key]||0):Number(set[key]||0).toFixed(1);
  const inputId=`value-${set.id}-${key}`;
  return `<div class="stepper-field" data-field="${key}">
    <div class="number-stepper">
      <button type="button" class="stepper-button" aria-label="Зменшити ${esc(label)}, підхід ${setIndex+1}" onclick="changeSetValue(${exerciseIndex},${setIndex},'${key}',-1)">−</button>
      <input id="${esc(inputId)}" class="stepper-value" type="number" inputmode="${key==='reps'?'numeric':'decimal'}" min="0" max="${max}" step="${step}" aria-label="${esc(label)}, підхід ${setIndex+1}" value="${value}" onchange="updateSet(${exerciseIndex},${setIndex},'${key}',this)">
      <button type="button" class="stepper-button" aria-label="Збільшити ${esc(label)}, підхід ${setIndex+1}" onclick="changeSetValue(${exerciseIndex},${setIndex},'${key}',1)">+</button>
    </div>
    ${key==='kg'?`<span class="weight-lb" title="Еквівалент у фунтах">${poundsText(set.kg||0)}</span>`:''}
  </div>`;
}

function changeSetValue(exerciseIndex,setIndex,key,direction) {
  if(!['kg','reps','durationSeconds','distanceMeters'].includes(key)||![1,-1].includes(direction))return;
  const set=db.active?.exercises[exerciseIndex]?.sets[setIndex];
  if(!set)return;
  const input=document.getElementById(`value-${set.id}-${key}`);
  if(!input)return;
  const typed=input.value.trim()===''?NaN:Number(input.value),current=Number.isFinite(typed)&&typed>=0?typed:Number(set[key]||0);
  const step=key==='kg'?.1:1,max=key==='kg'?2000:key==='reps'?10000:10000000;
  const next=Math.max(0,Math.min(max,rounded(current+direction*step)));
  input.value=key==='reps'?String(Math.round(next)):next.toFixed(1);
  updateSet(exerciseIndex,setIndex,key,input);
}
