const CONFIG = window.OELA_CONFIG || {};
const hasSupabaseConfig =
  window.supabase &&
  CONFIG.SUPABASE_URL &&
  !CONFIG.SUPABASE_URL.includes("YOUR-PROJECT") &&
  CONFIG.SUPABASE_ANON_KEY &&
  !CONFIG.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");

const supabaseClient = hasSupabaseConfig
  ? window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)
  : null;

const DEMO = {
  settings: {
    short_name: "OELA",
    full_name: "Our E-sport League Association",
    homepage_title: "OUR E-SPORT LEAGUE ASSOCIATION",
    current_season: "2025–26",
    homepage_description: "OELA가 주관하는 대회의 공식 선수 기록과 규정을 한곳에서 확인하세요."
  },
  competitions: [
    {id:"fpl",code:"FPL",name:"FC Mobile Premier League",display_order:1},
    {id:"ktl",code:"KTL",name:"Korea Tournament League",display_order:2},
    {id:"super",code:"SUPER-CUP",name:"Super-Cup",display_order:3},
    {id:"fecl",code:"FECL",name:"Football e-sport Champions League",display_order:4},
    {id:"fel",code:"FEL",name:"Football e-sport Elite League",display_order:5}
  ],
  seasons: [
    {competition_id:"fpl",season_name:"2025–26"},
    {competition_id:"ktl",season_name:"2025–26"},
    {competition_id:"super",season_name:"2025–26"},
    {competition_id:"fecl",season_name:"2025–26"},
    {competition_id:"fel",season_name:"2025–26"}
  ],
  records: [
    {id:"d1",competition_id:"fpl",season_name:"2025–26",player_name:"Henry",team_name:"KSNB",goals:7,assists:3,yellow_cards:0,red_cards:0},
    {id:"d2",competition_id:"fpl",season_name:"2025–26",player_name:"Ødegaard",team_name:"KSNB",goals:2,assists:5,yellow_cards:0,red_cards:0},
    {id:"d3",competition_id:"fpl",season_name:"2025–26",player_name:"Saka",team_name:"KSNB",goals:4,assists:4,yellow_cards:1,red_cards:0}
  ],
  regulations: [
    {id:"r1",competition_id:"fpl",season_name:"2025–26",title:"제1장 총칙",body:"제1조 목적\n이 규정은 FPL의 공정하고 원활한 운영을 위하여 필요한 사항을 정함을 목적으로 한다.",display_order:1},
    {id:"r2",competition_id:"fpl",season_name:"2025–26",title:"제2장 참가 자격",body:"제4조 참가 자격\n대회의 참가 자격은 OELA가 정한 공식 참가 자격 규정에 따른다.",display_order:2},
    {id:"r3",competition_id:"fpl",season_name:"2025–26",title:"제3장 대회 운영",body:"제7조 경기 운영\n경기 일정과 결과는 OELA가 지정한 공식 경기 기록 시스템을 따른다.",display_order:3}
  ]
};

let state = {
  settings: null, competitions: [], seasons: [], records: [], regulations: [],
  recordComp: "fpl", recordType: "goals", regComp: "fpl", regSearch: "",
  editingRecordId: null, editingRegId: null
};

const $ = (id) => document.getElementById(id);
const esc = (value="") => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const toast = (msg, bad=false) => {
  $("toast").textContent = msg;
  $("toast").classList.remove("hidden","bad");
  if (bad) $("toast").classList.add("bad");
  setTimeout(() => $("toast").classList.add("hidden"), 2800);
};

function demoLoad() {
  const saved = JSON.parse(localStorage.getItem("oela_demo_data") || "null");
  const d = saved || DEMO;
  state.settings = structuredClone(d.settings);
  state.competitions = structuredClone(d.competitions);
  state.seasons = structuredClone(d.seasons);
  state.records = structuredClone(d.records);
  state.regulations = structuredClone(d.regulations);
}

function demoSave() {
  localStorage.setItem("oela_demo_data", JSON.stringify({
    settings: state.settings, competitions: state.competitions,
    seasons: state.seasons, records: state.records, regulations: state.regulations
  }));
}

async function dbSelect(table, queryFn) {
  const {data, error} = await queryFn(supabaseClient.from(table).select("*"));
  if (error) throw error;
  return data || [];
}

