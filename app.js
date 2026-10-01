const STORAGE_KEY="master_app_v1";

const catalog=[
  {id:"pushups",category:"arms",name:"Отжимания",type:"reps",defaultReps:12,description:"Обычные отжимания от пола."},
  {id:"knee_pushups",category:"arms",name:"Отжимания с колен",type:"reps",defaultReps:12,description:"Более лёгкий вариант отжиманий."},
  {id:"wide_pushups",category:"arms",name:"Широкие отжимания",type:"reps",defaultReps:10,description:"Ладони шире плеч."},
  {id:"narrow_pushups",category:"arms",name:"Узкие отжимания",type:"reps",defaultReps:8,description:"Ладони ближе к корпусу."},
  {id:"wall_pushups",category:"arms",name:"Отжимания от стены",type:"reps",defaultReps:15,description:"Самый простой вариант отжиманий."},

  {id:"squats",category:"legs",name:"Приседания",type:"reps",defaultReps:15,description:"Классические приседания."},
  {id:"forward_lunges",category:"legs",name:"Выпады вперёд",type:"reps",defaultReps:10,description:"Поочерёдные выпады на каждую ногу."},
  {id:"reverse_lunges",category:"legs",name:"Выпады назад",type:"reps",defaultReps:10,description:"Шаг назад и возврат в исходное положение."},
  {id:"glute_bridge",category:"legs",name:"Ягодичный мост",type:"reps",defaultReps:15,description:"Подъём таза лёжа на спине."},
  {id:"calf_raises",category:"legs",name:"Подъёмы на носки",type:"reps",defaultReps:20,description:"Подъём на носки стоя."},

  {id:"crunches",category:"abs",name:"Скручивания",type:"reps",defaultReps:20,description:"Классическое упражнение на пресс."},
  {id:"leg_raises",category:"abs",name:"Подъёмы ног лёжа",type:"reps",defaultReps:12,description:"Поднимай прямые или слегка согнутые ноги."},
  {id:"bicycle",category:"abs",name:"Велосипед",type:"reps",defaultReps:20,description:"Поочерёдное движение локоть-колено."},
  {id:"plank",category:"abs",name:"Планка",type:"time",defaultSeconds:40,description:"Удержание корпуса в упоре."},
  {id:"heel_touches",category:"abs",name:"Касания пяток",type:"reps",defaultReps:20,description:"Лёжа, поочерёдно тянись рукой к пятке."},

  {id:"jumping_jacks",category:"cardio",name:"Прыжки ноги вместе-врозь",type:"time",defaultSeconds:40,description:"Простое кардио на месте."},
  {id:"running_place",category:"cardio",name:"Бег на месте",type:"time",defaultSeconds:45,description:"Лёгкий бег без перемещения."},
  {id:"high_knees",category:"cardio",name:"Бег с высокими коленями",type:"time",defaultSeconds:35,description:"Поднимай колени выше обычного."},
  {id:"small_jumps",category:"cardio",name:"Прыжки на месте",type:"time",defaultSeconds:30,description:"Небольшие пружинистые прыжки."},
  {id:"mountain_climbers",category:"cardio",name:"Альпинист",type:"time",defaultSeconds:30,description:"Поочерёдно подтягивай колени в упоре лёжа."},

  {id:"toe_touch_standing",category:"stretch",name:"Наклон к ногам стоя",type:"time",defaultSeconds:30,description:"Мягко тянись руками к стопам."},
  {id:"toe_touch_sitting",category:"stretch",name:"Наклон к ногам сидя",type:"time",defaultSeconds:30,description:"Сиди с прямыми ногами и тянись вперёд."},
  {id:"quad_stretch",category:"stretch",name:"Растяжка бедра стоя",type:"time",defaultSeconds:30,description:"Подтяни стопу к ягодице."},
  {id:"shoulder_stretch",category:"stretch",name:"Растяжка плеча",type:"time",defaultSeconds:30,description:"Прижми прямую руку к груди."},
  {id:"child_pose",category:"stretch",name:"Растяжка спины",type:"time",defaultSeconds:40,description:"Сядь на пятки и тяни руки вперёд."}
];

