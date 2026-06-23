import { useState, useRef } from "react";

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORIES = {
  work:     { label: "Work",      emoji: "💼", color: "#3B82F6", bg: "#EFF6FF", keywords: ["meeting","project","deadline","report","email","call","client","team","office","work","boss","review","presentation","budget","hire"] },
  personal: { label: "Personal",  emoji: "🏠", color: "#8B5CF6", bg: "#F5F3FF", keywords: ["family","home","personal","health","gym","doctor","appointment","birthday","anniversary","self"] },
  shopping: { label: "Shopping",  emoji: "🛒", color: "#F59E0B", bg: "#FFFBEB", keywords: ["buy","get","shop","store","grocery","order","purchase","need","pick up","amazon","target"] },
  idea:     { label: "Ideas",     emoji: "💡", color: "#10B981", bg: "#ECFDF5", keywords: ["idea","think","maybe","consider","explore","what if","could","might","brainstorm","concept","build","create"] },
  reminder: { label: "Reminder",  emoji: "🔔", color: "#EF4444", bg: "#FEF2F2", keywords: ["remember","don't forget","remind","must","important","urgent","asap","today","tomorrow","due","deadline"] },
  other:    { label: "Other",     emoji: "📌", color: "#6B7280", bg: "#F9FAFB", keywords: [] },
};

const COLORS = [
  { name: "Yellow",  bg: "#FEF08A", border: "#EAB308" },
  { name: "Pink",    bg: "#FBCFE8", border: "#EC4899" },
  { name: "Blue",    bg: "#BAE6FD", border: "#0EA5E9" },
  { name: "Green",   bg: "#BBF7D0", border: "#22C55E" },
  { name: "Orange",  bg: "#FED7AA", border: "#F97316" },
  { name: "Purple",  bg: "#E9D5FF", border: "#A855F7" },
  { name: "Mint",    bg: "#CCFBF1", border: "#14B8A6" },
  { name: "Rose",    bg: "#FFE4E6", border: "#F43F5E" },
];

const PRIORITY = {
  high:   { label: "High",   dot: "🔴", color: "#EF4444", bg: "#FEE2E2" },
  medium: { label: "Medium", dot: "🟡", color: "#F59E0B", bg: "#FEF3C7" },
  low:    { label: "Low",    dot: "⚪", color: "#6B7280", bg: "#F3F4F6" },
};

function detectCategory(text) {
  const lower = text.toLowerCase();
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    if (key === "other") continue;
    if (cat.keywords.some(kw => lower.includes(kw))) return key;
  }
  return "other";
}

function detectPriority(text) {
  if (/urgent|asap|critical|immediately|today|now!/i.test(text)) return "high";
  if (/soon|this week|important|priority|due/i.test(text)) return "medium";
  return "low";
}

