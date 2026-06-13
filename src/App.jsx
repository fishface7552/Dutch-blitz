import { useState, useEffect } from "react";

const STORAGE_PROFILES = "db_profiles";
const STORAGE_HISTORY = "db_history";
const STORAGE_SETTINGS = "db_settings";

function genId() { return Math.random().toString(36).slice(2, 9); }

const COLORS = ["#54A0FF","#FF6584","#43D9A3","#FF9F43","#6C63FF","#FF6B6B","#A29BFE","#00D2D3","#FD79A8","#55EFC4"];

function ls(key) {
  try {
    const r = localStorage.getItem(key);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
}

function ss(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

const LIGHT = { bg:"#F0F6FF", surface:"#FFFFFF", surfaceAlt:"#E6F0FF", border:"#C5DCFF", text:"#0D1F3C", sub:"#4A6FA5", muted:"#8AAED4", accent:"#2979FF", accentBg:"#E3EEFF" };
const DARK  = { bg:"#0D1117", surface:"#161D2B", surfaceAlt:"#1C2638", border:"#243044", text:"#E8F0FF", sub:"#7A9CC4", muted:"#3D5A80", accent:"#4D9EFF", accentBg:"#102040" };

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
        <button onClick={onCancel} style={{flex:1,padding:"9px",borderRadius:10,border:`1px solid ${C.border}`,background:"transparent",color:C.sub,fontSize:14,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Cancel</button>
        <button onClick={onConfirm} style={{flex:1,padding:"9px",borderRadius:10,border:"none",background:"#FF6B6B",color:"#fff",fontSize:14,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>Delete</button>
      </div>
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

  useEffect(() => {
    (async () => {
      const p = await ls(STORAGE_PROFILES);
      const h = await ls(STORAGE_HISTORY);
      const s = await ls(STORAGE_SETTINGS);
      if (p) setProfiles(p);
      if (h) setHistory(h);
      if (s) setSettings(s);
      setLoaded(true);
    })();
  }, []);

  async function saveProfiles(p) { setProfiles(p); await ss(STORAGE_PROFILES, p); }
  async function saveHistory(h) { setHistory(h); await ss(STORAGE_HISTORY, h); }
  async function saveSettings(s) { setSettings(s); await ss(STORAGE_SETTINGS, s); }

  function doDeletePlayer(p) {
    saveProfiles(profiles.filter(x => x.id !== p.id));
    setConfirmDeletePlayer(null);
  }

  async function onGameEnd(game) {
    const newHistory = [game, ...history];
    await saveHistory(newHistory);
    const newProfiles = profiles.map(p => {
      const player = game.players.find(pl => pl.profileId === p.id);
      if (!player) return p;
      return { ...p, gamesPlayed:(p.gamesPlayed||0)+1, totalPoints:(p.totalPoints||0)+player.finalScore, wins:(p.wins||0)+(game.winnerId===p.id?1:0), blitzes:(p.blitzes||0)+(player.blitzes||0), roundsPlayed:(p.roundsPlayed||0)+game.rounds };
    });
    await saveProfiles(newProfiles);
  }

  const C = settings.theme === "dark" ? DARK : LIGHT;
  const inp = { background:C.surfaceAlt, border:`1px solid ${C.border}`, color:C.text, borderRadius:10, padding:"8px 12px", fontSize:14, outline:"none", fontFamily:"inherit", width:"100%", boxSizing:"border-box" };

  if (!loaded) return <div style={{padding:"2rem",color:C.sub,fontSize:14,background:C.bg,minHeight:"100vh"}}>Loading...</div>;

  return (
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",maxWidth:640,margin:"0 auto",background:C.bg,minHeight:"100vh",color:C.text}}>
      {confirmDeletePlayer && <ConfirmModal
        message={`Deleting "${confirmDeletePlayer.name}" will permanently remove all their stats and cannot be undone.`}
        onConfirm={() => doDeletePlayer(confirmDeletePlayer)}
        onCancel={() => setConfirmDeletePlayer(null)}
        C={C}
      />}

      {/* Header */}
      <div style={{padding:"18px 16px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:22,fontWeight:800,letterSpacing:-0.5,background:`linear-gradient(135deg,${C.accent},#54C8FF)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",display:"inline-block"}}>Dutch Blitz</span>
        <button onClick={() => setTab(tab==="settings"?"play":"settings")} style={{background:tab==="settings"?C.accentBg:"transparent",border:`1px solid ${tab==="settings"?C.accent:C.border}`,borderRadius:10,padding:"7px 9px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <GearIcon size={18} color={tab==="settings"?C.accent:C.sub}/>
        </button>
      </div>

      {/* Tabs */}
      {tab !== "settings" && <div style={{display:"flex",margin:"14px 16px 0",background:C.surface,borderRadius:14,padding:4,border:`1px solid ${C.border}`}}>
        {[["play","ti-cards","Play"],["history","ti-history","History"],["players","ti-users","Players"]].map(([t,ic,label]) => (
          <button key={t} onClick={() => setTab(t)} style={{flex:1,padding:"8px 4px",background:tab===t?C.accentBg:"transparent",border:"none",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:tab===t?700:400,color:tab===t?C.accent:C.sub,display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontFamily:"inherit",transition:"all 0.15s"}}>
            <i className={`ti ${ic}`} style={{fontSize:14}}></i>{label}
          </button>
        ))}
      </div>}

      <div style={{padding:"16px"}}>
        {tab==="play"     && <PlayTab profiles={profiles} onGameEnd={onGameEnd} C={C} inp={inp}/>}
        {tab==="history"  && <HistoryTab history={history} profiles={profiles} C={C} saveHistory={saveHistory}/>}
        {tab==="players"  && <PlayersTab profiles={profiles} saveProfiles={saveProfiles} C={C} inp={inp} onDeletePlayer={setConfirmDeletePlayer}/>}
        {tab==="settings" && <SettingsTab settings={settings} saveSettings={saveSettings} C={C} profiles={profiles} onDeletePlayer={setConfirmDeletePlayer}/>}
      </div>
    </div>
  );
}

/* ─── Settings ─────────────────────────────────────────────────── */
function SettingsTab({ settings, saveSettings, C, profiles, onDeletePlayer }) {
  const [playersOpen, setPlayersOpen] = useState(false);
  return (
    <div>
      <p style={{fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:1.2,marginBottom:16}}>Settings</p>

      {/* Theme */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,marginBottom:12}}>
        <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:14,fontWeight:600,color:C.text}}>Theme</div>
            <div style={{fontSize:12,color:C.sub,marginTop:2}}>Choose your preferred look</div>
          </div>
          <div style={{display:"flex",gap:6}}>
            {[["light","☀️"],["dark","🌙"]].map(([t,icon]) => (
              <button key={t} onClick={() => saveSettings({...settings,theme:t})} style={{padding:"6px 14px",borderRadius:9,border:`1px solid ${settings.theme===t?C.accent:C.border}`,background:settings.theme===t?C.accentBg:"transparent",color:settings.theme===t?C.accent:C.sub,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:settings.theme===t?700:400}}>
                {icon} {t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Delete players */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,marginBottom:12,overflow:"hidden"}}>
        <button onClick={() => setPlayersOpen(o => !o)} style={{width:"100%",padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit"}}>
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
              <button onClick={() => onDeletePlayer(p)} style={{background:"none",border:`1px solid #FF6B6B66`,borderRadius:8,cursor:"pointer",color:"#FF6B6B",padding:"6px 9px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <i className="ti ti-trash" style={{fontSize:15}}></i>
              </button>
            </div>
          ))}
        </div>}
      </div>

      {/* Scoring rules */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:6}}>Scoring rules</div>
        <div style={{fontSize:13,color:C.sub,lineHeight:1.8}}>
          +1 pt per card played to the centre piles<br/>
          −2 pts per card remaining in hand<br/>
          ⚡ Blitz = going out (0 cards left in pile) — tracked only, no score change<br/>
          First player to reach the target score wins
        </div>
      </div>

      {/* About */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px"}}>
        <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:4}}>About</div>
        <div style={{fontSize:13,color:C.sub,lineHeight:1.6}}>Dutch Blitz Score Tracker — supports any number of players including expansion packs.</div>
      </div>
    </div>
  );
}

/* ─── Play ──────────────────────────────────────────────────────── */
function PlayTab({ profiles, onGameEnd, C, inp }) {
  const [phase, setPhase] = useState("setup");
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [target, setTarget] = useState(75);
  const [scores, setScores] = useState([]);
  const [roundHistory, setRoundHistory] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [entries, setEntries] = useState([]);
  const [guestName, setGuestName] = useState("");

  function toggleProfile(p) {
    if (selectedPlayers.find(s => s.id===p.id)) setSelectedPlayers(selectedPlayers.filter(s => s.id!==p.id));
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
    setRoundHistory([]); setGameOver(false); setWinner(null);
    setEntries(selectedPlayers.map(()=>({cp:"",ch:"",blitz:false})));
    setPhase("game");
  }
  function updateEntry(i,field,val){const e=[...entries];e[i]={...e[i],[field]:val};setEntries(e);}
  function calcPts(i){return (parseInt(entries[i]?.cp)||0)-((parseInt(entries[i]?.ch)||0)*2);}
  function submitRound() {
    const rScores=selectedPlayers.map((_,i)=>calcPts(i));
    const blitzers=selectedPlayers.map((_,i)=>entries[i]?.blitz?1:0);
    const newScores=scores.map((s,i)=>s+rScores[i]);
    const newHistory=[...roundHistory,{scores:rScores,blitzers}];
    setRoundHistory(newHistory); setScores(newScores);
    setEntries(selectedPlayers.map(()=>({cp:"",ch:"",blitz:false})));
    if (newScores.some(s=>s>=target)) {
      const w=newScores.reduce((a,_,i)=>newScores[i]>newScores[a]?i:a,0);
      setGameOver(true); setWinner(w);
      onGameEnd({id:genId(),date:new Date().toISOString(),target,
        players:selectedPlayers.map((p,i)=>({...p,finalScore:newScores[i],blitzes:newHistory.reduce((sum,r)=>sum+(r.blitzers[i]||0),0)})),
        roundLog:newHistory,winnerId:selectedPlayers[w].profileId,winnerName:selectedPlayers[w].name,rounds:newHistory.length});
    }
  }
  function undoRound() {
    if (!roundHistory.length) return;
    const last=roundHistory[roundHistory.length-1];
    setScores(scores.map((s,i)=>s-last.scores[i]));
    setRoundHistory(roundHistory.slice(0,-1));
    setGameOver(false); setWinner(null);
  }
  function newGame(){setPhase("setup");setSelectedPlayers([]);}

  if (phase==="setup") return (
    <div>
      {profiles.length>0 && <>
        <p style={{fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>Saved Players</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
          {profiles.map(p=>{const sel=!!selectedPlayers.find(s=>s.id===p.id);return(
            <button key={p.id} onClick={()=>toggleProfile(p)} style={{padding:"7px 16px",borderRadius:20,border:`1.5px solid ${sel?p.color:C.border}`,background:sel?p.color+"33":"transparent",color:sel?p.color:C.sub,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:sel?700:400}}>{p.name}</button>
          );})}
        </div>
      </>}
      <p style={{fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>Add Guest</p>
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        <input value={guestName} onChange={e=>setGuestName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addGuest()} placeholder="Guest name" style={inp}/>
        <button onClick={addGuest} disabled={!guestName.trim()} style={{padding:"8px 16px",borderRadius:10,background:C.accentBg,border:`1px solid ${C.accent}`,color:C.accent,fontSize:14,cursor:"pointer",fontFamily:"inherit",fontWeight:600,whiteSpace:"nowrap"}}>Add</button>
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
        <input type="number" value={target} onChange={e=>setTarget(parseInt(e.target.value)||75)} min={10} max={999} style={{...inp,width:80,textAlign:"center"}}/>
        <span style={{fontSize:13,color:C.muted}}>points</span>
      </div>
      <button onClick={startGame} disabled={selectedPlayers.length<2} style={{width:"100%",padding:"12px",borderRadius:12,background:selectedPlayers.length>=2?`linear-gradient(135deg,${C.accent},#54C8FF)`:C.surfaceAlt,color:selectedPlayers.length>=2?"#fff":C.muted,border:"none",fontSize:15,cursor:selectedPlayers.length>=2?"pointer":"not-allowed",fontFamily:"inherit",fontWeight:700}}>
        {selectedPlayers.length>=2?`Start game · ${selectedPlayers.length} players`:"Select at least 2 players"}
      </button>
    </div>
  );

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <p style={{fontSize:13,color:C.sub,fontWeight:600}}>{gameOver?"Game over ·":"Round "+(roundHistory.length+1)+" ·"} target {target}</p>
        <button onClick={newGame} style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",color:"#FF6B6B",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>New game</button>
      </div>

      {gameOver&&winner!==null&&<div style={{background:`linear-gradient(135deg,${C.accent}22,#54C8FF22)`,border:`1px solid ${C.accent}55`,borderRadius:14,padding:"1.25rem",textAlign:"center",marginBottom:16}}>
        <div style={{fontSize:22,fontWeight:800,color:C.accent,marginBottom:4}}>🎉 {selectedPlayers[winner].name} wins!</div>
        <div style={{fontSize:13,color:C.sub}}>{scores[winner]} pts · {roundHistory.length} rounds</div>
      </div>}

      <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(selectedPlayers.length,4)},minmax(0,1fr))`,gap:8,marginBottom:16}}>
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
        <p style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:12}}>Round {roundHistory.length+1}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 52px 46px",gap:6,marginBottom:8}}>
          {["","Played","In hand","Pts","⚡"].map((l,i)=><div key={i} style={{fontSize:10,color:C.muted,textAlign:i>0?"center":"left",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{l}</div>)}
        </div>
        {selectedPlayers.map((p,i)=>{
          const pts=calcPts(i);
          const has=(entries[i]?.cp||"")!==""||( entries[i]?.ch||"")!=="";
          return <div key={p.id} style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 52px 46px",gap:6,alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:13,color:p.color,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
            <input type="number" min={0} max={40} value={entries[i]?.cp||""} onChange={e=>updateEntry(i,"cp",e.target.value)} placeholder="0" style={{...inp,textAlign:"center",padding:"6px 4px"}}/>
            <input type="number" min={0} max={40} value={entries[i]?.ch||""} onChange={e=>updateEntry(i,"ch",e.target.value)} placeholder="0" style={{...inp,textAlign:"center",padding:"6px 4px"}}/>
            <div style={{textAlign:"center",fontSize:14,fontWeight:800,color:!has?C.muted:pts>=0?"#43D9A3":"#FF6B6B"}}>{!has?"—":(pts>=0?"+":"")+pts}</div>
            <div style={{display:"flex",justifyContent:"center"}}>
              <button onClick={()=>updateEntry(i,"blitz",!entries[i]?.blitz)} style={{width:32,height:32,borderRadius:8,border:`1.5px solid ${entries[i]?.blitz?"#FF9F43":C.border}`,background:entries[i]?.blitz?"#FF9F4333":"transparent",cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>⚡</button>
            </div>
          </div>;
        })}
        <div style={{fontSize:11,color:C.muted,marginBottom:12}}>⚡ = Blitzed out — tracked only, no score change</div>
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12,display:"flex",gap:8}}>
          <button onClick={submitRound} style={{flex:1,padding:"10px",borderRadius:10,background:`linear-gradient(135deg,${C.accent},#54C8FF)`,color:"#fff",border:"none",fontSize:14,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>Save round</button>
          {roundHistory.length>0&&<button onClick={undoRound} style={{padding:"10px 14px",borderRadius:10,border:`1px solid ${C.border}`,background:"transparent",color:C.sub,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Undo</button>}
        </div>
      </div>}

      {gameOver&&<button onClick={newGame} style={{width:"100%",padding:"11px",borderRadius:12,background:`linear-gradient(135deg,${C.accent},#54C8FF)`,color:"#fff",border:"none",fontSize:14,cursor:"pointer",fontFamily:"inherit",fontWeight:700,marginBottom:12}}>New game</button>}

      {roundHistory.length>0&&<RoundLogTable rounds={roundHistory} players={selectedPlayers} scores={scores} C={C}/>}
    </div>
  );
}

/* ─── Round log table ───────────────────────────────────────────── */
function RoundLogTable({ rounds, players, scores, C }) {
  return (
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
      <p style={{fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:1.2,padding:"12px 14px 8px"}}>Round history</p>
      <div style={{display:"grid",gridTemplateColumns:`48px repeat(${players.length},minmax(0,1fr))`,borderBottom:`1px solid ${C.border}`}}>
        <div style={{padding:"6px 14px",fontSize:11,color:C.muted,fontWeight:700}}> </div>
        {players.map(p=><div key={p.id} style={{padding:"6px 4px",fontSize:11,color:p.color,fontWeight:700,textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>)}
      </div>
      {[...rounds].reverse().map((r,ri)=>{
        const roundNum=rounds.length-ri;
        return <div key={ri} style={{display:"grid",gridTemplateColumns:`48px repeat(${players.length},minmax(0,1fr))`,borderBottom:ri<rounds.length-1?`1px solid ${C.border}`:"none",background:ri%2===0?"transparent":C.surfaceAlt+"55"}}>
          <div style={{padding:"8px 14px",fontSize:12,color:C.muted,fontWeight:600}}>{roundNum}</div>
          {players.map((p,i)=><div key={p.id} style={{padding:"8px 4px",textAlign:"center",fontSize:13,fontWeight:700,color:r.scores[i]>=0?"#43D9A3":"#FF6B6B"}}>
            {r.scores[i]>=0?"+":""}{r.scores[i]}{r.blitzers[i]?" ⚡":""}
          </div>)}
        </div>;
      })}
      <div style={{display:"grid",gridTemplateColumns:`48px repeat(${players.length},minmax(0,1fr))`,borderTop:`2px solid ${C.border}`,background:C.surfaceAlt}}>
        <div style={{padding:"8px 14px",fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase"}}>Total</div>
        {players.map((p,i)=><div key={p.id} style={{padding:"8px 4px",textAlign:"center",fontSize:14,fontWeight:800,color:C.text}}>{scores[i]}</div>)}
      </div>
    </div>
  );
}

/* ─── History ───────────────────────────────────────────────────── */
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
        <button onClick={()=>setSelected(null)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:C.accent,fontSize:14,fontWeight:600,fontFamily:"inherit",padding:0}}>
          <i className="ti ti-arrow-left" style={{fontSize:15}}></i> Back
        </button>
        <button onClick={()=>setConfirmDelete(selected)} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:`1px solid ${C.border}`,borderRadius:8,cursor:"pointer",color:"#FF6B6B",fontSize:13,fontFamily:"inherit",padding:"5px 12px"}}>
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
      {g.roundLog ? <RoundLogTable rounds={g.roundLog} players={g.players} scores={g.players.map(p=>p.finalScore)} C={C}/> : <div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"2rem"}}>Round data not available for this game.</div>}
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
      return <button key={g.id} onClick={()=>setSelected(g)} style={{width:"100%",textAlign:"left",background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"1rem",marginBottom:10,cursor:"pointer",fontFamily:"inherit",display:"block"}}>
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

/* ─── Players ───────────────────────────────────────────────────── */
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
      <p style={{fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:1.2}}>{profiles.length} players</p>
      <button onClick={()=>setShowAdd(!showAdd)} style={{padding:"6px 14px",borderRadius:10,border:`1px solid ${showAdd?C.accent:C.border}`,background:showAdd?C.accentBg:"transparent",color:showAdd?C.accent:C.sub,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
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
        <button onClick={addProfile} style={{flex:1,padding:"9px",borderRadius:10,background:`linear-gradient(135deg,${C.accent},#54C8FF)`,color:"#fff",border:"none",fontSize:14,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>Save</button>
        <button onClick={()=>setShowAdd(false)} style={{padding:"9px 14px",borderRadius:10,border:`1px solid ${C.border}`,background:"transparent",color:C.sub,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
      </div>
    </div>}
    {!profiles.length&&!showAdd&&<div style={{textAlign:"center",padding:"4rem 1rem"}}>
      <i className="ti ti-users" style={{fontSize:40,color:C.muted}}></i>
      <p style={{marginTop:"1rem",color:C.sub,fontSize:14,lineHeight:1.6}}>No saved players yet.<br/>Add profiles to track stats.</p>
    </div>}
    {profiles.map(p=>{
      if (editId===p.id) return <EditCard key={p.id} profile={p} onSave={(id,name,color)=>{saveProfiles(profiles.map(pr=>pr.id===id?{...pr,name,color}:pr));setEditId(null);}} onCancel={()=>setEditId(null)} C={C} inp={inp}/>;
      const winRate=p.gamesPlayed?Math.round((p.wins/p.gamesPlayed)*100):0;
      const avg=p.gamesPlayed?Math.round(p.totalPoints/p.gamesPlayed):0;
      const blitzRate=p.roundsPlayed?Math.round((p.blitzes/p.roundsPlayed)*100):0;
      return <div key={p.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"1rem",marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${p.color},${p.color}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#fff"}}>{p.name[0].toUpperCase()}</div>
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

/* ─── Edit card ─────────────────────────────────────────────────── */
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
      <button onClick={()=>onSave(profile.id,name,color)} style={{flex:1,padding:"9px",borderRadius:10,background:`linear-gradient(135deg,${C.accent},#54C8FF)`,color:"#fff",border:"none",fontSize:14,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>Save</button>
      <button onClick={onCancel} style={{padding:"9px 14px",borderRadius:10,border:`1px solid ${C.border}`,background:"transparent",color:C.sub,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
    </div>
  </div>;
}