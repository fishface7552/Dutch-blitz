import { useState, useEffect } from "react";

const STORAGE_PROFILES = "db_profiles";
const STORAGE_HISTORY  = "db_history";
const STORAGE_SETTINGS = "db_settings";
const STORAGE_SCORING_METHOD = "db_scoring_method";

if (!document.getElementById("db-global-styles")) {
  const s = document.createElement("style");
  s.id = "db-global-styles";
  s.textContent = `
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; overflow-x: hidden; width: 100%; }
    body { -webkit-text-size-adjust: 100%; }
    input, button { font-family: inherit; }
  `;
  document.head.appendChild(s);
}

function genId() { return Math.random().toString(36).slice(2, 9); }

const COLORS = ["#54A0FF","#FF6584","#43D9A3","#FF9F43","#6C63FF","#FF6B6B","#A29BFE","#00D2D3","#FD79A8","#55EFC4"];
const LIGHT = { bg:"#F0F6FF", surface:"#FFFFFF", surfaceAlt:"#E6F0FF", border:"#C5DCFF", text:"#0D1F3C", sub:"#4A6FA5", muted:"#8AAED4", accent:"#2979FF", accentBg:"#E3EEFF" };
const DARK  = { bg:"#0D1117", surface:"#161D2B", surfaceAlt:"#1C2638", border:"#243044", text:"#E8F0FF", sub:"#7A9CC4", muted:"#3D5A80", accent:"#4D9EFF", accentBg:"#102040" };

async function ls(key) { try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; } catch { return null; } }
async function ss(key, val) { try { await window.storage.set(key, JSON.stringify(val)); } catch { /* storage can be unavailable in preview */ } }

function GearIcon({ size=20, color="currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>;
}

function ConfirmModal({ message, onConfirm, onCancel, C }) {
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:24}}>
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"1.5rem",maxWidth:340,width:"100%"}}>
      <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:8}}>Are you sure?</div>
      <div style={{fontSize:13,color:C.sub,lineHeight:1.6,marginBottom:20}}>{message}</div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={onCancel} style={{flex:1,padding:"9px",borderRadius:10,border:`1px solid ${C.border}`,background:"transparent",color:C.sub,fontSize:14,cursor:"pointer",fontWeight:600}}>Cancel</button>
        <button onClick={onConfirm} style={{flex:1,padding:"9px",borderRadius:10,border:"none",background:"#FF6B6B",color:"#fff",fontSize:14,cursor:"pointer",fontWeight:700}}>Delete</button>
      </div>
    </div>
  </div>;
}