function fmtDate(d) {
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

let _id = 100;
const uid = () => ++_id;

const SAMPLE = [
  { id: uid(), title: "Q3 Review Meeting", content: "Prepare slides\nDiscuss hiring pipeline\nReview budget allocations\nSet goals for Q4", color: "#BAE6FD", category: "work",     priority: "high",   completed: false, createdAt: Date.now() - 86400000 * 2, image: null },
  { id: uid(), title: "Grocery Run",        content: "Milk & eggs\nFresh vegetables\nChicken breast\nOlive oil\nSourdough bread",           color: "#FEF08A", category: "shopping",  priority: "medium", completed: false, createdAt: Date.now() - 86400000,     image: null },
  { id: uid(), title: "App idea 💡",        content: "Minimalist habit tracker\nMax 3 habits at a time\nDaily check-in widget\nStreak visualization", color: "#BBF7D0", category: "idea", priority: "low",    completed: false, createdAt: Date.now() - 3600000 * 5,  image: null },
  { id: uid(), title: "Call dentist",       content: "Book cleaning appointment\nAsk about whitening options", color: "#FBCFE8", category: "reminder", priority: "medium", completed: true,  createdAt: Date.now() - 86400000 * 3, image: null },
];

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function StickyBoard() {
  const [notes, setNotes]               = useState(SAMPLE);
  const [modal, setModal]               = useState(null);   // null | "add" | "edit" | "scan" | "view"
  const [editTarget, setEditTarget]     = useState(null);
  const [viewTarget, setViewTarget]     = useState(null);
  const [search, setSearch]             = useState("");
  const [filterCat, setFilterCat]       = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");
  const [viewMode, setViewMode]         = useState("grid");
  const [sortBy, setSortBy]             = useState("newest");

  const [form, setForm] = useState(blankForm());
  const fileRef   = useRef();
  const cameraRef = useRef();

  function blankForm() {
    return { title: "", content: "", color: COLORS[0].bg, category: "auto", priority: "auto", image: null };
  }

  function openAdd(mode = "manual") {
    setForm(blankForm());
    setEditTarget(null);
    setModal(mode === "scan" ? "scan" : "add");
  }

  function openEdit(note) {
    setForm({ title: note.title, content: note.content, color: note.color, category: note.category, priority: note.priority, image: note.image });
    setEditTarget(note);
    setModal("add");
  }

  function openView(note) { setViewTarget(note); setModal("view"); }

  function handleImage(file) {
    if (!file) return;
    const r = new FileReader();
    r.onload = e => setForm(f => ({ ...f, image: e.target.result }));
    r.readAsDataURL(file);
  }

  function saveNote() {
    const text = `${form.title} ${form.content}`;
    const category = form.category === "auto" ? detectCategory(text) : form.category;
    const priority  = form.priority  === "auto" ? detectPriority(text)  : form.priority;
    if (editTarget) {
      setNotes(ns => ns.map(n => n.id === editTarget.id ? { ...n, ...form, category, priority } : n));
    } else {
      setNotes(ns => [{ id: uid(), ...form, category, priority, completed: false, createdAt: Date.now() }, ...ns]);
    }
    setModal(null);
  }

  function toggle(id) { setNotes(ns => ns.map(n => n.id === id ? { ...n, completed: !n.completed } : n)); }
  function del(id)    { setNotes(ns => ns.filter(n => n.id !== id)); }

  const filtered = notes
    .filter(n => {
      if (filterStatus === "active"    && n.completed)  return false;
      if (filterStatus === "completed" && !n.completed) return false;
      if (filterCat !== "all" && n.category !== filterCat) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!n.title.toLowerCase().includes(q) && !n.content.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest")   return b.createdAt - a.createdAt;
      if (sortBy === "oldest")   return a.createdAt - b.createdAt;
      if (sortBy === "priority") { const p = { high: 0, medium: 1, low: 2 }; return p[a.priority] - p[b.priority]; }
      if (sortBy === "alpha")    return a.title.localeCompare(b.title);
      return 0;
    });

  const counts = { active: notes.filter(n => !n.completed).length, completed: notes.filter(n => n.completed).length, all: notes.length };

  return (
    <div style={s.root}>
      <style>{CSS}</style>

      {/* ── Header ── */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logo}>
            <span style={{ fontSize: 22 }}>🗒️</span>
            <span style={s.logoText}>StickyBoard</span>
          </div>

          <div style={s.searchWrap}>
            <span style={s.searchIcon}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes…"
              style={s.searchInput}
            />
            {search && <button style={s.clearBtn} onClick={() => setSearch("")}>✕</button>}
          </div>

          <div style={s.headerActions}>
            <button className="btn-ghost" onClick={() => openAdd("scan")} style={s.scanBtn}>
              <span>📷</span><span className="hide-xs"> Scan</span>
            </button>
            <button className="btn-primary" onClick={() => openAdd("manual")} style={s.addBtn}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span><span className="hide-xs"> Add Note</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Toolbar ── */}
      <div style={s.toolbar}>
        <div style={s.toolbarInner}>
          {/* Status tabs */}
          <div style={s.tabs}>
            {[["active","Active"], ["completed","Completed"], ["all","All"]].map(([v, label]) => (
              <button key={v} onClick={() => setFilterStatus(v)}
                className={filterStatus === v ? "tab-active" : "tab"}>
                {label}
                <span className={filterStatus === v ? "badge-active" : "badge"}>{counts[v]}</span>
              </button>
            ))}
          </div>

          <div style={s.toolbarRight}>
            {/* Category filter */}
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={s.select}>
              <option value="all">All Categories</option>
              {Object.entries(CATEGORIES).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>

            {/* Sort */}
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={s.select}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="priority">Priority</option>
              <option value="alpha">A–Z</option>
            </select>

            {/* View toggle */}
            <div style={s.viewToggle}>
              {[["grid","⊞"],["list","☰"]].map(([v, icon]) => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={viewMode === v ? "view-btn-active" : "view-btn"}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Board ── */}
      <main style={s.main}>
        {filtered.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 56 }}>🗒️</div>
            <p style={{ fontWeight: 700, fontSize: 18, margin: "12px 0 6px" }}>No notes here</p>
            <p style={{ color: "#9CA3AF", fontSize: 14, margin: 0 }}>
              {search ? "Try a different search term" : "Add a sticky note or scan one to get started"}
            </p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "note-grid" : "note-list"}>
            {filtered.map(note => (
              <NoteCard key={note.id} note={note} view={viewMode} onToggle={toggle} onEdit={openEdit} onDelete={del} onView={openView} />
            ))}
          </div>
        )}
      </main>

      {/* ── FAB ── */}
      <button className="fab" onClick={() => openAdd("manual")}>+</button>

      {/* ── Modals ── */}
      {(modal === "add" || modal === "scan") && (
        <Modal onClose={() => setModal(null)}>
          <FormModal
            form={form} setForm={setForm}
            mode={modal} setMode={setModal}
            editing={!!editTarget}
            onSave={saveNote}
            onClose={() => setModal(null)}
            fileRef={fileRef} cameraRef={cameraRef}
            handleImage={handleImage}
          />
        </Modal>
      )}

      {modal === "view" && viewTarget && (
        <Modal onClose={() => setModal(null)}>
          <ViewModal note={viewTarget} onClose={() => setModal(null)} onEdit={() => { openEdit(viewTarget); }} onToggle={toggle} />
        </Modal>
      )}

      {/* hidden file inputs */}
      <input ref={fileRef}   type="file" accept="image/*"             style={{ display:"none" }} onChange={e => handleImage(e.target.files[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e => handleImage(e.target.files[0])} />
    </div>
  );
}

