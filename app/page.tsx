"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, CircleAlert, LogOut, Search, Settings2, Upload, X } from "lucide-react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { collection, doc, onSnapshot, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { auth, db, firebaseReady } from "../lib/firebase";
import { blankStages, Device, Stage, stages } from "../lib/types";
import { seedDevices } from "../lib/seed";

const stageLabels: Record<Stage, string> = { installed: "Installed", wired: "Wired", labelled: "Labelled", tested: "Tested" };

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [query, setQuery] = useState("");
  const [system, setSystem] = useState("All systems");
  const [showComplete, setShowComplete] = useState(true);
  const [selected, setSelected] = useState<Device | null>(null);
  const [menu, setMenu] = useState(false);

  useEffect(() => onAuthStateChanged(auth, current => { setUser(current); setAuthChecked(true); }), []);
  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "devices"), snapshot => {
      setDevices(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as Device)).sort((a,b) => a.tag.localeCompare(b.tag, undefined, { numeric: true })));
    });
  }, [user]);

  const systems = useMemo(() => ["All systems", ...Array.from(new Set(devices.map(d => d.subsystem))).sort()], [devices]);
  const filtered = useMemo(() => devices.filter(d => {
    const haystack = `${d.tag} ${d.kks} ${d.type} ${d.location} ${d.subsystem}`.toLowerCase();
    const complete = stages.every(s => d.stages?.[s]);
    return haystack.includes(query.toLowerCase()) && (system === "All systems" || d.subsystem === system) && (showComplete || !complete);
  }), [devices, query, system, showComplete]);
  const completed = devices.filter(d => stages.every(s => d.stages?.[s])).length;
  const stageDone = devices.reduce((sum, d) => sum + stages.filter(s => d.stages?.[s]).length, 0);
  const percent = devices.length ? Math.round(stageDone / (devices.length * stages.length) * 100) : 0;

  async function toggleStage(device: Device, stage: Stage) {
    const next = { ...device.stages, [stage]: !device.stages?.[stage] };
    await setDoc(doc(db, "devices", device.id), { ...device, stages: next, updatedAt: serverTimestamp(), updatedBy: user?.email ?? "Unknown" }, { merge: true });
    setSelected(current => current?.id === device.id ? { ...current, stages: next } : current);
  }

  async function loadStarterRegister() {
    const batch = writeBatch(db);
    seedDevices.forEach(device => batch.set(doc(db, "devices", device.id), { ...device, updatedAt: serverTimestamp(), updatedBy: user?.email }, { merge: true }));
    await batch.commit(); setMenu(false);
  }

  async function importCsv(file: File) {
    const text = await file.text();
    const rows = text.split(/\r?\n/).filter(Boolean).map(parseCsvRow);
    if (rows.length < 2) return;
    const headers = rows[0].map(h => h.trim().toLowerCase());
    const batch = writeBatch(db);
    rows.slice(1).forEach((row, index) => {
      const value = (name: string) => row[headers.indexOf(name)]?.trim() ?? "";
      const tag = value("tag") || value("device tag") || value("equipment tag");
      if (!tag) return;
      const id = tag.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `device-${index}`;
      batch.set(doc(db, "devices", id), {
        id, tag, kks: value("kks") || value("kks code"), type: value("type") || value("device type"),
        subsystem: value("subsystem") || "Other", location: value("location") || value("to") || value("destination"),
        from: value("from") || value("origin"), to: value("to") || value("destination"), notes: value("notes"),
        stages: blankStages(), updatedAt: serverTimestamp(), updatedBy: user?.email
      }, { merge: true });
    });
    await batch.commit(); setMenu(false);
  }

  if (!firebaseReady) return <SetupScreen />;
  if (!authChecked) return <div className="center"><div className="spinner" /></div>;
  if (!user) return <Login />;

  return <main>
    <header className="topbar">
      <div className="brand"><span className="brandmark">A</span><div><b>AGULHAS MTS</b><small>Commissioning tracker</small></div></div>
      <button className="iconButton" onClick={() => setMenu(!menu)} aria-label="Settings"><Settings2 size={20} /></button>
      {menu && <div className="menu">
        <button onClick={loadStarterRegister}>Load starter register</button>
        <label><Upload size={16} /> Import CSV<input type="file" accept=".csv" onChange={e => e.target.files?.[0] && importCsv(e.target.files[0])} /></label>
        <button onClick={() => signOut(auth)}><LogOut size={16} /> Sign out</button>
      </div>}
    </header>

    <section className="hero">
      <div><span className="eyebrow">JOB 78100 · LIVE PROGRESS</span><h1>Field wiring</h1><p>{completed} of {devices.length} devices fully complete</p></div>
      <div className="progressRing" style={{ "--progress": `${percent * 3.6}deg` } as React.CSSProperties}><div><b>{percent}%</b><small>overall</small></div></div>
    </section>

    <section className="stageSummary">
      {stages.map(stage => <div key={stage}><b>{devices.filter(d => d.stages?.[stage]).length}</b><span>{stageLabels[stage]}</span></div>)}
    </section>

    <section className="controls">
      <label className="search"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tag, KKS or location" />{query && <button onClick={() => setQuery("")}><X size={16}/></button>}</label>
      <div className="filterRow"><label className="select">{system}<ChevronDown size={16}/><select value={system} onChange={e => setSystem(e.target.value)}>{systems.map(s => <option key={s}>{s}</option>)}</select></label><label className="switch"><input type="checkbox" checked={showComplete} onChange={e => setShowComplete(e.target.checked)} /><span/> Show completed</label></div>
    </section>

    <section className="list">
      <div className="listHeading"><span>{filtered.length} devices</span><span>Tap a device for details</span></div>
      {!devices.length && <EmptyState onLoad={loadStarterRegister} />}
      {filtered.map(device => {
        const count = stages.filter(s => device.stages?.[s]).length;
        return <article className={`device ${count === 4 ? "done" : ""}`} key={device.id} onClick={() => setSelected(device)}>
          <div className="deviceTop"><div><span className="tag">{device.tag}</span><h2>{device.type || "Field device"}</h2><p>{device.location}</p></div><div className="count">{count}/4</div></div>
          <div className="miniStages">{stages.map(stage => <button key={stage} className={device.stages?.[stage] ? "checked" : ""} onClick={e => { e.stopPropagation(); toggleStage(device, stage); }}><span>{device.stages?.[stage] && <Check size={13}/>}</span>{stageLabels[stage]}</button>)}</div>
          <div className="meta"><span>{device.subsystem}</span>{device.kks && <code>{device.kks}</code>}</div>
        </article>;
      })}
    </section>

    {selected && <div className="scrim" onClick={() => setSelected(null)}><aside className="sheet" onClick={e => e.stopPropagation()}><div className="grab"/><button className="close" onClick={() => setSelected(null)}><X/></button><span className="eyebrow">{selected.subsystem}</span><h2>{selected.tag}</h2><p className="location">{selected.location}</p>{selected.kks && <div className="data"><span>KKS / cable code</span><b>{selected.kks}</b></div>}<h3>Work stages</h3><div className="detailStages">{stages.map(stage => <button key={stage} className={selected.stages?.[stage] ? "checked" : ""} onClick={() => toggleStage(selected, stage)}><span>{selected.stages?.[stage] ? <Check/> : null}</span><div><b>{stageLabels[stage]}</b><small>{selected.stages?.[stage] ? "Complete — tap to undo" : "Tap to mark complete"}</small></div></button>)}</div>{selected.updatedBy && <p className="audit">Last changed by {selected.updatedBy}</p>}</aside></div>}
  </main>;
}

