'use strict';

const trainingGoals=Object.freeze({hypertrophy:'Ріст м’язів',strength:'Збільшення сили',endurance:'Кардіовитривалість',power:'Вибухова сила',fitness:'Загальна фізична форма'});
function currentTrainingGoal(){const goal=db.preferences?.trainingGoal;return Object.hasOwn(trainingGoals,goal)?goal:null;}
function renderGoalSelector(){
  const panel=document.getElementById('trainingGoalPanel');if(!panel)return;
  const goal=currentTrainingGoal();
  panel.innerHTML=`<div class="goal-selector"><div><label for="trainingGoal">Моя мета</label><p>Оберіть мету, щоб бачити пріоритет вправ.</p></div><select id="trainingGoal" onchange="changeTrainingGoal(this.value)"><option value="">Без оцінок — оберіть мету</option>${Object.entries(trainingGoals).map(([key,label])=>`<option value="${key}" ${key===goal?'selected':''}>${label}</option>`).join('')}</select></div><details class="goal-method"><summary>Що означають зірочки?</summary><p>5 — пріоритетний вибір, 4 — дуже хороший, 3 — корисне доповнення, 2 — вузьке застосування, 1 — низький пріоритет саме для цієї мети. Низька оцінка не означає, що вправа марна чи небезпечна.</p><p>Це орієнтовна рекомендація за типом руху та способом обліку навантаження, а не науково перевірений рейтинг 451 вправи чи персональний прогноз. Вона не враховує техніку, програму, досвід, доступне обладнання та особисті обмеження. Для невідомих і власних вправ оцінка не вигадується.</p><p>Загальні принципи: <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/" target="_blank" rel="noopener noreferrer">рекомендації ACSM, 2026</a>. Числові зірочки — правила цього застосунку; дослідження не присвоює таких оцінок окремим вправам. Вид обладнання сам по собі не знижує оцінку.</p></details>`;
}
function changeTrainingGoal(goal){
  if(goal!==''&&!Object.hasOwn(trainingGoals,goal))return;
  const previous=db.preferences,search=document.getElementById('catalogueSearch')?.value||'';
  db.preferences={...previous,trainingGoal:goal||null};
  if(!save()){if(previous===undefined)delete db.preferences;else db.preferences=previous;renderGoalSelector();return;}
  render();if(tab==='catalogue'&&search){document.getElementById('catalogueSearch').value=search;renderCatalogueRows(search);}
}
function exerciseGoalPriority(exercise,goal=currentTrainingGoal()){
  if(!goal||!Object.hasOwn(trainingGoals,goal))return null;
  const name=typeof exercise==='string'?exercise:exercise.name,stored=db.exerciseCatalog?.find(e=>e.name===name),record=typeof exercise==='string'?stored:{...stored,...exercise};
  if(!record?.type||record.is_custom||!record.primary_muscle_group||record.primary_muscle_group==='unknown')return {score:null,reason:'Недостатньо даних для оцінки цієї вправи.'};
  const type=record.type,mobility=/^(Stretching|Yoga|Downward Dog|Warm Up)$/.test(name),cardio=record.primary_muscle_group==='cardio',ballistic=/\b(Clean|Snatch|Jerk|Jump|Jumps|Thruster|Sprints|High Pull|Push Press|Kettlebell Swing|Ball Slams|Wall Ball)\b/i.test(name);
  const resistance=['weight_reps','bodyweight_weighted','bodyweight_assisted','reps_only','weight_duration','short_distance_weight'].includes(type),isometric=type==='duration'&&!cardio&&!mobility;
  if(!resistance&&!isometric&&!cardio&&!mobility)return {score:null,reason:'Для цього типу вправ поки немає правила оцінювання.'};
  let score,reason;
  if(goal==='hypertrophy'){
    if(cardio||mobility){score=1;reason='Корисне для інших завдань, але не є основним способом цільового росту м’язів.';}
    else if(ballistic){score=2;reason='Рух спрямований передусім на швидкість і потужність; для росту м’язів зазвичай простіше дозувати контрольовані силові підходи.';}
    else if(isometric){score=3;reason='Статичне навантаження може доповнювати програму, але не замінює різноманітні силові рухи.';}
    else {score=type==='weight_reps'||type.startsWith('bodyweight_')?5:4;reason='Силовий рух, у якому можна поступово збільшувати навантаження або складність. Результат залежить від обсягу та зусилля.';}
  }else if(goal==='strength'){
    if(cardio||mobility){score=1;reason='Допоміжна роль: розвиток максимальної сили потребує практики відповідного силового руху.';}
    else if(ballistic){score=3;reason='Насамперед розвиває потужність; для максимальної сили потрібне окреме дозування силового навантаження.';}
    else if(isometric){score=3;reason='Може зміцнювати конкретні положення; перенесення на інші рухи залежить від завдання.';}
    else {score=/\b(Squat|Deadlift|Bench Press|Overhead Press|Pull Up|Chin Up|Leg Press|Row)\b/i.test(name)?5:4;reason='Підходить для силової прогресії. Найкраще зростає сила саме в рухах, які регулярно тренуються.';}
  }else if(goal==='endurance'){
    score=cardio?5:mobility?2:3;reason=cardio?'Ритмічне навантаження, придатне для розвитку кардіовитривалості за відповідних тривалості та інтенсивності.':mobility?'Допомагає рухливості, але не замінює навантаження на серцево-судинну систему.':'Силова робота доповнює кардіопідготовку, але не є її прямою заміною.';
  }else if(goal==='power'){
    score=ballistic?5:cardio||mobility?2:isometric?3:4;reason=ballistic?'Вибуховий рух для розвитку потужності за відповідних швидкості, навантаження та техніки.':cardio||mobility?'Допоміжна роль у підготовці до швидких силових рухів.':'Створює силову основу; для потужності додатково потрібна робота зі швидким виконанням.';
  }else{
    score=cardio||resistance?4:3;reason='Корисний компонент загальної підготовки. Повноцінна програма поєднує силові вправи, кардіо та рухливість.';
  }
  return {score,reason};
}
function exerciseGoalHTML(exercise){
  const rating=exerciseGoalPriority(exercise);if(!rating)return '';
  if(rating.score===null)return `<span class="exercise-rating unrated">Без оцінки · ${esc(rating.reason)}</span>`;
  const label=trainingGoals[currentTrainingGoal()];
  return `<span class="exercise-rating" title="${esc(rating.reason)}"><span class="goal-stars" role="img" aria-label="Пріоритет ${rating.score} із 5 для мети ${esc(label)}">${'★'.repeat(rating.score)}${'☆'.repeat(5-rating.score)}</span><span>${rating.score}/5 · ${esc(label)}</span><span class="goal-reason">${esc(rating.reason)}</span></span>`;
}