// ─── NoteCard ─────────────────────────────────────────────────────────────────

function NoteCard({ note, view, onToggle, onEdit, onDelete, onView }) {
  const [hover, setHover] = useState(false);
  const cat  = CATEGORIES[note.category] || CATEGORIES.other;
  const pri  = PRIORITY[note.priority];
  const lines = note.content.split("\n").filter(Boolean);
  const color = COLORS.find(c => c.bg === note.color) || COLORS[0];

  const cardStyle = {
    background:  note.completed ? "#F9FAFB" : note.color,
    border:      `1px solid ${note.completed ? "#E5E7EB" : color.border + "66"}`,
    borderLeft:  `4px solid ${note.completed ? "#E5E7EB" : color.border}`,
    borderRadius: 12,
    padding:     view === "list" ? "12px 14px" : 16,
    opacity:     note.completed ? 0.72 : 1,
    boxShadow:   hover && !note.completed ? `0 4px 16px ${color.border}33` : note.completed ? "none" : "0 2px 6px rgba(0,0,0,0.06)",
    transition:  "all 0.18s ease",
    cursor:      "default",
    display:     view === "list" ? "flex" : "block",
    alignItems:  view === "list" ? "flex-start" : undefined,
    gap:         view === "list" ? 12 : undefined,
    position:    "relative",
  };

  return (
    <div style={cardStyle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {/* Checkbox */}
      <button onClick={() => onToggle(note.id)} style={s.checkbox(note.completed)}>
        {note.completed && <span style={{ fontSize: 11, lineHeight: 1 }}>✓</span>}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Image thumbnail */}
        {note.image && (
          <div style={{ marginBottom: 8, borderRadius: 8, overflow: "hidden", cursor: "pointer" }} onClick={() => onView(note)}>
            <img src={note.image} alt="Note scan" style={{ width: "100%", maxHeight: view === "list" ? 60 : 140, objectFit: "cover", display: "block" }} />
          </div>
        )}

        {/* Title row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
          <span
            style={{ flex: 1, fontWeight: 700, fontSize: view === "list" ? 14 : 15, lineHeight: 1.35,
              textDecoration: note.completed ? "line-through" : "none", color: note.completed ? "#9CA3AF" : "#111827",
              cursor: "pointer" }}
            onClick={() => onView(note)}>
            {note.title || <span style={{ color: "#9CA3AF", fontWeight: 400 }}>Untitled</span>}
          </span>
          <div style={{ display: hover ? "flex" : "none", gap: 2, flexShrink: 0 }}>
            <Btn onClick={() => onEdit(note)}     title="Edit">✏️</Btn>
            <Btn onClick={() => onDelete(note.id)} title="Delete" danger>🗑️</Btn>
          </div>
        </div>

        {/* Content */}
        {lines.length > 0 && view !== "list" && (
          <ul style={{ margin: "0 0 10px", padding: 0, listStyle: "none" }}>
            {lines.slice(0, 4).map((ln, i) => (
              <li key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 3 }}>
                <span style={{ color: color.border, fontSize: 9, marginTop: 5, flexShrink: 0 }}>●</span>
                <span style={{ fontSize: 13, color: note.completed ? "#9CA3AF" : "#374151", lineHeight: 1.5, textDecoration: note.completed ? "line-through" : "none" }}>{ln}</span>
              </li>
            ))}
            {lines.length > 4 && (
              <li style={{ fontSize: 12, color: "#9CA3AF", cursor: "pointer" }} onClick={() => onView(note)}>
                +{lines.length - 4} more…
              </li>
            )}
          </ul>
        )}

        {view === "list" && note.content && (
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {note.content.replace(/\n/g, "  •  ")}
          </p>
        )}

        {/* Footer chips */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 5, marginTop: view === "list" ? 4 : 0 }}>
          <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 10, background: cat.bg, color: cat.color, fontWeight: 600 }}>
            {cat.emoji} {cat.label}
          </span>
          {note.priority !== "low" && (
            <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 10, background: pri.bg, color: pri.color, fontWeight: 600 }}>
              {pri.dot} {pri.label}
            </span>
          )}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9CA3AF" }}>{fmtDate(note.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── FormModal ────────────────────────────────────────────────────────────────