function RoundLogTable({ rounds, players, scores, C, onEditRound }) {
  const cols = `40px repeat(${players.length},minmax(0,1fr))${onEditRound?" 52px":""}`;
  return <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden",width:"100%"}}>
    <p style={{fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:1.2,padding:"12px 14px 8px",margin:0}}>Round history</p>
    <div style={{display:"grid",gridTemplateColumns:cols,borderBottom:`1px solid ${C.border}`}}>
      <div style={{padding:"6px 8px",fontSize:11,color:C.muted,fontWeight:700}}>#</div>
      {players.map(p=><div key={p.id} style={{padding:"6px 4px",fontSize:11,color:p.color,fontWeight:700,textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>)}
      {onEditRound&&<div />}
    </div>
    {[...rounds].reverse().map((r,ri)=>{
      const roundIndex = rounds.length - 1 - ri;
      return (
      <div key={ri} style={{display:"grid",gridTemplateColumns:cols,borderBottom:ri<rounds.length-1?`1px solid ${C.border}`:"none",background:ri%2===0?"transparent":C.surfaceAlt+"55"}}>
        <div style={{padding:"8px 8px",fontSize:12,color:C.muted,fontWeight:600}}>{roundIndex+1}</div>
        {players.map((p,i)=><div key={p.id} style={{padding:"8px 2px",textAlign:"center",fontSize:13,fontWeight:700,color:r.scores[i]>=0?"#43D9A3":"#FF6B6B"}}>
          {r.scores[i]>=0?"+":""}{r.scores[i]}{r.blitzers[i]?" ⚡":""}
        </div>)}
        {onEditRound&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"4px"}}>
          <button onClick={()=>onEditRound(roundIndex)} style={{width:34,height:28,borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",color:C.sub,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <i className="ti ti-edit" style={{fontSize:14}}></i>
          </button>
        </div>}
      </div>
    );})}
    <div style={{display:"grid",gridTemplateColumns:cols,borderTop:`2px solid ${C.border}`,background:C.surfaceAlt}}>
      <div style={{padding:"8px 8px",fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase"}}>∑</div>
      {players.map((p,i)=><div key={p.id} style={{padding:"8px 2px",textAlign:"center",fontSize:14,fontWeight:800,color:C.text}}>{scores[i]}</div>)}
      {onEditRound&&<div />}
    </div>
  </div>;
}

export default function App() {
  const [tab, setTab] = useState("play");
  const [profiles, setProfiles] = useState([]);
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState({ theme:"dark" });
  const [loaded, setLoaded] = useState(false);
  const [confirmDeletePlayer, setConfirmDeletePlayer] = useState(null);
  const [scoringMethod, setScoringMethod] = useState("cards");

  useEffect(() => {
    (async () => {
      const p = await ls(STORAGE_PROFILES);
      const h = await ls(STORAGE_HISTORY);
      const s = await ls(STORAGE_SETTINGS);
      if (p) setProfiles(p);
      if (h) setHistory(h);
      if (s) setSettings(s);
      const sm = await ls(STORAGE_SCORING_METHOD);
if (sm) setScoringMethod(sm);
      setLoaded(true);
    })();
  }, []);

  async function saveProfiles(p) { setProfiles(p); await ss(STORAGE_PROFILES, p); }
  async function saveHistory(h) { setHistory(h); await ss(STORAGE_HISTORY, h); }
  async function saveSettings(s) { setSettings(s); await ss(STORAGE_SETTINGS, s); }
  async function saveScoringMethod(m) { setScoringMethod(m); await ss(STORAGE_SCORING_METHOD, m); }

  async function onGameEnd(game) {
    const newHistory = [game, ...history];
    await saveHistory(newHistory);
    const newProfiles = profiles.map(p => {
      const pl = game.players.find(x => x.profileId === p.id);
      if (!pl) return p;
      return { ...p, gamesPlayed:(p.gamesPlayed||0)+1, totalPoints:(p.totalPoints||0)+pl.finalScore, wins:(p.wins||0)+(game.winnerId===p.id?1:0), blitzes:(p.blitzes||0)+(pl.blitzes||0), roundsPlayed:(p.roundsPlayed||0)+game.rounds };
    });
    await saveProfiles(newProfiles);
  }

  const C = settings.theme === "dark" ? DARK : LIGHT;
  const inp = { background:C.surfaceAlt, border:`1px solid ${C.border}`, color:C.text, borderRadius:10, padding:"8px 10px", fontSize:14, outline:"none", width:"100%" };

  if (!loaded) return <div style={{padding:"2rem",color:C.sub,fontSize:14,background:C.bg,minHeight:"100dvh"}}>Loading...</div>;

  return (
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",width:"100%",background:C.bg,minHeight:"100dvh",color:C.text,overflowX:"hidden",display:"flex",flexDirection:"column"}}>
      {confirmDeletePlayer && <ConfirmModal
        message={`Deleting "${confirmDeletePlayer.name}" will permanently remove all their stats and cannot be undone.`}
        onConfirm={() => { saveProfiles(profiles.filter(x => x.id !== confirmDeletePlayer.id)); setConfirmDeletePlayer(null); }}
        onCancel={() => setConfirmDeletePlayer(null)}
        C={C}
      />}

      {/* Header */}
      <div style={{padding:"16px 16px 0",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <span style={{fontSize:22,fontWeight:800,letterSpacing:-0.5,background:`linear-gradient(135deg,${C.accent},#54C8FF)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",display:"inline-block"}}>Dutch Blitz</span>
        <button onClick={() => setTab(tab==="settings"?"play":"settings")} style={{background:tab==="settings"?C.accentBg:"transparent",border:`1px solid ${tab==="settings"?C.accent:C.border}`,borderRadius:10,padding:"7px 9px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <GearIcon size={18} color={tab==="settings"?C.accent:C.sub}/>
        </button>
      </div>

      {/* Tabs */}
      {tab !== "settings" && <div style={{display:"flex",margin:"12px 16px 0",background:C.surface,borderRadius:14,padding:4,border:`1px solid ${C.border}`,flexShrink:0}}>
        {[["play","ti-cards","Play"],["history","ti-history","History"],["players","ti-users","Players"]].map(([t,ic,label]) => (
          <button key={t} onClick={() => setTab(t)} style={{flex:1,padding:"9px 4px",background:tab===t?C.accentBg:"transparent",border:"none",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:tab===t?700:400,color:tab===t?C.accent:C.sub,display:"flex",alignItems:"center",justifyContent:"center",gap:5,transition:"all 0.15s"}}>
            <i className={`ti ${ic}`} style={{fontSize:14}}></i>{label}
          </button>
        ))}
      </div>}

      {/* Content */}
      <div style={{padding:"14px 16px",flex:1,overflowY:"auto"}}>
        <div style={{display:tab==="play"?"block":"none"}}><PlayTab profiles={profiles} onGameEnd={onGameEnd} C={C} inp={inp} scoringMethod={scoringMethod} saveScoringMethod={saveScoringMethod}/></div>
        <div style={{display:tab==="history"?"block":"none"}}><HistoryTab history={history} profiles={profiles} C={C} saveHistory={saveHistory}/></div>
        <div style={{display:tab==="players"?"block":"none"}}><PlayersTab profiles={profiles} saveProfiles={saveProfiles} C={C} inp={inp} onDeletePlayer={setConfirmDeletePlayer}/></div>
        <div style={{display:tab==="settings"?"block":"none"}}><SettingsTab settings={settings} saveSettings={saveSettings} C={C} profiles={profiles} onDeletePlayer={setConfirmDeletePlayer}/></div>
      </div>
    </div>
  );
}

/* ── Settings ─────────────────────────────────────────────── */
function SettingsTab({ settings, saveSettings, C, profiles, onDeletePlayer }) {
  const [playersOpen, setPlayersOpen] = useState(false);
  return <div>
    <p style={{fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Settings</p>

    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,marginBottom:12}}>
      <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:14,fontWeight:600,color:C.text}}>Theme</div>
          <div style={{fontSize:12,color:C.sub,marginTop:2}}>Choose your preferred look</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[["light","☀️"],["dark","🌙"]].map(([t,icon]) => (
            <button key={t} onClick={() => saveSettings({...settings,theme:t})} style={{padding:"6px 12px",borderRadius:9,border:`1px solid ${settings.theme===t?C.accent:C.border}`,background:settings.theme===t?C.accentBg:"transparent",color:settings.theme===t?C.accent:C.sub,fontSize:13,cursor:"pointer",fontWeight:settings.theme===t?700:400}}>
              {icon} {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>

    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,marginBottom:12,overflow:"hidden"}}>
      <button onClick={() => setPlayersOpen(o=>!o)} style={{width:"100%",padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"transparent",border:"none",cursor:"pointer"}}>
        <div style={{textAlign:"left"}}>
          <div style={{fontSize:14,fontWeight:600,color:C.text}}>Delete players</div>
          <div style={{fontSize:12,color:C.sub,marginTop:2}}>{profiles.length} saved player{profiles.length!==1?"s":""}</div>
        </div>
        <i className={`ti ti-chevron-${playersOpen?"up":"down"}`} style={{fontSize:16,color:C.muted}}></i>
      </button>
      {playersOpen && <div style={{borderTop:`1px solid ${C.border}`}}>
        {profiles.length===0 && <div style={{padding:"14px 16px",fontSize:13,color:C.muted}}>No saved players.</div>}
        {profiles.map((p,i) => (
          <div key={p.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 16px",borderBottom:i<profiles.length-1?`1px solid ${C.border}`:"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,${p.color},${p.color}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",flexShrink:0}}>{p.name[0].toUpperCase()}</div>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:C.text}}>{p.name}</div>
                <div style={{fontSize:11,color:C.muted}}>{p.gamesPlayed||0} games · {p.wins||0} wins</div>
              </div>
            </div>
            <button onClick={() => onDeletePlayer(p)} style={{background:"none",border:`1px solid #FF6B6B66`,borderRadius:8,cursor:"pointer",color:"#FF6B6B",padding:"6px 9px",display:"flex",alignItems:"center"}}>
              <i className="ti ti-trash" style={{fontSize:15}}></i>
            </button>
          </div>
        ))}
      </div>}
    </div>

    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",marginBottom:12}}>
      <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:6}}>Scoring rules</div>
      <div style={{fontSize:13,color:C.sub,lineHeight:1.8}}>
        +1 pt per card played to the centre piles<br/>
        −2 pts per card remaining in hand<br/>
        ⚡ Blitz = going out first — tracked only, no score change<br/>
        First to reach the target score wins
      </div>
    </div>

    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px"}}>
      <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:4}}>About</div>
      <div style={{fontSize:13,color:C.sub,lineHeight:1.6}}>Dutch Blitz Score Tracker — supports any number of players including expansion packs.</div>
    </div>
  </div>;
}

/* ── Play ─────────────────────────────────────────────────── */
function PlayTab({ profiles, onGameEnd, C, inp, scoringMethod, saveScoringMethod }) {
  const [phase, setPhase] = useState("setup");
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [target, setTarget] = useState(75);
  const [scores, setScores] = useState([]);
  const [roundHistory, setRoundHistory] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [entries, setEntries] = useState([]);
  const [editingRound, setEditingRound] = useState(null);
  const [guestName, setGuestName] = useState("");
  const [gameMethod, setGameMethod] = useState(scoringMethod);
  const blitzCount = entries.filter(e=>e?.blitz).length;
  const canSaveRound = blitzCount === 1;

  function toggleProfile(p) {
    if (selectedPlayers.find(s=>s.id===p.id)) setSelectedPlayers(selectedPlayers.filter(s=>s.id!==p.id));
    else setSelectedPlayers([...selectedPlayers,{id:p.id,name:p.name,color:p.color,profileId:p.id,isGuest:false}]);
  }
  function addGuest() {
    if (!guestName.trim()) return;
    setSelectedPlayers([...selectedPlayers,{id:"guest_"+genId(),name:guestName.trim(),color:COLORS[selectedPlayers.length%COLORS.length],profileId:null,isGuest:true}]);
    setGuestName("");
  }
  function startGame() {
    if (selectedPlayers.length<2) return;
    setScores(selectedPlayers.map(()=>0));
    setRoundHistory([]); setGameOver(false); setWinner(null); setEditingRound(null);
    setEntries(selectedPlayers.map(()=>({cp:"0",ch:"0",blitz:false})));
    setPhase("game");
    setGameMethod(scoringMethod);
  }
  function clampInput(value, max) {
    if (value==="") return "";
    const n = Math.max(-20, Math.min(max, parseInt(value)||0));
    return String(n);
  }
  function normalizeBlitz(nextEntries) {
    const zeroHands = nextEntries
      .map((e,i)=>e?.ch==="0"?i:null)
      .filter(i=>i!==null);
    if (zeroHands.length===1) {
      return nextEntries.map((e,i)=>({...e,blitz:i===zeroHands[0]}));
    }
    if (zeroHands.length>1) {
      return nextEntries.map(e=>({...e,blitz:false}));
    }
    return nextEntries;
  }
  function upd(i,f,v){
    let e=[...entries];
    if (f==="blitz") {
      e=e.map((entry,idx)=>({...entry,blitz:idx===i ? !entry?.blitz : false}));
    } else {
      const max = f==="ch" ? 10 : 40;
      e[i]={...e[i],[f]:clampInput(v,max)};
      if (f==="ch") e=normalizeBlitz(e);
    }
    setEntries(e);
  }
  function calcPts(i){
  if (gameMethod==="manual") return parseInt(entries[i]?.cp)||0;
  return (parseInt(entries[i]?.cp)||0)-((parseInt(entries[i]?.ch)||0)*2);
 }
  function totalScores(history) {
    return selectedPlayers.map((_,i)=>history.reduce((sum,r)=>sum+(r.scores[i]||0),0));
  }
  function winnerFrom(scoreList) {
    if (!scoreList.some(s=>s>=target)) return null;
    return scoreList.reduce((a,_,i)=>scoreList[i]>scoreList[a]?i:a,0);
  }
  function syncGameState(history) {
    const nextScores = totalScores(history);
    setRoundHistory(history);
    setScores(nextScores);
    setWinner(winnerFrom(nextScores));
  }
  function currentRound() {
    const roundEntries = selectedPlayers.map((_,i)=>({
      cp: parseInt(entries[i]?.cp)||0,
      ch: parseInt(entries[i]?.ch)||0,
      blitz: !!entries[i]?.blitz
    }));
    return {
      scores: roundEntries.map(e=>e.cp-(e.ch*2)),
      blitzers: roundEntries.map(e=>e.blitz?1:0),
      entries: roundEntries
    };
  }
  function submitRound() {
    if (!canSaveRound) return;
    const round = currentRound();
    const newHistory = editingRound===null ? [...roundHistory,round] : roundHistory.map((r,i)=>i===editingRound?round:r);
    syncGameState(newHistory);
    setEntries(selectedPlayers.map(()=>({cp:"0",ch:"0",blitz:false})));
    setEditingRound(null);
  }
  function editRound(index) {
    const round = roundHistory[index];
    if (!round || gameOver) return;
    setEntries(selectedPlayers.map((_,i)=>{
      const saved = round.entries?.[i];
      if (saved) return { cp:String(saved.cp), ch:String(saved.ch), blitz:!!saved.blitz };
      return { cp:String(round.scores[i]||0), ch:"0", blitz:!!round.blitzers[i] };
    }));
    setEditingRound(index);
  }
  function cancelEdit() {
    setEntries(selectedPlayers.map(()=>({cp:"0",ch:"0",blitz:false})));
    setEditingRound(null);
  }
  function finishGame() {
    const finalWinner = winnerFrom(scores);
    if (finalWinner===null || gameOver) return;
    setGameOver(true);
    setWinner(finalWinner);
    onGameEnd({id:genId(),date:new Date().toISOString(),target,
      players:selectedPlayers.map((p,i)=>({...p,finalScore:scores[i],blitzes:roundHistory.reduce((sum,r)=>sum+(r.blitzers[i]||0),0)})),
      roundLog:roundHistory,winnerId:selectedPlayers[finalWinner].profileId,winnerName:selectedPlayers[finalWinner].name,rounds:roundHistory.length, scoringMethod:gameMethod});
  }
  function undoRound() {
    if (!roundHistory.length) return;
    const newHistory = roundHistory.slice(0,-1);
    syncGameState(newHistory);
    cancelEdit();
  }
  function newGame(){setPhase("setup");setSelectedPlayers([]);setEditingRound(null);}

  if (phase==="setup") return <div>
    {profiles.length>0 && <>
      <p style={{fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>Saved Players</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
        {profiles.map(p=>{const sel=!!selectedPlayers.find(s=>s.id===p.id);return(
          <button key={p.id} onClick={()=>toggleProfile(p)} style={{padding:"7px 16px",borderRadius:20,border:`1.5px solid ${sel?p.color:C.border}`,background:sel?p.color+"33":"transparent",color:sel?p.color:C.sub,fontSize:13,cursor:"pointer",fontWeight:sel?700:400}}>{p.name}</button>
        );})}
      </div>
    </>}
    <p style={{fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>Add Guest</p>
    <div style={{display:"flex",gap:8,marginBottom:20}}>
      <input value={guestName} onChange={e=>setGuestName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addGuest()} placeholder="Guest name" style={inp}/>
      <button onClick={addGuest} disabled={!guestName.trim()} style={{padding:"8px 16px",borderRadius:10,background:C.accentBg,border:`1px solid ${C.accent}`,color:C.accent,fontSize:14,cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>Add</button>
    </div>
    {selectedPlayers.length>0 && <>
      <p style={{fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>Playing</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
        {selectedPlayers.map(p=>(
          <div key={p.id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px 6px 14px",borderRadius:20,background:p.color+"22",border:`1.5px solid ${p.color}`}}>
            <span style={{fontSize:13,color:p.color,fontWeight:700}}>{p.name}</span>
            <button onClick={()=>setSelectedPlayers(selectedPlayers.filter(s=>s.id!==p.id))} style={{background:"none",border:"none",cursor:"pointer",color:p.color,padding:0,lineHeight:1,display:"flex"}}><i className="ti ti-x" style={{fontSize:13}}></i></button>
          </div>
        ))}
      </div>
    </>}
    <div style={{background:C.surface,borderRadius:14,padding:"14px",marginBottom:20,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12}}>
      <span style={{fontSize:13,color:C.sub,fontWeight:600}}>Target score</span>
      <input type="number" inputMode="numeric" value={target} onChange={e=>setTarget(parseInt(e.target.value)||75)} min={10} max={999} style={{...inp,width:80,textAlign:"center"}}/>
      <span style={{fontSize:13,color:C.muted}}>points</span>
    </div>
   <div style={{background:C.surface,borderRadius:14,padding:"14px",marginBottom:20,border:`1px solid ${C.border}`}}>
  <p style={{fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>Scoring Method</p>
  <div style={{display:"flex",gap:8}}>
    {[["cards","Cards (Default)"],["manual","Manual Points"]].map(([val,label])=>(
      <button key={val} onClick={()=>saveScoringMethod(val)} style={{flex:1,padding:"9px",borderRadius:10,border:`1px solid ${scoringMethod===val?C.accent:C.border}`,background:scoringMethod===val?C.accentBg:"transparent",color:scoringMethod===val?C.accent:C.sub,fontSize:13,cursor:"pointer",fontWeight:scoringMethod===val?700:400}}>
        {label}
      </button>
    ))}
  </div>
</div>
    <button onClick={startGame} disabled={selectedPlayers.length<2} style={{width:"100%",padding:"13px",borderRadius:12,background:selectedPlayers.length>=2?`linear-gradient(135deg,${C.accent},#54C8FF)`:C.surfaceAlt,color:selectedPlayers.length>=2?"#fff":C.muted,border:"none",fontSize:15,cursor:selectedPlayers.length>=2?"pointer":"not-allowed",fontWeight:700}}>
      {selectedPlayers.length>=2?`Start game · ${selectedPlayers.length} players`:"Select at least 2 players"}
    </button>
  </div>;

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <p style={{fontSize:13,color:C.sub,fontWeight:600,margin:0}}>{gameOver?"Game over ·":"Round "+(roundHistory.length+1)+" ·"} target {target}</p>
      <button onClick={newGame} style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",color:"#FF6B6B",fontSize:13,cursor:"pointer"}}>New game</button>
    </div>

    {!gameOver&&winner!==null&&<div style={{background:`linear-gradient(135deg,${C.accent}22,#54C8FF22)`,border:`1px solid ${C.accent}55`,borderRadius:14,padding:"1rem",textAlign:"center",marginBottom:14}}>
      <div style={{fontSize:20,fontWeight:800,color:C.accent,marginBottom:4}}>{selectedPlayers[winner].name} reached the target</div>
      <div style={{fontSize:13,color:C.sub,marginBottom:12}}>{scores[winner]} pts · {roundHistory.length} rounds</div>
      <button onClick={finishGame} style={{width:"100%",padding:"10px",borderRadius:10,background:`linear-gradient(135deg,${C.accent},#54C8FF)`,color:"#fff",border:"none",fontSize:14,cursor:"pointer",fontWeight:700}}>Finish game</button>
    </div>}

    {gameOver&&winner!==null&&<div style={{background:`linear-gradient(135deg,${C.accent}22,#54C8FF22)`,border:`1px solid ${C.accent}55`,borderRadius:14,padding:"1.25rem",textAlign:"center",marginBottom:14}}>
      <div style={{fontSize:22,fontWeight:800,color:C.accent,marginBottom:4}}>🎉 {selectedPlayers[winner].name} wins!</div>
      <div style={{fontSize:13,color:C.sub}}>{scores[winner]} pts · {roundHistory.length} rounds</div>
    </div>}

    <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(selectedPlayers.length,4)},minmax(0,1fr))`,gap:8,marginBottom:14,width:"100%"}}>
      {selectedPlayers.map((p,i)=>{
        const isLead=scores[i]===Math.max(...scores)&&scores[i]>0;
        const pct=Math.min(Math.round((scores[i]/target)*100),100);
        return <div key={p.id} style={{background:isLead?p.color+"22":C.surface,borderRadius:12,padding:"10px 6px",textAlign:"center",border:`2px solid ${isLead?p.color:C.border}`,transition:"all 0.2s"}}>
          <div style={{fontSize:11,color:p.color,fontWeight:700,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
          <div style={{fontSize:22,fontWeight:800,color:C.text}}>{scores[i]}</div>
          <div style={{margin:"6px 4px 2px",height:4,borderRadius:4,background:C.border}}>
            <div style={{height:"100%",borderRadius:4,width:pct+"%",background:`linear-gradient(90deg,${p.color},${p.color}88)`,transition:"width 0.4s"}}/>
          </div>
          <div style={{fontSize:10,color:C.muted}}>{pct}%</div>
        </div>;
      })}
    </div>

    {!gameOver&&<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"1rem",marginBottom:12}}>
      <p style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:12,margin:"0 0 12px"}}>{editingRound!==null?`Edit round ${editingRound+1}`:`Round ${roundHistory.length+1}`}</p>
      <div style={{display:"grid",gridTemplateColumns:gameMethod==="manual"?"1fr 1fr 44px 38px":"1fr 1fr 1fr 44px 38px",gap:6,marginBottom:8}}>
        {(gameMethod==="manual"?["","Points Earned","Pts","⚡"]:["","Played","In hand","Pts","⚡"]).map((l,i)=><div key={i} style={{fontSize:10,color:C.muted,textAlign:i>0?"center":"left",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{l}</div>)}
      </div>
      {selectedPlayers.map((p,i)=>{
        const pts=calcPts(i);
        const has=(entries[i]?.cp||"")!==""||( entries[i]?.ch||"")!=="";
        return <div key={p.id} style={{display:"grid",gridTemplateColumns:gameMethod==="manual"?"1fr 1fr 44px 38px":"1fr 1fr 1fr 44px 38px",gap:6,alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:13,color:p.color,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
          {gameMethod==="manual" ? (
          <input type="number" inputMode="numeric" min={0} value={entries[i]?.cp||""} onChange={e=>upd(i,"cp",e.target.value)} placeholder="0" style={{...inp,textAlign:"center",padding:"6px 4px"}}/>
          ) : (<>
         <input type="number" inputMode="numeric" min={0} max={40} value={entries[i]?.cp||""} onChange={e=>upd(i,"cp",e.target.value)} placeholder="0" style={{...inp,textAlign:"center",padding:"6px 4px"}}/>
         <input type="number" inputMode="numeric" min={0} max={10} value={entries[i]?.ch||""} onChange={e=>upd(i,"ch",e.target.value)} placeholder="0" style={{...inp,textAlign:"center",padding:"6px 4px"}}/>
         </>)}
          <div style={{textAlign:"center",fontSize:14,fontWeight:800,color:!has?C.muted:pts>=0?"#43D9A3":"#FF6B6B"}}>{!has?"—":(pts>=0?"+":"")+pts}</div>
          <div style={{display:"flex",justifyContent:"center"}}>
            <button onClick={()=>upd(i,"blitz",!entries[i]?.blitz)} style={{width:32,height:32,borderRadius:8,border:`1.5px solid ${entries[i]?.blitz?"#FF9F43":C.border}`,background:entries[i]?.blitz?"#FF9F4333":"transparent",cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>⚡</button>
          </div>
        </div>;
      })}
      <div style={{fontSize:11,color:C.muted,margin:"4px 0 12px"}}>⚡ = Blitzed out — tracked only, no score change</div>
      {!canSaveRound&&<div style={{fontSize:12,color:"#FF9F43",margin:"0 0 12px",fontWeight:600}}>Mark exactly one player as Blitz before saving this round.</div>}
      <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12,display:"flex",gap:8}}>
        <button onClick={submitRound} disabled={!canSaveRound} style={{flex:1,padding:"10px",borderRadius:10,background:canSaveRound?`linear-gradient(135deg,${C.accent},#54C8FF)`:C.surfaceAlt,color:canSaveRound?"#fff":C.muted,border:"none",fontSize:14,cursor:canSaveRound?"pointer":"not-allowed",fontWeight:700}}>{editingRound!==null?"Save changes":"Save round"}</button>
        {editingRound!==null&&<button onClick={cancelEdit} style={{padding:"10px 14px",borderRadius:10,border:`1px solid ${C.border}`,background:"transparent",color:C.sub,fontSize:13,cursor:"pointer"}}>Cancel</button>}
        {editingRound===null&&roundHistory.length>0&&<button onClick={undoRound} style={{padding:"10px 14px",borderRadius:10,border:`1px solid ${C.border}`,background:"transparent",color:C.sub,fontSize:13,cursor:"pointer"}}>Undo</button>}
      </div>
    </div>}

    {gameOver&&<button onClick={newGame} style={{width:"100%",padding:"11px",borderRadius:12,background:`linear-gradient(135deg,${C.accent},#54C8FF)`,color:"#fff",border:"none",fontSize:14,cursor:"pointer",fontWeight:700,marginBottom:12}}>New game</button>}

    {roundHistory.length>0&&<RoundLogTable rounds={roundHistory} players={selectedPlayers} scores={scores} C={C} onEditRound={!gameOver?editRound:null}/>}
  </div>;
}

/* ── History ──────────────────────────────────────────────── */
function HistoryTab({ history, profiles, C, saveHistory }) {
  const [selected, setSelected] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  function deleteGame(g) { saveHistory(history.filter(h=>h.id!==g.id)); setConfirmDelete(null); setSelected(null); }

  if (selected) {
    const g=selected;
    const sorted=[...g.players].sort((a,b)=>b.finalScore-a.finalScore);
    const date=new Date(g.date);
    return <div>
      {confirmDelete&&<ConfirmModal message={`Delete this game from ${new Date(confirmDelete.date).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}? This cannot be undone.`} onConfirm={()=>deleteGame(confirmDelete)} onCancel={()=>setConfirmDelete(null)} C={C}/>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <button onClick={()=>setSelected(null)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:C.accent,fontSize:14,fontWeight:600,padding:0}}>
          <i className="ti ti-arrow-left" style={{fontSize:15}}></i> Back
        </button>
        <button onClick={()=>setConfirmDelete(selected)} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:`1px solid ${C.border}`,borderRadius:8,cursor:"pointer",color:"#FF6B6B",fontSize:13,padding:"5px 12px"}}>
          <i className="ti ti-trash" style={{fontSize:14}}></i> Delete
        </button>
      </div>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"1rem",marginBottom:12}}>
        <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:4}}>🏆 {g.winnerName}</div>
        <div style={{fontSize:12,color:C.sub}}>{date.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"})} · {g.rounds} rounds · target {g.target}</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>
          {sorted.map((p,i)=>{const prof=profiles.find(pr=>pr.id===p.profileId);const col=prof?.color||COLORS[i%COLORS.length];return(
            <div key={p.id} style={{padding:"4px 12px",borderRadius:20,background:col+"22",border:`1px solid ${col}44`,fontSize:13,display:"flex",gap:6,alignItems:"center"}}>
              <span style={{color:col,fontWeight:700}}>{p.name}</span>
              <span style={{color:C.muted}}>{p.finalScore} pts</span>
              {p.blitzes>0&&<span style={{color:"#FF9F43",fontSize:11}}>⚡{p.blitzes}</span>}
            </div>
          );})}
        </div>
      </div>
      {g.roundLog ? <RoundLogTable rounds={g.roundLog} players={g.players} scores={g.players.map(p=>p.finalScore)} C={C}/> : <div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"2rem"}}>Round data not available.</div>}
    </div>;
  }

  if (!history.length) return <div style={{textAlign:"center",padding:"4rem 1rem"}}>
    <i className="ti ti-history" style={{fontSize:40,color:C.muted}}></i>
    <p style={{marginTop:"1rem",color:C.sub,fontSize:14,lineHeight:1.6}}>No games yet.<br/>Finish a game and it'll appear here.</p>
  </div>;

  return <div>
    <p style={{fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:1.2,marginBottom:14}}>{history.length} games played</p>
    {history.map(g=>{
      const date=new Date(g.date);
      const sorted=[...g.players].sort((a,b)=>b.finalScore-a.finalScore);
      return <button key={g.id} onClick={()=>setSelected(g)} style={{width:"100%",textAlign:"left",background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"1rem",marginBottom:10,cursor:"pointer",display:"block"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:C.text}}>🏆 {g.winnerName}</div>
            <div style={{fontSize:12,color:C.sub,marginTop:2}}>{date.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})} · {g.rounds} rounds</div>
          </div>
          <i className="ti ti-chevron-right" style={{fontSize:16,color:C.muted,marginTop:2}}></i>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {sorted.map((p,i)=>{const prof=profiles.find(pr=>pr.id===p.profileId);const col=prof?.color||COLORS[i%COLORS.length];return(
            <div key={p.id} style={{padding:"4px 12px",borderRadius:20,background:col+"22",border:`1px solid ${col}44`,fontSize:13,display:"flex",gap:6,alignItems:"center"}}>
              <span style={{color:col,fontWeight:700}}>{p.name}</span>
              <span style={{color:C.muted}}>{p.finalScore} pts</span>
            </div>
          );})}
        </div>
      </button>;
    })}
  </div>;
}

/* ── Players ──────────────────────────────────────────────── */
function PlayersTab({ profiles, saveProfiles, C, inp, onDeletePlayer }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [editId, setEditId] = useState(null);

  function addProfile() {
    if (!newName.trim()) return;
    saveProfiles([...profiles,{id:genId(),name:newName.trim(),color:newColor,gamesPlayed:0,totalPoints:0,wins:0,blitzes:0,roundsPlayed:0}]);
    setNewName(""); setShowAdd(false);
  }

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <p style={{fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:1.2,margin:0}}>{profiles.length} players</p>
      <button onClick={()=>setShowAdd(!showAdd)} style={{padding:"6px 14px",borderRadius:10,border:`1px solid ${showAdd?C.accent:C.border}`,background:showAdd?C.accentBg:"transparent",color:showAdd?C.accent:C.sub,fontSize:13,cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
        <i className="ti ti-plus" style={{fontSize:13}}></i>New
      </button>
    </div>
    {showAdd&&<div style={{background:C.surface,border:`1px solid ${C.accent}55`,borderRadius:14,padding:"1rem",marginBottom:12}}>
      <p style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:12}}>New player</p>
      <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Name" style={{...inp,marginBottom:10}}/>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        {COLORS.map(c=><button key={c} onClick={()=>setNewColor(c)} style={{width:30,height:30,borderRadius:"50%",background:c,border:newColor===c?`3px solid ${C.text}`:"3px solid transparent",cursor:"pointer"}}></button>)}
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={addProfile} style={{flex:1,padding:"9px",borderRadius:10,background:`linear-gradient(135deg,${C.accent},#54C8FF)`,color:"#fff",border:"none",fontSize:14,cursor:"pointer",fontWeight:700}}>Save</button>
        <button onClick={()=>setShowAdd(false)} style={{padding:"9px 14px",borderRadius:10,border:`1px solid ${C.border}`,background:"transparent",color:C.sub,fontSize:14,cursor:"pointer"}}>Cancel</button>
      </div>
    </div>}
    {!profiles.length&&!showAdd&&<div style={{textAlign:"center",padding:"4rem 1rem"}}>
      <i className="ti ti-users" style={{fontSize:40,color:C.muted}}></i>
      <p style={{marginTop:"1rem",color:C.sub,fontSize:14,lineHeight:1.6}}>No saved players yet.<br/>Add profiles to track stats.</p>
    </div>}
    {profiles.map(p=>{
      if (editId===p.id) return <EditCard key={p.id} profile={p} onSave={(id,name,color)=>{saveProfiles(profiles.map(pr=>pr.id===id?{...pr,name,color}:pr));setEditId(null);}} onCancel={()=>setEditId(null)} C={C} inp={inp}/>;
      const winRate=p.gamesPlayed?Math.round((p.wins/p.gamesPlayed)*100):0;
      const avg=p.roundsPlayed?Math.round(p.totalPoints/p.roundsPlayed):0;
      const blitzRate=p.roundsPlayed?Math.round((p.blitzes/p.roundsPlayed)*100):0;
      return <div key={p.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"1rem",marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${p.color},${p.color}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#fff",flexShrink:0}}>{p.name[0].toUpperCase()}</div>
            <span style={{fontSize:16,fontWeight:700,color:C.text}}>{p.name}</span>
          </div>
          <div style={{display:"flex",gap:4}}>
            <button onClick={()=>setEditId(p.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.sub,padding:"5px",borderRadius:8,display:"flex"}}><i className="ti ti-edit" style={{fontSize:16}}></i></button>
            <button onClick={()=>onDeletePlayer(p)} style={{background:"none",border:"none",cursor:"pointer",color:"#FF6B6B",padding:"5px",borderRadius:8,display:"flex"}}><i className="ti ti-trash" style={{fontSize:16}}></i></button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:6}}>
          {[["Games",p.gamesPlayed],["Wins",p.wins],["Win %",winRate+"%"]].map(([l,v])=>(
            <div key={l} style={{background:C.surfaceAlt,borderRadius:10,padding:"8px 4px",textAlign:"center"}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{l}</div>
              <div style={{fontSize:18,fontWeight:800,color:C.text}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
          {[["Avg pts",avg],["Total pts",p.totalPoints||0],["⚡ Blitz %",blitzRate+"%"]].map(([l,v])=>(
            <div key={l} style={{background:C.surfaceAlt,borderRadius:10,padding:"8px 4px",textAlign:"center"}}>
              <div style={{fontSize:10,color:l.includes("Blitz")?"#FF9F43":C.muted,marginBottom:3,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{l}</div>
              <div style={{fontSize:18,fontWeight:800,color:l.includes("Blitz")&&p.roundsPlayed>0?"#FF9F43":C.text}}>{v}</div>
            </div>
          ))}
        </div>
      </div>;
    })}
  </div>;
}

/* ── Edit card ────────────────────────────────────────────── */
function EditCard({ profile, onSave, onCancel, C, inp }) {
  const [name, setName] = useState(profile.name);
  const [color, setColor] = useState(profile.color);
  return <div style={{background:C.surface,border:`1px solid ${C.accent}55`,borderRadius:14,padding:"1rem",marginBottom:10}}>
    <p style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:12}}>Edit player</p>
    <input value={name} onChange={e=>setName(e.target.value)} style={{...inp,marginBottom:10}}/>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
      {COLORS.map(c=><button key={c} onClick={()=>setColor(c)} style={{width:30,height:30,borderRadius:"50%",background:c,border:color===c?`3px solid ${C.text}`:"3px solid transparent",cursor:"pointer"}}></button>)}
    </div>
    <div style={{display:"flex",gap:8}}>
      <button onClick={()=>onSave(profile.id,name,color)} style={{flex:1,padding:"9px",borderRadius:10,background:`linear-gradient(135deg,${C.accent},#54C8FF)`,color:"#fff",border:"none",fontSize:14,cursor:"pointer",fontWeight:700}}>Save</button>
      <button onClick={onCancel} style={{padding:"9px 14px",borderRadius:10,border:`1px solid ${C.border}`,background:"transparent",color:C.sub,fontSize:14,cursor:"pointer"}}>Cancel</button>
    </div>
  </div>;
}