function Login() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState("");
  async function submit(e: React.FormEvent) { e.preventDefault(); setError(""); try { await signInWithEmailAndPassword(auth, email, password); } catch { setError("Sign-in failed. Check the email and password."); } }
  return <div className="loginPage"><div className="loginCard"><span className="brandmark large">A</span><span className="eyebrow">AGULHAS MTS · JOB 78100</span><h1>Commissioning<br/>tracker</h1><p>Secure field progress for the installation team.</p><form onSubmit={submit}><label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required/></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required/></label>{error && <div className="error"><CircleAlert size={16}/>{error}</div>}<button type="submit">Sign in</button></form></div></div>;
}

function SetupScreen() { return <div className="loginPage"><div className="loginCard"><span className="brandmark large">A</span><span className="eyebrow">ONE-TIME SETUP</span><h1>Connect Firebase</h1><p>Copy <code>.env.example</code> to <code>.env.local</code> and add the six values from Firebase project settings.</p><div className="error"><CircleAlert size={16}/>Firebase environment variables are missing.</div></div></div>; }
function EmptyState({ onLoad }: { onLoad: () => void }) { return <div className="empty"><div className="emptyIcon"><Check/></div><h2>No devices loaded</h2><p>Load the Agulhas starter register, or import a CSV from the settings menu.</p><button onClick={onLoad}>Load starter register</button></div>; }

function parseCsvRow(line: string) { const out: string[] = []; let value = ""; let quoted = false; for (let i=0;i<line.length;i++) { const char=line[i]; if(char==='"' && line[i+1]==='"'){value+='"';i++;} else if(char==='"'){quoted=!quoted;} else if(char===',' && !quoted){out.push(value);value="";} else value+=char; } out.push(value); return out; }