async function loadData() {
  if (!supabaseClient || CONFIG.DEMO_MODE) {
    demoLoad();
    return;
  }
  const [settings, competitions, seasons, records, regulations] = await Promise.all([
    dbSelect("site_settings", q => q.eq("id", 1)),
    dbSelect("competitions", q => q.order("display_order")),
    dbSelect("seasons", q => q.order("created_at")),
    dbSelect("player_records", q => q.order("player_name")),
    dbSelect("regulations", q => q.order("display_order"))
  ]);
  state.settings = settings[0] || structuredClone(DEMO.settings);
  state.competitions = competitions;
  state.seasons = seasons;
  state.records = records;
  state.regulations = regulations;
  if (!state.competitions.length) {
    state.competitions = structuredClone(DEMO.competitions);
  }
  state.recordComp = state.competitions[0]?.id || "fpl";
  state.regComp = state.recordComp;
}

function renderBrand() {
  const s = state.settings;
  $("brand-short").textContent = s.short_name;
  $("brand-full").textContent = s.full_name;
  $("heroTitle").innerHTML = esc(s.homepage_title).replace(/\s+/g, "<br>");
  $("heroSeason").textContent = `${s.current_season} SEASON`;
  $("heroDescription").textContent = s.homepage_description || "";
  $("heroBadgeShort").textContent = s.short_name;
  $("footerShort").textContent = s.short_name;
  $("footerFull").textContent = s.full_name;
  document.title = `${s.short_name} — ${s.full_name}`;
}

function renderCompetitions() {
  const list = [...state.competitions].sort((a,b)=>(a.display_order||0)-(b.display_order||0));
  $("competitionGrid").innerHTML = list.map(c => `
    <article class="competition-card" onclick="selectCompetition('${esc(c.id)}')">
      <div><div class="code">${esc(c.code)}</div><small>${esc(c.name)}</small></div>
      <div class="arrow">↗</div>
    </article>`).join("");
}

function renderTabs(containerId, active, setter) {
  $(containerId).innerHTML = state.competitions.map(c =>
    `<button class="${c.id===active?'active':''}" onclick="${setter}('${esc(c.id)}')">${esc(c.code)}</button>`
  ).join("");
}

function seasonsFor(compId) {
  return state.seasons.filter(s => s.competition_id === compId).map(s => s.season_name)
    .filter((x,i,a)=>a.indexOf(x)===i).sort().reverse();
}

function fillSelect(selectId, values, selected) {
  const el = $(selectId);
  el.innerHTML = values.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
  if (values.includes(selected)) el.value = selected;
}

