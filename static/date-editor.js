'use strict';

const workoutMonths=['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
let workoutDateDraft=null;

function daysInWorkoutMonth(year,month){return new Date(year,month+1,0).getDate();}

function workoutOnDate(workout,year,month,day){
  const maxYear=new Date().getFullYear()+10;
  if(!Number.isInteger(year)||year<1970||year>maxYear||!Number.isInteger(month)||month<0||month>11||!Number.isInteger(day)||day<1||day>daysInWorkoutMonth(year,month))throw Error('Виберіть коректну дату.');
  const start=new Date(workout.started);
  start.setFullYear(year,month,day);
  if(start.getTime()<0||!Number.isFinite(start.getTime()))throw Error('Ця дата не підтримується.');
  return {...workout,started:start.getTime(),finished:start.getTime()+Math.max(0,workout.finished-workout.started)};
}

function openWorkoutDate(event,button){
  event.preventDefault();event.stopPropagation();
  const workout=db.workouts.find(item=>item.id===button.dataset.dateWorkout);
  if(!workout)return;
  const date=new Date(workout.started);
  workoutDateDraft={id:workout.id,year:date.getFullYear(),month:date.getMonth(),day:date.getDate(),mode:button.dataset.dateMode,returnMode:button.dataset.dateMode,wasOpen:Boolean(button.closest('details')?.open)};
  let dialog=document.getElementById('workoutDateDialog');
  if(!dialog){dialog=document.createElement('dialog');dialog.id='workoutDateDialog';dialog.setAttribute('aria-labelledby','workoutDateTitle');document.body.appendChild(dialog);dialog.addEventListener('close',()=>{workoutDateDraft=null;});}
  renderWorkoutDate();dialog.showModal();scrollWorkoutYear();
}

function setWorkoutDateMode(mode){
  if(!workoutDateDraft||!['day','month','year'].includes(mode))return;
  workoutDateDraft.mode=mode;renderWorkoutDate();scrollWorkoutYear();
}

function scrollWorkoutYear(){
  if(workoutDateDraft?.mode==='year')document.getElementById('workout-year-'+workoutDateDraft.year)?.scrollIntoView({block:'nearest'});
}

function chooseWorkoutDatePart(part,value){
  const draft=workoutDateDraft;if(!draft)return;
  if(part==='day'&&Number.isInteger(value)&&value>=1&&value<=daysInWorkoutMonth(draft.year,draft.month))draft.day=value;
  else if(part==='month'&&Number.isInteger(value)&&value>=0&&value<12){draft.month=value;draft.day=Math.min(draft.day,daysInWorkoutMonth(draft.year,draft.month));draft.mode='day';}
  else if(part==='year'&&Number.isInteger(value)&&value>=1970&&value<=new Date().getFullYear()+10){draft.year=value;draft.day=Math.min(draft.day,daysInWorkoutMonth(draft.year,draft.month));draft.mode='day';}
  else return;
  renderWorkoutDate();
}

function shiftWorkoutMonth(direction){
  const draft=workoutDateDraft;if(!draft||![1,-1].includes(direction))return;
  const date=new Date(draft.year,draft.month+direction,1),year=date.getFullYear();
  if(year<1970||year>new Date().getFullYear()+10)return;
  draft.year=year;draft.month=date.getMonth();draft.day=Math.min(draft.day,daysInWorkoutMonth(draft.year,draft.month));renderWorkoutDate();
}

function renderWorkoutDate(){
  const draft=workoutDateDraft;if(!draft)return;
  const workout=db.workouts.find(item=>item.id===draft.id);if(!workout)return;
  let content='';
  if(draft.mode==='month')content=`<div class="workout-month-grid" aria-label="Місяці">${workoutMonths.map((name,index)=>`<button type="button" class="date-option ${draft.month===index?'selected':''}" aria-pressed="${draft.month===index}" onclick="chooseWorkoutDatePart('month',${index})">${name}</button>`).join('')}</div>`;
  else if(draft.mode==='year'){
    const years=Array.from({length:new Date().getFullYear()+11-1970},(_,index)=>new Date().getFullYear()+10-index);
    content=`<p class="muted">Прокрутіть униз до давніших років.</p><div class="workout-year-list" aria-label="Роки">${years.map(year=>`<button id="workout-year-${year}" type="button" class="date-option ${year===draft.year?'selected':''}" aria-pressed="${year===draft.year}" onclick="chooseWorkoutDatePart('year',${year})">${year}</button>`).join('')}</div>`;
  }else{
    const offset=(new Date(draft.year,draft.month,1).getDay()+6)%7;
    const days=Array.from({length:daysInWorkoutMonth(draft.year,draft.month)},(_,index)=>index+1);
    content=`<div class="workout-calendar-heading"><button type="button" aria-label="Попередній місяць" onclick="shiftWorkoutMonth(-1)" ${draft.year===1970&&draft.month===0?'disabled':''}>‹</button><strong>${workoutMonths[draft.month]} ${draft.year}</strong><button type="button" aria-label="Наступний місяць" onclick="shiftWorkoutMonth(1)" ${draft.year===new Date().getFullYear()+10&&draft.month===11?'disabled':''}>›</button></div><div class="workout-calendar"><div class="workout-weekdays">${['Пн','Вт','Ср','Чт','Пт','Сб','Нд'].map(day=>`<span>${day}</span>`).join('')}</div><div class="workout-days">${'<span aria-hidden="true"></span>'.repeat(offset)}${days.map(day=>`<button type="button" class="date-option ${day===draft.day?'selected':''}" aria-label="${day} ${workoutMonths[draft.month]} ${draft.year}" aria-pressed="${day===draft.day}" onclick="chooseWorkoutDatePart('day',${day})">${day}</button>`).join('')}</div></div>`;
  }
  document.getElementById('workoutDateDialog').innerHTML=`<div class="workout-date-header"><div><h2 id="workoutDateTitle">Дата тренування</h2><p>${esc(workout.name)}</p></div><button type="button" class="subtle" aria-label="Закрити вибір дати" onclick="document.getElementById('workoutDateDialog').close()">✕</button></div><div class="workout-date-tabs">${[['day',String(draft.day).padStart(2,'0'),'День'],['month',String(draft.month+1).padStart(2,'0'),'Місяць'],['year',String(draft.year),'Рік']].map(([mode,value,label])=>`<button type="button" class="${draft.mode===mode?'selected':''}" aria-label="Вибрати ${label.toLocaleLowerCase('uk-UA')}" aria-pressed="${draft.mode===mode}" onclick="setWorkoutDateMode('${mode}')"><strong>${value}</strong><span>${label}</span></button>`).join('')}</div><div class="workout-date-body">${content}</div><p class="workout-date-hint">Час початку й тривалість тренування збережуться. Для коротших місяців день підлаштується автоматично.</p><p id="workoutDateError" role="alert" class="custom-error" hidden></p><div class="workout-date-footer"><button type="button" onclick="document.getElementById('workoutDateDialog').close()">Скасувати</button><button type="button" class="primary" onclick="saveWorkoutDate()">Зберегти дату</button></div>`;
}

function saveWorkoutDate(){
  const draft=workoutDateDraft;if(!draft)return;
  const index=db.workouts.findIndex(item=>item.id===draft.id);if(index<0)return;
  const previous=db.workouts;
  try{
    const updated=workoutOnDate(previous[index],draft.year,draft.month,draft.day);
    db.workouts=previous.map((workout,position)=>position===index?updated:workout).sort((a,b)=>a.started-b.started||a.id.localeCompare(b.id));
    if(!save()){db.workouts=previous;try{localStorage.setItem(KEY,JSON.stringify(db));}catch(_){}throw Error('Не вдалося зберегти дату. Спробуйте ще раз.');}
    document.getElementById('workoutDateDialog').close();render();
    const details=document.querySelector?.(`[data-workout-id="${draft.id}"]`);
    if(details){details.open=draft.wasOpen;details.scrollIntoView({block:'center',behavior:typeof motionAllowed==='function'&&motionAllowed()?'smooth':'auto'});details.querySelector(`[data-date-mode="${draft.returnMode}"]`)?.focus({preventScroll:true});}
    toast('Дату змінено. Тренування переміщено на відповідне місце в історії.');
  }catch(error){const message=document.getElementById('workoutDateError');message.textContent=error.message;message.hidden=false;}
}
