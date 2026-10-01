const STORAGE_KEY="master_app_v1";

const catalog=[
  {id:"pushups",name:"Отжимания",type:"reps",defaultReps:12},
  {id:"squats",name:"Приседания",type:"reps",defaultReps:15},
  {id:"pullups",name:"Подтягивания",type:"reps",defaultReps:6},
  {id:"crunches",name:"Скручивания",type:"reps",defaultReps:20},
  {id:"plank",name:"Планка",type:"time",defaultSeconds:45},
  {id:"lunges",name:"Выпады",type:"reps",defaultReps:12}
];

const defaultState={
  profile:{name:"",height:"",weight:"",saved:false},
  workouts:[],
  history:[]
};

let state=loadState();
let route="workout";
let builder={name:"",exercises:[]};
let session=null;
let sessionTick=null;

function loadState(){
  try{
    const stored=JSON.parse(localStorage.getItem(STORAGE_KEY))||{};
    const profile={...defaultState.profile,...(stored.profile||{})};
    if(profile.saved===undefined)profile.saved=Boolean(profile.name||profile.height||profile.weight);
    return {...defaultState,...stored,profile};
  }catch{return structuredClone(defaultState)}
}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function el(id){return document.getElementById(id)}
function cloneTemplate(id){return document.getElementById(id).content.cloneNode(true)}
function setNav(active){
  document.querySelectorAll(".nav-btn").forEach(btn=>btn.classList.toggle("active",btn.dataset.route===active));
}
function render(){
  const app=el("app"); app.innerHTML="";
  setNav(["workout","profile","settings"].includes(route)?route:"workout");
  if(route==="workout")renderWorkoutHome(app);
  if(route==="builder")renderBuilder(app);
  if(route==="session")renderSession(app);
  if(route==="result")renderResult(app);
  if(route==="profile")renderProfile(app);
  if(route==="settings")renderSettings(app);
  if(route==="profile-edit")renderProfileEdit(app);
}
function renderWorkoutHome(app){
  app.append(cloneTemplate("workoutTemplate"));
  el("createWorkoutBtn").onclick=()=>{
    builder={name:"Новая тренировка",exercises:[]};
    route="builder"; render();
  };
  const list=el("savedWorkouts");
  el("savedWorkoutCount").textContent=state.workouts.length;
  if(!state.workouts.length){
    list.innerHTML='<div class="empty">Пока нет сохранённых тренировок</div>';
    return;
  }
  state.workouts.forEach((w,index)=>{
    const card=document.createElement("div"); card.className="workout-card";
    const reps=w.exercises.reduce((sum,e)=>sum+(e.type==="reps"?e.reps*e.sets:0),0);
    card.innerHTML=`<div><h4>${escapeHtml(w.name)}</h4><div class="workout-meta">${w.exercises.length} упражнений · ${reps} повт.</div></div>
      <div class="workout-actions"><button class="mini-btn" data-edit>✎</button><button class="mini-btn" data-start>▶</button></div>`;
    card.querySelector("[data-edit]").onclick=()=>{builder=JSON.parse(JSON.stringify(w));builder.index=index;route="builder";render()};
    card.querySelector("[data-start]").onclick=()=>startSession(JSON.parse(JSON.stringify(w)));
    list.append(card);
  });
}
function renderBuilder(app){
  app.append(cloneTemplate("builderTemplate"));
  el("workoutName").value=builder.name;
  el("workoutName").oninput=e=>builder.name=e.target.value;
  el("backBtn").onclick=()=>{route="workout";render()};
  const cat=el("exerciseCatalog");
  catalog.forEach(ex=>{
    const card=document.createElement("button"); card.className="catalog-card";
    card.innerHTML=`<strong>${ex.name}</strong><span>${ex.type==="time"?"по времени":"на повторения"}</span>`;
    card.onclick=()=>{addExercise(ex);renderBuilderList()};
    cat.append(card);
  });
  renderBuilderList();
  el("saveWorkoutBtn").onclick=saveBuilder;
  el("startWorkoutBtn").onclick=()=>{
    if(!builder.exercises.length){alert("Добавь хотя бы одно упражнение");return}
    saveBuilder(false); startSession(JSON.parse(JSON.stringify(builder)));
  };
}
function addExercise(ex){
  builder.exercises.push({
    uid:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),
    id:ex.id,name:ex.name,type:ex.type,
    reps:ex.defaultReps||0,seconds:ex.defaultSeconds||30,sets:3,rest:45
  });
}
function renderBuilderList(){
  const list=el("builderList"); list.innerHTML="";
  if(!builder.exercises.length){list.innerHTML='<div class="empty">Добавь упражнения из каталога</div>';return}
  builder.exercises.forEach((ex,index)=>{
    const row=document.createElement("div"); row.className="exercise-row"; row.draggable=true;
    row.innerHTML=`<div class="drag-handle">☰</div><div><h4>${ex.name}</h4>
      <div class="exercise-config">
        <label>${ex.type==="time"?"Сек.":"Повт."}<input data-key="${ex.type==="time"?"seconds":"reps"}" type="number" min="1" value="${ex.type==="time"?ex.seconds:ex.reps}"></label>
        <label>Подходы<input data-key="sets" type="number" min="1" max="20" value="${ex.sets}"></label>
        <label>Отдых<input data-key="rest" type="number" min="0" value="${ex.rest}"></label>
      </div></div><button class="remove-btn">×</button>`;
    row.querySelectorAll("input").forEach(inp=>inp.onchange=()=>ex[inp.dataset.key]=Math.max(0,Number(inp.value)||0));
    row.querySelector(".remove-btn").onclick=()=>{builder.exercises.splice(index,1);renderBuilderList()};
    row.ondragstart=e=>e.dataTransfer.setData("text/plain",String(index));
    row.ondragover=e=>e.preventDefault();
    row.ondrop=e=>{
      e.preventDefault();
      const from=Number(e.dataTransfer.getData("text/plain"));
      const [moved]=builder.exercises.splice(from,1);
      builder.exercises.splice(index,0,moved);
      renderBuilderList();
    };
    list.append(row);
  });
}
function saveBuilder(goHome=true){
  if(!builder.name.trim())builder.name="Моя тренировка";
  const copy=JSON.parse(JSON.stringify(builder)); delete copy.index;
  if(Number.isInteger(builder.index))state.workouts[builder.index]=copy; else {
    state.workouts.push(copy); builder.index=state.workouts.length-1;
  }
  saveState();
  if(goHome){route="workout";render()}
}
function startSession(workout){
  if(!workout.exercises?.length)return;
  session={
    workout,exerciseIndex:0,setIndex:0,phase:"work",
    secondsRemaining:workout.exercises[0].type==="time"?workout.exercises[0].seconds:0,
    startedAt:Date.now(),paused:false,totalReps:0
  };
  route="session"; render();
}
function renderSession(app){
  app.append(cloneTemplate("sessionTemplate"));
  updateSessionUI();
  el("pauseWorkoutBtn").onclick=()=>{
    session.paused=!session.paused;
    el("pauseWorkoutBtn").textContent=session.paused?"Продолжить":"Пауза";
  };
  el("completeStepBtn").onclick=completeSessionStep;
  el("finishWorkoutBtn").onclick=()=>finishSession(true);
  clearInterval(sessionTick);
  sessionTick=setInterval(()=>{if(!session?.paused)tickSession()},1000);
}
function currentExercise(){return session.workout.exercises[session.exerciseIndex]}
function tickSession(){
  if(!session)return;
  const ex=currentExercise();
  if(session.phase==="work"&&ex.type==="time"){
    session.secondsRemaining--;
    if(session.secondsRemaining<=0)completeSessionStep();
  } else if(session.phase==="rest"){
    session.secondsRemaining--;
    if(session.secondsRemaining<=0)advanceAfterRest();
  }
  updateSessionUI();
}
function completeSessionStep(){
  const ex=currentExercise();
  if(session.phase==="rest"){advanceAfterRest();return}
  if(ex.type==="reps")session.totalReps+=ex.reps;
  const isLastSet=session.setIndex>=ex.sets-1;
  const isLastExercise=session.exerciseIndex>=session.workout.exercises.length-1;
  if(isLastSet&&isLastExercise){finishSession(false);return}
  session.phase="rest";session.secondsRemaining=ex.rest;
  if(ex.rest<=0)advanceAfterRest();
  updateSessionUI();
}
function advanceAfterRest(){
  const ex=currentExercise();
  if(session.setIndex<ex.sets-1)session.setIndex++;
  else {session.exerciseIndex++;session.setIndex=0}
  session.phase="work";
  const next=currentExercise();
  session.secondsRemaining=next.type==="time"?next.seconds:0;
  updateSessionUI();
}
function updateSessionUI(){
  if(!session||!el("sessionExercise"))return;
  const ex=currentExercise();
  const total=session.workout.exercises.length;
  el("sessionStep").textContent=`Упражнение ${session.exerciseIndex+1} из ${total}`;
  const elapsed=Math.floor((Date.now()-session.startedAt)/1000);
  el("sessionTimer").textContent=formatTime(elapsed);
  if(session.phase==="rest"){
    el("sessionPhase").textContent="Отдых";
    el("sessionExercise").textContent="Следующий подход";
    el("sessionTarget").textContent=session.secondsRemaining;
    el("sessionUnit").textContent="секунд";
    el("sessionSet").textContent=ex.name;
    el("completeStepBtn").textContent="Пропустить";
  }else{
    el("sessionPhase").textContent="Подход";
    el("sessionExercise").textContent=ex.name;
    el("sessionTarget").textContent=ex.type==="time"?session.secondsRemaining:ex.reps;
    el("sessionUnit").textContent=ex.type==="time"?"секунд":"повторений";
    el("sessionSet").textContent=`Подход ${session.setIndex+1} из ${ex.sets}`;
    el("completeStepBtn").textContent="Готово";
  }
}
function finishSession(manual){
  clearInterval(sessionTick);
  const duration=Math.max(1,Math.floor((Date.now()-session.startedAt)/1000));
  const exerciseStats={};
  session.workout.exercises.forEach(ex=>{
    const reps=ex.type==="reps"?ex.reps*ex.sets:0;
    exerciseStats[ex.id]=(exerciseStats[ex.id]||0)+reps;
  });
  const record={
    date:new Date().toISOString(),name:session.workout.name,duration,
    reps:manual?session.totalReps:session.workout.exercises.reduce((s,e)=>s+(e.type==="reps"?e.reps*e.sets:0),0),
    exerciseCount:session.workout.exercises.length,exerciseStats
  };
  state.history.push(record);saveState();
  session.result=record;route="result";render();
}
function renderResult(app){
  app.append(cloneTemplate("resultTemplate"));
  const r=session.result;
  el("resultTitle").textContent=r.name;
  el("resultDuration").textContent=formatTime(r.duration);
  el("resultReps").textContent=r.reps;
  el("resultExercises").textContent=r.exerciseCount;
  el("resultDoneBtn").onclick=()=>{session=null;route="workout";render()};
}
function renderProfile(app){
  app.append(cloneTemplate("profileTemplate"));
  const card=el("profileCard");
  if(state.profile.saved){
    card.innerHTML=`
      <div class="profile-summary">
        <div class="profile-avatar">${escapeHtml((state.profile.name||"M").slice(0,1).toUpperCase())}</div>
        <div>
          <p class="muted small">Имя</p>
          <h3>${escapeHtml(state.profile.name||"Без имени")}</h3>
        </div>
      </div>
      <div class="profile-params">
        <div><span>Рост</span><strong>${state.profile.height?escapeHtml(state.profile.height)+" см":"—"}</strong></div>
        <div><span>Вес</span><strong>${state.profile.weight?escapeHtml(state.profile.weight)+" кг":"—"}</strong></div>
      </div>`;
  } else {
    card.innerHTML=`
      <p class="muted">Заполни профиль один раз. После сохранения изменить данные можно будет в настройках.</p>
      <label class="field profile-first-field">
        <span>Имя</span>
        <input id="profileName" type="text" maxlength="40" placeholder="Твоё имя" />
      </label>
      <div class="two-col">
        <label class="field">
          <span>Рост, см</span>
          <input id="profileHeight" type="number" min="100" max="250" inputmode="numeric" />
        </label>
        <label class="field">
          <span>Вес, кг</span>
          <input id="profileWeight" type="number" min="30" max="300" step="0.1" inputmode="decimal" />
        </label>
      </div>
      <button class="secondary-btn full" id="saveProfileBtn">Сохранить профиль</button>`;
    el("saveProfileBtn").onclick=()=>{
      state.profile={
        name:el("profileName").value.trim(),
        height:el("profileHeight").value,
        weight:el("profileWeight").value,
        saved:true
      };
      saveState();
      render();
    };
  }
  const workouts=state.history.length;
  const reps=state.history.reduce((s,h)=>s+h.reps,0);
  const mins=Math.round(state.history.reduce((s,h)=>s+h.duration,0)/60);
  el("statWorkouts").textContent=workouts;el("statReps").textContent=reps;el("statMinutes").textContent=mins;
  const totals={};
  state.history.forEach(h=>Object.entries(h.exerciseStats||{}).forEach(([id,n])=>totals[id]=(totals[id]||0)+n));
  const box=el("exerciseStats");
  const entries=Object.entries(totals).sort((a,b)=>b[1]-a[1]);
  if(!entries.length)box.innerHTML='<div class="empty">Статистика появится после первой тренировки</div>';
  else entries.forEach(([id,n])=>{
    const ex=catalog.find(x=>x.id===id);
    const row=document.createElement("div");row.className="stat-row";
    row.innerHTML=`<strong>${ex?.name||id}</strong><span>${n} повторений</span>`;box.append(row);
  });
}
function renderSettings(app){
  app.append(cloneTemplate("settingsTemplate"));
  el("editProfileBtn").onclick=()=>{route="profile-edit";render()};
}
function renderProfileEdit(app){
  app.append(cloneTemplate("profileEditTemplate"));
  el("profileName").value=state.profile.name||"";
  el("profileHeight").value=state.profile.height||"";
  el("profileWeight").value=state.profile.weight||"";
  el("cancelProfileEditBtn").onclick=()=>{route="settings";render()};
  el("saveProfileBtn").onclick=()=>{
    state.profile={
      name:el("profileName").value.trim(),
      height:el("profileHeight").value,
      weight:el("profileWeight").value,
      saved:true
    };
    saveState();
    route="profile";
    render();
  };
}
function formatTime(sec){const m=Math.floor(sec/60),s=Math.max(0,sec%60);return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}

document.querySelectorAll(".nav-btn").forEach(btn=>btn.onclick=()=>{
  if(session&&route==="session"&&!confirm("Выйти из активной тренировки?"))return;
  clearInterval(sessionTick);session=null;route=btn.dataset.route;render();
});
el("resetDemoBtn").onclick=()=>{
  if(confirm("Сбросить все локальные данные MASTER?")){state=structuredClone(defaultState);saveState();route="workout";render()}
};
if("serviceWorker" in navigator){
  navigator.serviceWorker.getRegistrations()
    .then(registrations=>Promise.all(registrations.map(registration=>registration.unregister())))
    .catch(()=>{});
}
render();