const catalogCategories=[
  {id:"arms",name:"Руки",icon:"💪",description:"Руки, плечи и верх корпуса"},
  {id:"legs",name:"Ноги",icon:"🦵",description:"Бёдра, ягодицы и икры"},
  {id:"abs",name:"Пресс",icon:"◫",description:"Корпус и стабилизация"},
  {id:"cardio",name:"Кардио",icon:"♥",description:"Пульс, выносливость и координация"},
  {id:"stretch",name:"Растяжка",icon:"↔",description:"Мобильность и восстановление"}
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
      <div class="workout-actions"><button class="mini-btn" data-edit aria-label="Редактировать">✎</button><button class="mini-btn" data-start aria-label="Начать">▶</button><button class="mini-btn delete-template-btn" data-delete aria-label="Удалить">×</button></div>`;
    card.querySelector("[data-edit]").onclick=()=>{builder=JSON.parse(JSON.stringify(w));builder.index=index;route="builder";render()};
    card.querySelector("[data-start]").onclick=()=>startSession(JSON.parse(JSON.stringify(w)));
    card.querySelector("[data-delete]").onclick=()=>{
      if(!confirm(`Удалить шаблон «${w.name}»?`))return;
      state.workouts.splice(index,1);
      saveState();
      render();
    };
    list.append(card);
  });
}
function renderBuilder(app){
  app.append(cloneTemplate("builderTemplate"));
  el("workoutName").value=builder.name;
  el("workoutName").oninput=e=>builder.name=e.target.value;
  el("backBtn").onclick=()=>{route="workout";render()};
  renderExerciseCatalog();

  renderBuilderList();
  el("saveWorkoutBtn").onclick=saveBuilder;
  el("startWorkoutBtn").onclick=()=>{
    if(!builder.exercises.length){alert("Добавь хотя бы одно упражнение");return}
    saveBuilder(false); startSession(JSON.parse(JSON.stringify(builder)));
  };
}
function renderExerciseCatalog(){
  const cat=el("exerciseCatalog");
  cat.innerHTML="";
  catalogCategories.forEach((category,index)=>{
    const section=document.createElement("div");
    section.className="catalog-category";
    section.innerHTML=`
      <button class="category-header" type="button">
        <div class="category-title-wrap">
          <span class="category-icon">${category.icon}</span>
          <div>
            <strong>${category.name}</strong>
            <span>${category.description}</span>
          </div>
        </div>
        <span class="category-chevron">${index===0?"−":"+"}</span>
      </button>
      <div class="category-content ${index===0?"open":""}"></div>
    `;
    const content=section.querySelector(".category-content");
    catalog.filter(ex=>ex.category===category.id).forEach(ex=>{
      const card=document.createElement("button");
      card.className="exercise-option";
      card.type="button";
      card.innerHTML=`
        <div>
          <strong>${ex.name}</strong>
          <span>${ex.description}</span>
        </div>
        <div class="exercise-option-meta">
          <small>${ex.type==="time"?(ex.defaultSeconds+" сек"):(ex.defaultReps+" повт.")}</small>
          <b>+</b>
        </div>
      `;
      card.onclick=()=>{addExercise(ex);renderBuilderList()};
      content.append(card);
    });
    section.querySelector(".category-header").onclick=()=>{
      const isOpen=content.classList.toggle("open");
      section.querySelector(".category-chevron").textContent=isOpen?"−":"+";
    };
    cat.append(section);
  });
}
function addExercise(ex){
  builder.exercises.push({
    uid:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),
    id:ex.id,name:ex.name,type:ex.type,
    reps:ex.defaultReps||0,seconds:ex.defaultSeconds||30,
    sets:ex.category==="stretch"?1:3,
    rest:ex.category==="stretch"?15:(ex.category==="cardio"?30:45),
    category:ex.category
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