function renderRecords() {
  if (!state.competitions.some(c=>c.id===state.recordComp)) state.recordComp = state.competitions[0]?.id || "fpl";
  renderTabs("recordCompetitionTabs", state.recordComp, "selectRecordCompetition");
  const seasons = seasonsFor(state.recordComp);
  const old = $("recordSeason").value;
  fillSelect("recordSeason", seasons, seasons.includes(old) ? old : seasons[0]);
  const season = $("recordSeason").value;
  const key = state.recordType;
  const label = {goals:"득점",assists:"어시스트",yellow_cards:"옐로카드",red_cards:"레드카드"}[key];
  const rows = state.records
    .filter(r=>r.competition_id===state.recordComp && r.season_name===season)
    .sort((a,b)=>(b[key]||0)-(a[key]||0) || a.player_name.localeCompare(b.player_name));
  $("recordsTable").innerHTML = rows.length ? `
    <table class="records-table">
      <thead><tr><th>#</th><th>선수</th><th>팀</th><th>${label}</th></tr></thead>
      <tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td><b>${esc(r.player_name)}</b></td><td>${esc(r.team_name)}</td><td>${r[key]||0}</td></tr>`).join("")}</tbody>
    </table>` : `<div class="empty">해당 대회의 ${esc(season || "")} 기록이 아직 없습니다.</div>`;
  document.querySelectorAll("#recordTypeTabs button").forEach(b=>b.classList.toggle("active",b.dataset.type===key));
}

function renderRegs() {
  if (!state.competitions.some(c=>c.id===state.regComp)) state.regComp = state.competitions[0]?.id || "fpl";
  renderTabs("regCompetitionTabs", state.regComp, "selectRegCompetition");
  const seasons = seasonsFor(state.regComp);
  const old = $("regSeason").value;
  fillSelect("regSeason", seasons, seasons.includes(old) ? old : seasons[0]);
  const season = $("regSeason").value;
  const q = state.regSearch.trim().toLowerCase();
  const list = state.regulations
    .filter(r=>r.competition_id===state.regComp && r.season_name===season)
    .filter(r=>!q || `${r.title} ${r.body}`.toLowerCase().includes(q))
    .sort((a,b)=>(a.display_order||0)-(b.display_order||0));
  $("regulationsList").innerHTML = list.length ? list.map(x=>`
    <div class="reg-item">
      <button class="reg-head" onclick="this.parentElement.classList.toggle('open')">
        <span>${esc(x.title)}</span><span>+</span>
      </button>
      <div class="reg-body">${esc(x.body)}</div>
    </div>`).join("") : `<div class="empty">해당 조건의 규정이 없습니다.</div>`;
}

function renderAdminSelectors() {
  const comps = [...state.competitions].sort((a,b)=>(a.display_order||0)-(b.display_order||0));
  const options = comps.map(c=>`<option value="${esc(c.id)}">${esc(c.code)}</option>`).join("");
  ["seasonComp","recordComp","regCompAdmin"].forEach(id=>{
    const old = $(id).value;
    $(id).innerHTML = options;
    if (comps.some(c=>c.id===old)) $(id).value=old;
  });
  fillAdminSeasons("recordComp", "recordSeasonAdmin");
  fillAdminSeasons("regCompAdmin", "regSeasonAdmin");
  renderCompetitionAdminList();
  renderSeasonAdminList();
  renderRecordAdminList();
  renderRegulationAdminList();
}

function fillAdminSeasons(compSelectId, seasonSelectId) {
  const compId = $(compSelectId).value || state.competitions[0]?.id;
  const values = seasonsFor(compId);
  fillSelect(seasonSelectId, values, $(seasonSelectId).value);
}

function renderCompetitionAdminList() {
  $("competitionAdminList").innerHTML = state.competitions.map(c=>`
    <div class="admin-list-row">
      <span><b>${esc(c.code)}</b> · ${esc(c.name)} <small>${esc(c.id)}</small></span>
      <button class="text-button danger" onclick="deleteCompetition('${esc(c.id)}')">삭제</button>
    </div>`).join("");
}

function renderSeasonAdminList() {
  $("seasonAdminList").innerHTML = state.competitions.map(c=>{
    const ss=seasonsFor(c.id);
    return `<div class="admin-list-row"><span><b>${esc(c.code)}</b> · ${ss.map(esc).join(", ") || "시즌 없음"}</span></div>`;
  }).join("");
}

function renderRecordAdminList() {
  const compId=$("recordComp").value, season=$("recordSeasonAdmin").value;
  const rows=state.records.filter(r=>r.competition_id===compId&&r.season_name===season)
    .sort((a,b)=>a.player_name.localeCompare(b.player_name));
  $("recordAdminList").innerHTML=rows.map(r=>`
    <div class="admin-list-row">
      <span><b>${esc(r.player_name)}</b> · ${esc(r.team_name)} · ${r.goals}/${r.assists}/${r.yellow_cards}/${r.red_cards}</span>
      <span><button class="text-button" onclick="editRecord('${esc(r.id)}')">수정</button>
      <button class="text-button danger" onclick="deleteRecord('${esc(r.id)}')">삭제</button></span>
    </div>`).join("") || `<div class="empty small">기록 없음</div>`;
}

function renderRegulationAdminList() {
  const compId=$("regCompAdmin").value, season=$("regSeasonAdmin").value;
  const rows=state.regulations.filter(r=>r.competition_id===compId&&r.season_name===season)
    .sort((a,b)=>(a.display_order||0)-(b.display_order||0));
  $("regulationAdminList").innerHTML=rows.map(r=>`
    <div class="admin-list-row">
      <span><b>${esc(r.title)}</b></span>
      <span><button class="text-button" onclick="editRegulation('${esc(r.id)}')">수정</button>
      <button class="text-button danger" onclick="deleteRegulation('${esc(r.id)}')">삭제</button></span>
    </div>`).join("") || `<div class="empty small">규정 없음</div>`;
}

function setAdminView(loggedIn) {
  $("loginView").classList.toggle("hidden", loggedIn);
  $("adminView").classList.toggle("hidden", !loggedIn);
  if (loggedIn) {
    $("adminShort").value=state.settings.short_name;
    $("adminFull").value=state.settings.full_name;
    $("adminTitle").value=state.settings.homepage_title;
    $("adminSeason").value=state.settings.current_season;
    $("adminDescription").value=state.settings.homepage_description||"";
    renderAdminSelectors();
  }
}

async function isLoggedIn() {
  if (!supabaseClient || CONFIG.DEMO_MODE) return true;
  const {data:{session}} = await supabaseClient.auth.getSession();
  return !!session;
}

async function saveSettingsToDB() {
  const payload = {
    id:1, short_name:$("adminShort").value.trim(), full_name:$("adminFull").value.trim(),
    homepage_title:$("adminTitle").value.trim(), current_season:$("adminSeason").value.trim(),
    homepage_description:$("adminDescription").value.trim(), updated_at:new Date().toISOString()
  };
  if (!supabaseClient || CONFIG.DEMO_MODE) {
    state.settings=payload; demoSave(); return;
  }
  const {error}=await supabaseClient.from("site_settings").upsert(payload);
  if(error) throw error;
  state.settings=payload;
}

async function upsertRecord() {
  const payload = {
    competition_id:$("recordComp").value, season_name:$("recordSeasonAdmin").value,
    player_name:$("recordPlayer").value.trim(), team_name:$("recordTeam").value.trim(),
    goals:+$("recordGoals").value||0, assists:+$("recordAssists").value||0,
    yellow_cards:+$("recordYellow").value||0, red_cards:+$("recordRed").value||0,
    updated_at:new Date().toISOString()
  };
  if(!payload.player_name || !payload.team_name) throw new Error("선수명과 팀명을 입력하세요.");
  if(!supabaseClient || CONFIG.DEMO_MODE) {
    const i=state.records.findIndex(r=>r.competition_id===payload.competition_id&&r.season_name===payload.season_name&&r.player_name===payload.player_name);
    if(i>=0) state.records[i]={...state.records[i],...payload}; else state.records.push({id:crypto.randomUUID(),...payload});
    demoSave(); return;
  }
  const {data,error}=await supabaseClient.from("player_records").upsert(payload,{onConflict:"competition_id,season_name,player_name"}).select().single();
  if(error) throw error;
  const i=state.records.findIndex(r=>r.id===data.id);
  if(i>=0) state.records[i]=data; else state.records.push(data);
}

async function upsertRegulation() {
  const compId=$("regCompAdmin").value, season=$("regSeasonAdmin").value;
  const title=$("regTitle").value.trim(), body=$("regBody").value.trim();
  if(!title||!body) throw new Error("제목과 내용을 입력하세요.");
  if(!supabaseClient || CONFIG.DEMO_MODE) {
    const i=state.regulations.findIndex(r=>r.competition_id===compId&&r.season_name===season&&r.title===title);
    if(i>=0) state.regulations[i]={...state.regulations[i],title,body};
    else state.regulations.push({id:crypto.randomUUID(),competition_id:compId,season_name:season,title,body,display_order:state.regulations.length+1});
    demoSave(); return;
  }
  const payload={competition_id:compId,season_name:season,title,body,display_order:state.regulations.length+1,updated_at:new Date().toISOString()};
  const {data,error}=await supabaseClient.from("regulations").upsert(payload,{onConflict:"competition_id,season_name,title"}).select().single();
  if(error) throw error;
  const i=state.regulations.findIndex(r=>r.id===data.id);
  if(i>=0) state.regulations[i]=data; else state.regulations.push(data);
}

async function addCompetition() {
  const id=$("compId").value.trim().toLowerCase(), code=$("compCode").value.trim().toUpperCase(), name=$("compName").value.trim();
  if(!id||!code||!name) throw new Error("대회 ID, 코드, 정식명칭을 모두 입력하세요.");
  const payload={id,code,name,display_order:state.competitions.length+1};
  if(!supabaseClient || CONFIG.DEMO_MODE) {
    if(state.competitions.some(c=>c.id===id||c.code===code)) throw new Error("이미 존재하는 대회입니다.");
    state.competitions.push(payload); state.seasons.push({competition_id:id,season_name:state.settings.current_season}); demoSave(); return;
  }
  const {error}=await supabaseClient.from("competitions").insert(payload); if(error) throw error;
  const {error:e2}=await supabaseClient.from("seasons").insert({competition_id:id,season_name:state.settings.current_season});
  if(e2) throw e2;
  state.competitions.push(payload); state.seasons.push({competition_id:id,season_name:state.settings.current_season});
}

async function addSeason() {
  const competition_id=$("seasonComp").value, season_name=$("seasonName").value.trim();
  if(!season_name) throw new Error("시즌명을 입력하세요.");
  if(seasonsFor(competition_id).includes(season_name)) throw new Error("이미 존재하는 시즌입니다.");
  if(!supabaseClient || CONFIG.DEMO_MODE) {
    state.seasons.push({competition_id,season_name}); demoSave(); return;
  }
  const {error}=await supabaseClient.from("seasons").insert({competition_id,season_name});
  if(error) throw error;
  state.seasons.push({competition_id,season_name});
}

async function deleteCompetition(id) {
  if(!confirm("이 대회를 삭제하면 관련 시즌·기록·규정도 삭제됩니다. 계속할까요?")) return;
  try {
    if(!supabaseClient || CONFIG.DEMO_MODE) {
      state.competitions=state.competitions.filter(c=>c.id!==id);
      state.seasons=state.seasons.filter(s=>s.competition_id!==id);
      state.records=state.records.filter(r=>r.competition_id!==id);
      state.regulations=state.regulations.filter(r=>r.competition_id!==id);
      demoSave();
    } else {
      const {error}=await supabaseClient.from("competitions").delete().eq("id",id); if(error) throw error;
      state.competitions=state.competitions.filter(c=>c.id!==id);
      state.seasons=state.seasons.filter(s=>s.competition_id!==id);
      state.records=state.records.filter(r=>r.competition_id!==id);
      state.regulations=state.regulations.filter(r=>r.competition_id!==id);
    }
    renderAll(); renderAdminSelectors(); toast("대회를 삭제했습니다.");
  } catch(e) { toast(e.message,true); }
}

async function deleteRecord(id) {
  if(!confirm("이 선수 기록을 삭제할까요?")) return;
  try {
    if(!supabaseClient || CONFIG.DEMO_MODE) { state.records=state.records.filter(r=>r.id!==id); demoSave(); }
    else { const {error}=await supabaseClient.from("player_records").delete().eq("id",id); if(error) throw error; state.records=state.records.filter(r=>r.id!==id); }
    renderAll(); renderAdminSelectors(); toast("기록을 삭제했습니다.");
  } catch(e) { toast(e.message,true); }
}

async function deleteRegulation(id) {
  if(!confirm("이 규정을 삭제할까요?")) return;
  try {
    if(!supabaseClient || CONFIG.DEMO_MODE) { state.regulations=state.regulations.filter(r=>r.id!==id); demoSave(); }
    else { const {error}=await supabaseClient.from("regulations").delete().eq("id",id); if(error) throw error; state.regulations=state.regulations.filter(r=>r.id!==id); }
    renderAll(); renderAdminSelectors(); toast("규정을 삭제했습니다.");
  } catch(e) { toast(e.message,true); }
}

function editRecord(id) {
  const r=state.records.find(x=>x.id===id); if(!r) return;
  $("recordComp").value=r.competition_id; fillAdminSeasons("recordComp","recordSeasonAdmin");
  $("recordSeasonAdmin").value=r.season_name; $("recordPlayer").value=r.player_name; $("recordTeam").value=r.team_name;
  $("recordGoals").value=r.goals; $("recordAssists").value=r.assists; $("recordYellow").value=r.yellow_cards; $("recordRed").value=r.red_cards;
  state.editingRecordId=id;
  $("recordPlayer").focus();
}

function editRegulation(id) {
  const r=state.regulations.find(x=>x.id===id); if(!r) return;
  $("regCompAdmin").value=r.competition_id; fillAdminSeasons("regCompAdmin","regSeasonAdmin");
  $("regSeasonAdmin").value=r.season_name; $("regTitle").value=r.title; $("regBody").value=r.body;
  state.editingRegId=id; $("regTitle").focus();
}

function clearRecordForm() {
  state.editingRecordId=null; $("recordPlayer").value=""; $("recordTeam").value="";
  $("recordGoals").value=0; $("recordAssists").value=0; $("recordYellow").value=0; $("recordRed").value=0;
}
function clearRegForm() {
  state.editingRegId=null; $("regTitle").value=""; $("regBody").value="";
}

function renderAll() { renderBrand(); renderCompetitions(); renderRecords(); renderRegs(); }

window.selectCompetition=(id)=>{state.recordComp=id;state.regComp=id;location.hash="records";renderRecords();renderRegs();};
window.selectRecordCompetition=(id)=>{state.recordComp=id;renderRecords();};
window.selectRegCompetition=(id)=>{state.regComp=id;renderRegs();};
window.deleteCompetition=deleteCompetition;
window.deleteRecord=deleteRecord;
window.deleteRegulation=deleteRegulation;
window.editRecord=editRecord;
window.editRegulation=editRegulation;

$("recordSeason").addEventListener("change",renderRecords);
$("regSeason").addEventListener("change",renderRegs);
$("regSearch").addEventListener("input",e=>{state.regSearch=e.target.value;renderRegs();});
document.querySelectorAll("#recordTypeTabs button").forEach(b=>b.addEventListener("click",()=>{state.recordType=b.dataset.type;renderRecords();}));

$("recordComp").addEventListener("change",()=>{fillAdminSeasons("recordComp","recordSeasonAdmin");renderRecordAdminList();});
$("recordSeasonAdmin").addEventListener("change",renderRecordAdminList);
$("regCompAdmin").addEventListener("change",()=>{fillAdminSeasons("regCompAdmin","regSeasonAdmin");renderRegulationAdminList();});
$("regSeasonAdmin").addEventListener("change",renderRegulationAdminList);

$("settingsForm").addEventListener("submit",async e=>{
  e.preventDefault(); try { await saveSettingsToDB(); renderAll(); toast("사이트 설정을 저장했습니다."); } catch(err){ toast(err.message,true); }
});
$("competitionForm").addEventListener("submit",async e=>{
  e.preventDefault(); try { await addCompetition(); $("compId").value="";$("compCode").value="";$("compName").value="";renderAll();renderAdminSelectors();toast("대회를 추가했습니다."); } catch(err){toast(err.message,true);}
});
$("seasonForm").addEventListener("submit",async e=>{
  e.preventDefault(); try { await addSeason(); $("seasonName").value="";renderAll();renderAdminSelectors();toast("시즌을 추가했습니다."); } catch(err){toast(err.message,true);}
});
$("recordForm").addEventListener("submit",async e=>{
  e.preventDefault(); try { await upsertRecord(); clearRecordForm(); renderAll();renderAdminSelectors();toast("선수 기록을 저장했습니다."); } catch(err){toast(err.message,true);}
});
$("regulationForm").addEventListener("submit",async e=>{
  e.preventDefault(); try { await upsertRegulation(); clearRegForm(); renderAll();renderAdminSelectors();toast("규정을 저장했습니다."); } catch(err){toast(err.message,true);}
});
$("clearRecordForm").onclick=clearRecordForm;
$("clearRegForm").onclick=clearRegForm;
$("reloadAdmin").onclick=async()=>{try{await loadData();renderAll();renderAdminSelectors();toast("데이터를 새로 불러왔습니다.");}catch(e){toast(e.message,true);}};

$("adminOpen").onclick=async()=>{
  $("adminModal").classList.remove("hidden"); $("adminModal").setAttribute("aria-hidden","false");
  const logged=await isLoggedIn(); setAdminView(logged);
};
$("adminClose").onclick=()=>{$("adminModal").classList.add("hidden");$("adminModal").setAttribute("aria-hidden","true");};
$("adminModal").addEventListener("click",e=>{if(e.target.id==="adminModal"){$("adminModal").classList.add("hidden");$("adminModal").setAttribute("aria-hidden","true");}});

$("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  if(!supabaseClient || CONFIG.DEMO_MODE){ setAdminView(true); return; }
  $("loginMessage").textContent="로그인 중…";
  const {error}=await supabaseClient.auth.signInWithPassword({email:$("loginEmail").value.trim(),password:$("loginPassword").value});
  if(error){$("loginMessage").textContent=error.message;return;}
  $("loginMessage").textContent=""; setAdminView(true);
});
$("logoutButton").onclick=async()=>{
  if(supabaseClient && !CONFIG.DEMO_MODE) await supabaseClient.auth.signOut();
  setAdminView(false);
};

if(supabaseClient && !CONFIG.DEMO_MODE){
  supabaseClient.auth.onAuthStateChange((_event, session)=>setAdminView(!!session));
}

(async()=>{
  try {
    await loadData();
    renderAll();
  } catch(e) {
    console.error(e);
    demoLoad();
    renderAll();
    toast("서버 데이터를 불러오지 못해 데모 모드로 표시합니다.", true);
  }
})();