function FormModal({ form, setForm, mode, setMode, editing, onSave, onClose, fileRef, cameraRef, handleImage }) {
  const valid = form.title.trim() || form.content.trim() || form.image;
  const previewColor = COLORS.find(c => c.bg === form.color) || COLORS[0];

  return (
    <>
      <div style={s.modalHeader}>
        <h2 style={s.modalTitle}>{editing ? "Edit Note" : "New Sticky Note"}</h2>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
      </div>

      {/* Mode tabs */}
      {!editing && (
        <div style={{ display: "flex", gap: 8, padding: "12px 20px 0" }}>
          {[["add","✏️ Manual"], ["scan","📷 Scan / Photo"]].map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)}
              className={mode === m ? "mode-tab-active" : "mode-tab"}>
              {label}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>

        {/* ── Scan pane ── */}
        {mode === "scan" && (
          <div style={{ marginBottom: 16 }}>
            {form.image ? (
              <div style={{ position: "relative" }}>
                <img src={form.image} alt="Preview" style={{ width: "100%", maxHeight: 260, objectFit: "contain", borderRadius: 10, background: "#F3F4F6", display: "block" }} />
                <button onClick={() => setForm(f => ({ ...f, image: null }))}
                  style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>✕</button>
              </div>
            ) : (
              <div style={s.dropzone}>
                <div style={{ fontSize: 44, marginBottom: 8 }}>📷</div>
                <p style={{ margin: "0 0 14px", color: "#6B7280", fontSize: 14 }}>Take a photo or upload an image of your sticky note</p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <button className="btn-ghost" onClick={() => cameraRef.current?.click()} style={{ padding: "9px 18px" }}>📱 Camera</button>
                  <button className="btn-ghost" onClick={() => fileRef.current?.click()}   style={{ padding: "9px 18px" }}>📁 Upload File</button>
                </div>
              </div>
            )}
            <p style={{ margin: "10px 0 0", fontSize: 12, color: "#9CA3AF", textAlign: "center" }}>
              After scanning, add a title and any extra notes below
            </p>
          </div>
        )}

        {/* Title */}
        <label style={s.label}>TITLE</label>
        <input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="Give your note a title…"
          style={s.input}
          autoFocus={mode === "add"}
        />

        {/* Content */}
        <label style={s.label}>CONTENT <span style={{ color: "#9CA3AF", fontWeight: 400, textTransform: "none" }}>(each line = bullet)</span></label>
        <textarea
          value={form.content}
          onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          placeholder="Write your note here…&#10;Each line becomes a bullet point"
          rows={5}
          style={{ ...s.input, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
        />

        {/* Color */}
        <label style={s.label}>COLOR</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {COLORS.map(c => (
            <button key={c.bg} title={c.name} onClick={() => setForm(f => ({ ...f, color: c.bg }))}
              style={{ width: 30, height: 30, borderRadius: "50%", background: c.bg, border: `3px solid ${form.color === c.bg ? c.border : "transparent"}`, cursor: "pointer", outline: form.color === c.bg ? `2px solid ${c.border}44` : "none", transition: "all 0.15s" }} />
          ))}
        </div>

        {/* Category + Priority */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={s.label}>CATEGORY</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={s.select}>
              <option value="auto">✨ Auto-detect</option>
              {Object.entries(CATEGORIES).map(([k, c]) => <option key={k} value={k}>{c.emoji} {c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={s.label}>PRIORITY</label>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={s.select}>
              <option value="auto">✨ Auto-detect</option>
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">⚪ Low</option>
            </select>
          </div>
        </div>

        {/* Live preview */}
        {(form.title || form.content) && (
          <div style={{ ...s.preview, background: form.color, borderLeft: `4px solid ${previewColor.border}` }}>
            <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: 1 }}>PREVIEW</p>
            {form.title   && <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14, color: "#111827" }}>{form.title}</p>}
            {form.content && <p style={{ margin: 0, fontSize: 13, color: "#374151", whiteSpace: "pre-wrap" }}>{form.content.slice(0, 120)}{form.content.length > 120 ? "…" : ""}</p>}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1, padding: "11px" }}>Cancel</button>
          <button onClick={onSave} disabled={!valid} className={valid ? "btn-primary" : "btn-disabled"} style={{ flex: 2, padding: "11px", fontWeight: 700 }}>
            {editing ? "Save Changes" : "Add to Board"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── ViewModal ────────────────────────────────────────────────────────────────

function ViewModal({ note, onClose, onEdit, onToggle }) {
  const cat   = CATEGORIES[note.category] || CATEGORIES.other;
  const pri   = PRIORITY[note.priority];
  const color = COLORS.find(c => c.bg === note.color) || COLORS[0];
  const lines = note.content.split("\n").filter(Boolean);

  return (
    <>
      <div style={{ ...s.modalHeader, background: note.color, borderBottom: `1px solid ${color.border}44` }}>
        <h2 style={{ ...s.modalTitle, color: "#111827" }}>{note.title || "Untitled"}</h2>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
      </div>
      <div style={{ padding: 20 }}>
        {note.image && (
          <img src={note.image} alt="Scan" style={{ width: "100%", borderRadius: 10, marginBottom: 14, maxHeight: 300, objectFit: "contain", background: "#F9FAFB" }} />
        )}
        {lines.length > 0 && (
          <ul style={{ margin: "0 0 16px", padding: 0, listStyle: "none" }}>
            {lines.map((ln, i) => (
              <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                <span style={{ color: color.border, fontSize: 10, marginTop: 4, flexShrink: 0 }}>●</span>
                <span style={{ fontSize: 15, color: "#374151", lineHeight: 1.6 }}>{ln}</span>
              </li>
            ))}
          </ul>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 12, background: cat.bg, color: cat.color, fontWeight: 600 }}>{cat.emoji} {cat.label}</span>
          <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 12, background: pri.bg, color: pri.color, fontWeight: 600 }}>{pri.dot} {pri.label} priority</span>
          <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 12, background: "#F3F4F6", color: "#6B7280" }}>📅 {fmtDate(note.createdAt)}</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { onToggle(note.id); onClose(); }} className="btn-ghost" style={{ flex: 1, padding: 11 }}>
            {note.completed ? "↩ Reopen" : "✓ Mark Complete"}
          </button>
          <button onClick={onEdit} className="btn-primary" style={{ flex: 1, padding: 11, fontWeight: 600 }}>✏️ Edit</button>
        </div>
      </div>
    </>
  );
}

// ─── Generic Modal Wrapper ────────────────────────────────────────────────────

function Modal({ children, onClose }) {
  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modalBox}>
        {children}
      </div>
    </div>
  );
}

