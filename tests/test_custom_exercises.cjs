const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',innerHTML:'',hidden:false,close(){},showModal(){}});return elements.get(id)};
let fail=false,written=null;
const c={crypto:crypto.webcrypto,Date,document:{getElementById:el,querySelectorAll:()=>[]},localStorage:{setItem(){}},formaSync:{load:async()=>({workouts:[],routines:[],active:null,custom:[],exerciseCatalog:[]}),save:state=>{if(fail)throw Error('cache');written=JSON.parse(JSON.stringify(state));}},setTimeout(){},clearTimeout(){},setInterval(){},navigator:{}};c.window=c;
vm.createContext(c);for(const name of ['effects','localization','anatomy','muscles','custom-exercises','app'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../static/'+name+'.js'),'utf8'),c);
const run=code=>vm.runInContext(code,c);
(async()=>{
 await c.formaReady;
 assert.throws(()=>run("validateCustomExercise({name:'',type:'weight_reps',equipment:'machine',primary:'chest'})"));
 assert.throws(()=>run("validateCustomExercise({name:'Моя вправа',type:'invalid',equipment:'machine',primary:'chest'})"));
 const data=run("validateCustomExercise({name:'  Моя тяга  ',type:'weight_reps',equipment:'machine',primary:'upper_back',secondary:['upper_back','biceps','biceps']})");assert.equal(data.name,'Моя тяга');assert.deepEqual(Array.from(data.secondary_muscle_groups),['biceps']);
 el('customName').value='Моя тяга';el('customType').value='weight_reps';el('customEquipment').value='machine';el('customPrimary').value='upper_back';run('submitCustomExercise({preventDefault(){}})');assert.equal(written.exerciseCatalog.length,1);assert.equal(written.exerciseCatalog[0].is_custom,true);assert.equal(run("groupExercisesByPrimary(db.exerciseCatalog)[0].key"),'upper_back');
 assert.throws(()=>run("validateCustomExercise({name:'МОЯ ТЯГА',type:'weight_reps',equipment:'machine',primary:'upper_back'})"));
 fail=true;el('customName').value='Друга вправа';run('submitCustomExercise({preventDefault(){}})');assert.equal(run('db.exerciseCatalog.length'),1);assert.ok(!el('customExerciseError').hidden);fail=false;
 run('start()');
 for(const type of ['weight_reps','reps_only','bodyweight_weighted','duration','weight_duration','distance_duration','short_distance_weight']){
  c.type=type;run("{const ex=validateCustomExercise({name:'Тест '+type,type,equipment:'none',primary:'full_body'});db.exerciseCatalog.push(ex);db.custom.push(ex.name);addExercise(ex.name)}");
  assert.equal(run('db.active.exercises.at(-1).trackingType'),type);
  if(['duration','weight_duration','distance_duration'].includes(type)){assert.equal(run('db.active.exercises.at(-1).sets[0].reps'),0);assert.equal(run('db.active.exercises.at(-1).sets[0].durationSeconds'),60);}
 }
 assert.ok(run("safeExerciseImage('data:image/png;base64,iVBORw0KGgo=')"));assert.ok(!run("safeExerciseImage('data:image/svg+xml;base64,PHN2Zz4=')"));assert.ok(!run("safeExerciseImage('https://example.com/photo.png')"));
 console.log('PASS: form validation, duplicate names, muscle grouping, rollback on save failure, all seven exercise types, safe image formats.');
})().catch(e=>{console.error(e);process.exitCode=1});

