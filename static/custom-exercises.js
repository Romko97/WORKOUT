'use strict';

const customExerciseTypes = Object.freeze({
  weight_reps: 'Вага та повторення', reps_only: 'Лише повторення',
  bodyweight_weighted: 'Власна вага + додаткова вага та повторення',
  duration: 'Тривалість', weight_duration: 'Вага та тривалість',
  distance_duration: 'Відстань та тривалість', short_distance_weight: 'Вага та відстань'
});
const customMuscleKeys = ['chest','lats','upper_back','lower_back','traps','shoulders','biceps','triceps','forearms','quadriceps','hamstrings','glutes','calves','abdominals','neck','abductors','adductors','full_body','cardio','other'];
const customEquipmentKeys = ['none','barbell','dumbbell','kettlebell','machine','plate','resistance_band','suspension','other'];
let customExerciseDraft = { image: '', busy: false, addToWorkout: false, generation: 0 };

function safeExerciseImage(value) {
  return typeof value === 'string' && value.length <= 400000 && /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(value);
}

function exerciseImageHTML(exercise) {
  const name = typeof exercise === 'string' ? exercise : exercise.name;
  const record = db.exerciseCatalog?.find(item => item.name === name) || exercise;
  return safeExerciseImage(record?.image_data_url) ? `<img class="exercise-thumb" src="${record.image_data_url}" alt="${esc(name)}" loading="lazy">` : '';
}

function validateCustomExercise(values) {
  const name = String(values.name || '').trim().normalize('NFC');
  if (!name || name.length > 100) throw Error('Вкажіть назву вправи — до 100 символів.');
  const normalized = name.toLocaleLowerCase('uk-UA');
  const names = [...catalog, ...db.custom, ...(db.exerciseCatalog || []).map(item => item.name)];
  if (names.some(item => item.trim().normalize('NFC').toLocaleLowerCase('uk-UA') === normalized)) throw Error('Вправа з такою назвою вже існує. Виберіть іншу назву.');
  if (!Object.prototype.hasOwnProperty.call(customExerciseTypes, values.type)) throw Error('Виберіть тип обліку результатів.');
  if (!customEquipmentKeys.includes(values.equipment)) throw Error('Виберіть обладнання.');
  if (!customMuscleKeys.includes(values.primary)) throw Error('Виберіть головну групу м’язів.');
  const secondary = [...new Set((values.secondary || []).filter(key => key !== values.primary))];
  if (secondary.some(key => !customMuscleKeys.includes(key))) throw Error('Перевірте другорядні групи м’язів.');
  if (values.image && !safeExerciseImage(values.image)) throw Error('Не вдалося підготувати зображення. Виберіть інше.');
  return { id: uid(), name, type: values.type, equipment: values.equipment,
    primary_muscle_group: values.primary, secondary_muscle_groups: secondary,
    is_custom: true, ...(values.image ? { image_data_url: values.image } : {}) };
}

function ensureCustomExerciseDialog() {
  if (document.getElementById('customExerciseDialog')) return;
  const dialog = document.createElement('dialog');
  dialog.id = 'customExerciseDialog';
  dialog.setAttribute('aria-labelledby', 'customExerciseTitle');
  const options = (keys, label) => keys.map(key => `<option value="${key}">${esc(label(key))}</option>`).join('');
  dialog.innerHTML = `<form id="customExerciseForm" onsubmit="submitCustomExercise(event)">
    <div class="custom-form-header"><h2 id="customExerciseTitle">Створити власну вправу</h2><button type="button" class="subtle" aria-label="Закрити форму" onclick="closeCustomExercise()">✕</button></div>
    <div class="custom-form-body">
      <div class="custom-image-area"><div id="customImagePreview" class="custom-image-placeholder" aria-label="Попередній перегляд зображення">＋</div><div class="actions"><button type="button" onclick="document.getElementById('customImageFile').click()">Додати зображення</button><button type="button" id="customImageRemove" class="subtle" hidden onclick="removeCustomExerciseImage()">Прибрати</button></div><span class="muted">Необов’язково · JPG, PNG або WebP · до 5 МБ</span><input id="customImageFile" type="file" accept="image/jpeg,image/png,image/webp" hidden style="display:none" onchange="readCustomExerciseImage(this.files[0])"></div>
      <label for="customName">Назва вправи <span aria-hidden="true">*</span></label><input id="customName" name="exerciseName" maxlength="100" required placeholder="Наприклад, тяга блока однією рукою" oninput="updateCustomExerciseForm()">
      <label for="customType">Тип обліку результатів *</label><select id="customType" required onchange="updateCustomExerciseForm()"><option value="">Виберіть тип</option>${options(Object.keys(customExerciseTypes),key=>customExerciseTypes[key])}</select>
      <label for="customEquipment">Обладнання *</label><select id="customEquipment" required onchange="updateCustomExerciseForm()"><option value="">Виберіть обладнання</option>${options(customEquipmentKeys,key=>key==='none'?'Без обладнання':equipmentUk[key])}</select>
      <label for="customPrimary">Головна група м’язів *</label><select id="customPrimary" required onchange="updateCustomExerciseForm()"><option value="">Виберіть головну групу</option>${options(customMuscleKeys,muscleLabel)}</select>
      <fieldset class="custom-secondary"><legend>Другорядні м’язи <span class="muted">— необов’язково</span></legend><div class="custom-secondary-grid">${customMuscleKeys.filter(key=>!['full_body','cardio','other'].includes(key)).map(key=>`<label><input type="checkbox" name="secondaryMuscle" value="${key}"><span>${esc(muscleLabel(key))}</span></label>`).join('')}</div></fieldset>
      <p id="customExerciseError" class="custom-error" role="alert" hidden></p>
    </div><div class="custom-form-footer"><span class="muted">* Обов’язкові поля</span><button id="customExerciseSubmit" class="primary" type="submit" disabled>Створити вправу</button></div>
  </form>`;
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeCustomExercise(); });
  document.body.appendChild(dialog);
}