function Btn({ onClick, children, danger, title }) {
  const [h, setH] = useState(false);
  return (
    <button title={title} onClick={e => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: h ? (danger ? "#FEE2E2" : "rgba(0,0,0,0.08)") : "transparent",
        border: "none", borderRadius: 6, padding: "3px 5px", cursor: "pointer", fontSize: 14, transition: "all 0.15s" }}>
      {children}
    </button>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  root:        { minHeight: "100vh", background: "#F3F4F6", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: "#111827" },
  header:      { background: "#fff", borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  headerInner: { maxWidth: 1280, margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 },
  logo:        { display: "flex", alignItems: "center", gap: 7, flexShrink: 0 },
  logoText:    { fontWeight: 800, fontSize: 20, background: "linear-gradient(135deg,#F59E0B,#EF4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  searchWrap:  { flex: 1, position: "relative", maxWidth: 380 },
  searchIcon:  { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14 },
  searchInput: { width: "100%", padding: "9px 32px 9px 32px", borderRadius: 20, border: "1px solid #E5E7EB", background: "#F9FAFB", fontSize: 14, outline: "none", color: "#111827", boxSizing: "border-box", transition: "border-color 0.2s" },
  clearBtn:    { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 13 },
  headerActions: { display: "flex", gap: 8, flexShrink: 0 },
  scanBtn:     { display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", color: "#374151", cursor: "pointer", fontSize: 14, fontWeight: 500 },
  addBtn:      { display: "flex", alignItems: "center", gap: 5, padding: "8px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#F59E0B,#EF4444)", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700 },
  toolbar:     { background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "0 16px" },
  toolbarInner:{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "8px 0" },
  tabs:        { display: "flex", gap: 4 },
  toolbarRight:{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "center", flexWrap: "wrap" },
  select:      { padding: "7px 10px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#374151", fontSize: 13, outline: "none", cursor: "pointer" },
  viewToggle:  { display: "flex", border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden" },
  main:        { maxWidth: 1280, margin: "0 auto", padding: 16 },
  empty:       { textAlign: "center", padding: "80px 20px", color: "#9CA3AF" },
  overlay:     { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  modalBox:    { background: "#fff", borderRadius: 16, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column" },
  modalHeader: { padding: "16px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "16px 16px 0 0" },
  modalTitle:  { margin: 0, fontSize: 18, fontWeight: 800 },
  closeBtn:    { background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 18, padding: 4 },
  label:       { display: "block", fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", marginBottom: 5, textTransform: "uppercase" },
  input:       { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#111827", fontSize: 14, outline: "none", marginBottom: 14, boxSizing: "border-box", transition: "border-color 0.2s" },
  dropzone:    { border: "2px dashed #E5E7EB", borderRadius: 12, padding: "36px 20px", textAlign: "center", background: "#F9FAFB", marginBottom: 4 },
  preview:     { borderRadius: 10, padding: "12px 14px", marginBottom: 16 },
  checkbox:    (done) => ({
    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
    border: `2px solid ${done ? "#10B981" : "#D1D5DB"}`,
    background: done ? "#10B981" : "transparent",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 700, float: "left", marginRight: 8, marginTop: 1,
    transition: "all 0.18s",
  }),
};

const CSS = `
  * { box-sizing: border-box; }

  .note-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
  }
  .note-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  @media (max-width: 480px) {
    .note-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
    .hide-xs { display: none; }
  }
  @media (max-width: 340px) {
    .note-grid { grid-template-columns: 1fr; }
  }

  .tab, .tab-active {
    padding: 7px 13px; border-radius: 20px; border: none; cursor: pointer;
    font-size: 13px; font-weight: 500; transition: all 0.15s;
  }
  .tab        { background: transparent; color: #6B7280; }
  .tab:hover  { background: #F3F4F6; }
  .tab-active { background: #FEF3C7; color: #92400E; font-weight: 700; }

  .badge, .badge-active {
    margin-left: 5px; padding: 1px 6px; border-radius: 10px; font-size: 11px;
  }
  .badge        { background: #E5E7EB; color: #6B7280; }
  .badge-active { background: #F59E0B; color: #fff; }

  .view-btn, .view-btn-active {
    padding: 6px 10px; border: none; cursor: pointer; font-size: 15px; transition: background 0.15s;
  }
  .view-btn        { background: #fff; color: #6B7280; }
  .view-btn:hover  { background: #F3F4F6; }
  .view-btn-active { background: #E5E7EB; color: #111827; }

  .mode-tab, .mode-tab-active {
    flex: 1; padding: 8px; border-radius: 8px; border: 2px solid transparent;
    cursor: pointer; font-size: 13px; transition: all 0.15s;
  }
  .mode-tab        { background: #F3F4F6; color: #6B7280; border-color: transparent; }
  .mode-tab:hover  { border-color: #E5E7EB; }
  .mode-tab-active { background: #FEF3C7; color: #92400E; font-weight: 700; border-color: #F59E0B; }

  .btn-ghost {
    border: 1px solid #E5E7EB; background: #fff; color: #374151;
    border-radius: 8px; cursor: pointer; font-size: 14px; transition: all 0.15s;
  }
  .btn-ghost:hover { background: #F9FAFB; border-color: #D1D5DB; }

  .btn-primary {
    border: none; background: linear-gradient(135deg, #F59E0B, #EF4444);
    color: #fff; border-radius: 8px; cursor: pointer; font-size: 14px;
  }
  .btn-primary:hover { opacity: 0.92; }

  .btn-disabled {
    border: none; background: #E5E7EB; color: #9CA3AF;
    border-radius: 8px; cursor: not-allowed; font-size: 14px;
  }

  .fab {
    position: fixed; bottom: 22px; right: 22px;
    width: 56px; height: 56px; border-radius: 50%;
    background: linear-gradient(135deg, #F59E0B, #EF4444);
    border: none; color: #fff; font-size: 30px; font-weight: 300;
    cursor: pointer; box-shadow: 0 4px 20px rgba(245,158,11,0.45);
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s, box-shadow 0.2s;
    z-index: 40;
  }
  .fab:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(245,158,11,0.55); }

  input:focus, textarea:focus, select:focus {
    border-color: #F59E0B !important;
    box-shadow: 0 0 0 3px rgba(245,158,11,0.15);
  }
`;