function openCustomExercise(addToWorkout = false, name = '') {
  ensureCustomExerciseDialog();
  customExerciseDraft = { image: '', busy: false, addToWorkout, generation: customExerciseDraft.generation + 1 };
  document.getElementById('customExerciseForm').reset();
  document.getElementById('customName').value = name;
  document.getElementById('customExerciseError').hidden = true;
  document.getElementById('customImagePreview').innerHTML = '＋';
  document.getElementById('customImageRemove').hidden = true;
  if (document.getElementById('picker')?.open) document.getElementById('picker').close();
  updateCustomExerciseForm();
  document.getElementById('customExerciseDialog').showModal();
  document.getElementById('customName').focus();
}

function closeCustomExercise() {
  const returnToPicker = customExerciseDraft.addToWorkout && db.active;
  customExerciseDraft.generation++;
  document.getElementById('customExerciseDialog').close();
  if (returnToPicker) openPicker();
}

function updateCustomExerciseForm() {
  const primary = document.getElementById('customPrimary').value;
  document.querySelectorAll('#customExerciseForm input[name="secondaryMuscle"]').forEach(input => {
    input.disabled = input.value === primary;
    if (input.disabled) input.checked = false;
  });
  const complete = ['customName','customType','customEquipment','customPrimary'].every(id => document.getElementById(id).value.trim());
  document.getElementById('customExerciseSubmit').disabled = !complete || customExerciseDraft.busy;
}

function customExerciseError(message) {
  const error = document.getElementById('customExerciseError');
  error.textContent = message;
  error.hidden = false;
}

async function readCustomExerciseImage(file) {
  if (!file) return;
  const token = ++customExerciseDraft.generation;
  customExerciseDraft.busy = true;
  updateCustomExerciseForm();
  try {
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw Error('Виберіть JPG, PNG або WebP розміром до 5 МБ.');
    const url = URL.createObjectURL(file);
    const image = new Image();
    try {
      await new Promise((resolve,reject) => { image.onload=resolve;image.onerror=()=>reject(Error('Не вдалося прочитати зображення.'));image.src=url; });
      if (!image.naturalWidth || image.naturalWidth * image.naturalHeight > 40000000) throw Error('Зображення завелике. Виберіть менше.');
      const canvas = document.createElement('canvas'), ratio = Math.min(1,640/Math.max(image.naturalWidth,image.naturalHeight));
      canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
      canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
      const result=canvas.toDataURL('image/webp',.82);
      if (!safeExerciseImage(result)) throw Error('Зображення надто велике після обробки. Виберіть простіше зображення.');
      if (token !== customExerciseDraft.generation) return;
      customExerciseDraft.image=result;
      const preview=document.createElement('img');preview.src=result;preview.alt='Зображення власної вправи';
      document.getElementById('customImagePreview').replaceChildren(preview);
      document.getElementById('customImageRemove').hidden=false;
      document.getElementById('customExerciseError').hidden=true;
    } finally { URL.revokeObjectURL(url); }
  } catch(error) { if(token===customExerciseDraft.generation) customExerciseError(error.message); }
  finally { if(token===customExerciseDraft.generation){customExerciseDraft.busy=false;updateCustomExerciseForm();} }
}

function removeCustomExerciseImage() {
  customExerciseDraft.generation++;
  customExerciseDraft.image='';customExerciseDraft.busy=false;
  document.getElementById('customImageFile').value='';
  document.getElementById('customImagePreview').innerHTML='＋';
  document.getElementById('customImageRemove').hidden=true;
  updateCustomExerciseForm();
}

function submitCustomExercise(event) {
  event.preventDefault();
  if (customExerciseDraft.busy) return;
  try {
    const exercise=validateCustomExercise({name:document.getElementById('customName').value,type:document.getElementById('customType').value,equipment:document.getElementById('customEquipment').value,primary:document.getElementById('customPrimary').value,secondary:[...document.querySelectorAll('#customExerciseForm input[name="secondaryMuscle"]:checked')].map(input=>input.value),image:customExerciseDraft.image});
    const previousCatalogue=db.exerciseCatalog,previousCustom=db.custom;
    db.exerciseCatalog=[...(db.exerciseCatalog||[]),exercise];db.custom=[...db.custom,exercise.name];
    if(!save()){db.exerciseCatalog=previousCatalogue;db.custom=previousCustom;try{localStorage.setItem(KEY,JSON.stringify(db));}catch(_){}throw Error('Не вдалося зберегти вправу. Спробуйте ще раз.');}
    const addToWorkout=customExerciseDraft.addToWorkout;
    customExerciseDraft.generation++;
    document.getElementById('customExerciseDialog').close();
    if(addToWorkout&&db.active)addExercise(exercise.name);else render();
    toast('Власну вправу створено та додано до каталогу.');
  } catch(error) { customExerciseError(error.message); }
}
