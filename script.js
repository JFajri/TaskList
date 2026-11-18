(() => {
  "use strict";

  const STORAGE_KEY = "taskly_tasks_v1";
  const FOCUS_KEY = "taskly_focus_v1";
  const THEME_KEY = "taskly_theme";
  const ACCENT_KEY = "taskly_accent";
  const BASE_TITLE = document.title;
  const RING_LENGTH = 2 * Math.PI * 52;

  const PRIORITY = {
    low: { label: "Rendah", weight: 1 },
    med: { label: "Sedang", weight: 2 },
    high: { label: "Tinggi", weight: 3 }
  };
  const REPEATS = {
    none: "Tidak berulang",
    daily: "Setiap hari",
    weekly: "Setiap minggu",
    monthly: "Setiap bulan"
  };
  const REPEAT_SHORT = { daily: "Harian", weekly: "Mingguan", monthly: "Bulanan" };
  const CATEGORIES = [
    { id: "kerja", label: "Kerja", color: "#3b82f6" },
    { id: "pribadi", label: "Pribadi", color: "#ec4899" },
    { id: "belajar", label: "Belajar", color: "#8b5cf6" },
    { id: "belanja", label: "Belanja", color: "#f59e0b" },
    { id: "kesehatan", label: "Kesehatan", color: "#10b981" }
  ];
  const MODES = { focus: 25, break: 5 };
  const FILTER_TITLES = {
    all: "Semua tugas",
    today: "Tugas hari ini",
    pending: "Belum selesai",
    overdue: "Tugas terlambat",
    starred: "Berbintang",
    completed: "Tugas selesai"
  };

  const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const ICON_EDIT = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>';
  const ICON_TRASH = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3"/></svg>';
  const ICON_STAR = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.7 6.9 19.4l1-5.6-4.1-4 5.7-.8L12 3.8z"/></svg>';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const els = {
    list: $("#taskList"),
    empty: $("#emptyState"),
    emptyTitle: $("#emptyTitle"),
    emptyText: $("#emptyText"),
    form: $("#addForm"),
    input: $("#taskInput"),
    date: $("#dateInput"),
    catInput: $("#catInput"),
    repeatInput: $("#repeatInput"),
    search: $("#searchInput"),
    sort: $("#sortSelect"),
    title: $("#pageTitle"),
    toast: $("#toast"),
    catNav: $("#catNav"),
    focusLabel: $("#focusLabel"),
    focusTitle: $("#focusTitle"),
    focusMeta: $("#focusMeta"),
    focusDone: $("#focusDone"),
    ringBar: $("#ringBar"),
    ringWrap: $("#ringWrap"),
    progressNumber: $("#progressNumber"),
    progressCaption: $("#progressCaption"),
    sessionNote: $("#sessionNote"),
    timerTime: $("#timerTime"),
    timerToggle: $("#timerToggle"),
    timerReset: $("#timerReset"),
    taskDialog: $("#taskDialog"),
    taskForm: $("#taskForm"),
    dTitle: $("#dTitle"),
    dNotes: $("#dNotes"),
    dDate: $("#dDate"),
    dPriority: $("#dPriority"),
    dCategory: $("#dCategory"),
    dRepeat: $("#dRepeat"),
    dStar: $("#dStar"),
    dDelete: $("#dDelete"),
    subList: $("#subList"),
    subInput: $("#subInput"),
    subAdd: $("#subAdd"),
    subCount: $("#subCount"),
    statsDialog: $("#statsDialog"),
    statsBody: $("#statsBody"),
    settingsDialog: $("#settingsDialog"),
    importFile: $("#importFile")
  };

  /* ---------- Tanggal (zona waktu lokal) ---------- */
  function ymd(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  const today = () => ymd(new Date());

  function addDays(dateStr, n) {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + n);
    return ymd(d);
  }

  function nextDate(dateStr, rule) {
    if (rule === "daily") return addDays(dateStr, 1);
    if (rule === "weekly") return addDays(dateStr, 7);
    const d = new Date(dateStr + "T00:00:00");
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last));
    return ymd(d);
  }

  function dayDiff(dateStr) {
    const a = new Date(dateStr + "T00:00:00");
    const b = new Date(today() + "T00:00:00");
    return Math.round((a - b) / 86400000);
  }

  function formatDate(d) {
    if (!d) return "Tanpa tanggal";
    return new Date(d + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  }

  function dueText(d) {
    if (!d) return "Tanpa tanggal";
    const diff = dayDiff(d);
    if (diff === 0) return "Hari ini";
    if (diff === 1) return "Besok";
    if (diff === -1) return "Kemarin";
    return formatDate(d);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
  }

  const uid = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);
  const catById = id => CATEGORIES.find(c => c.id === id);

  /* ---------- Data ---------- */
  function normalize(t) {
    const completedAt = Number(t.completedAt);
    return {
      id: t.id ?? uid(),
      title: String(t.title).slice(0, 120),
      date: /^\d{4}-\d{2}-\d{2}$/.test(t.date || "") ? t.date : "",
      done: !!t.done,
      created: Number(t.created) || Number(t.id) || Date.now(),
      priority: PRIORITY[t.priority] ? t.priority : "med",
      category: catById(t.category) ? t.category : "",
      notes: typeof t.notes === "string" ? t.notes.slice(0, 2000) : "",
      subtasks: Array.isArray(t.subtasks)
        ? t.subtasks
            .filter(s => s && typeof s.title === "string")
            .slice(0, 50)
            .map(s => ({ id: s.id ?? uid(), title: s.title.slice(0, 120), done: !!s.done }))
        : [],
      repeat: REPEATS[t.repeat] ? t.repeat : "none",
      starred: !!t.starred,
      completedAt: t.done && completedAt > 0 ? completedAt : null,
      spawnedId: t.spawnedId ?? null
    };
  }

  function loadTasks() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(raw) ? raw.filter(t => t && typeof t.title === "string").map(normalize) : [];
    } catch {
      return [];
    }
  }

  function loadFocus() {
    try {
      const raw = JSON.parse(localStorage.getItem(FOCUS_KEY) || "{}");
      return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    } catch {
      return {};
    }
  }

  let tasks = loadTasks();
  let focusLog = loadFocus();
  let currentFilter = "all";
  let currentCat = "";
  let query = "";
  let justDone = null;
  let focusId = null;
  let snapshot = null;
  let toastTimer = null;
  let draft = null;

  const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch {} };
  const saveFocus = () => { try { localStorage.setItem(FOCUS_KEY, JSON.stringify(focusLog)); } catch {} };
  const find = id => tasks.find(t => String(t.id) === String(id));
  const isOverdue = t => !t.done && t.date && dayDiff(t.date) < 0;

  /* ---------- Input cepat ---------- */
  function parseQuick(raw) {
    let title = raw, category = "", priority = "", date = "";

    title = title.replace(/(^|\s)#([\p{L}\d_-]+)/giu, (m, sp, tag) => {
      const c = CATEGORIES.find(x => x.id === tag.toLowerCase() || x.label.toLowerCase() === tag.toLowerCase());
      if (c && !category) { category = c.id; return sp; }
      return m;
    });

    title = title.replace(/(^|\s)!(rendah|sedang|tinggi)(?=\s|$)/i, (m, sp, p) => {
      priority = { rendah: "low", sedang: "med", tinggi: "high" }[p.toLowerCase()];
      return sp;
    });

    const lower = title.toLowerCase();
    if (/(^|\s)lusa(?=\s|$)/.test(lower)) date = addDays(today(), 2);
    else if (/(^|\s)besok(?=\s|$)/.test(lower)) date = addDays(today(), 1);
    else if (/(^|\s)hari ini(?=\s|$)/.test(lower)) date = today();

    title = title.replace(/\s{2,}/g, " ").trim();
    return { title: title || raw.trim(), category, priority, date };
  }

  /* ---------- Tampilan daftar ---------- */
  function visibleTasks() {
    let list = [...tasks];
    if (currentFilter === "today") list = list.filter(t => t.date === today());
    if (currentFilter === "pending") list = list.filter(t => !t.done);
    if (currentFilter === "overdue") list = list.filter(isOverdue);
    if (currentFilter === "starred") list = list.filter(t => t.starred && !t.done);
    if (currentFilter === "completed") list = list.filter(t => t.done);
    if (currentCat) list = list.filter(t => t.category === currentCat);

    const q = query.trim().toLowerCase();
    if (q) list = list.filter(t => t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q));

    const sort = els.sort.value;
    if (sort === "newest") list.sort((a, b) => b.created - a.created);
    if (sort === "oldest") list.sort((a, b) => a.created - b.created);
    if (sort === "date") list.sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
    if (sort === "priority") list.sort((a, b) => PRIORITY[b.priority].weight - PRIORITY[a.priority].weight || b.created - a.created);
    if (sort === "alpha") list.sort((a, b) => a.title.localeCompare(b.title, "id"));

    const pinned = list.filter(t => t.starred && !t.done);
    return [...pinned, ...list.filter(t => !(t.starred && !t.done))];
  }

  function nextTask() {
    return tasks
      .filter(t => !t.done)
      .sort((a, b) =>
        (a.date || "9999").localeCompare(b.date || "9999") ||
        PRIORITY[b.priority].weight - PRIORITY[a.priority].weight ||
        a.created - b.created
      )[0];
  }

  function rowHtml(t) {
    const id = String(t.id);
    const overdue = isOverdue(t);
    const p = PRIORITY[t.priority];
    const cat = catById(t.category);
    const subDone = t.subtasks.filter(s => s.done).length;

    const cls = ["task", "prio-" + t.priority];
    if (t.done) cls.push("done");
    if (overdue) cls.push("overdue");
    if (t.starred) cls.push("starred");
    if (justDone === id) cls.push("just-done");

    const chips = [
      `<span class="tag tag-prio">Prioritas ${p.label.toLowerCase()}</span>`,
      `<span class="due">${dueText(t.date)}</span>`,
      overdue ? '<span class="tag tag-late">Terlambat</span>' : "",
      cat ? `<span class="tag"><i class="dot" style="background:${cat.color}"></i>${cat.label}</span>` : "",
      t.repeat !== "none" ? `<span class="tag">${REPEAT_SHORT[t.repeat]}</span>` : "",
      t.subtasks.length ? `<span class="tag">${subDone}/${t.subtasks.length} subtugas</span>` : ""
    ].join("");

    return `
      <article class="${cls.join(" ")}" data-id="${escapeHtml(id)}">
        <button type="button" class="check" role="checkbox" aria-checked="${t.done}" data-act="toggle"
          aria-label="${t.done ? "Batalkan selesai" : "Tandai selesai"}: ${escapeHtml(t.title)}">${ICON_CHECK}</button>
        <div class="task-body">
          <button type="button" class="task-title" data-act="open" title="Buka detail">${escapeHtml(t.title)}</button>
          ${t.notes ? `<p class="task-note">${escapeHtml(t.notes)}</p>` : ""}
          <div class="meta">${chips}</div>
        </div>
        <button type="button" class="star" data-act="star" aria-pressed="${t.starred}"
          aria-label="${t.starred ? "Hapus bintang" : "Beri bintang"}" title="Berbintang">${ICON_STAR}</button>
        <div class="task-actions">
          <button type="button" class="act" data-act="open" aria-label="Buka detail tugas" title="Detail">${ICON_EDIT}</button>
          <button type="button" class="act danger" data-act="delete" aria-label="Hapus tugas" title="Hapus">${ICON_TRASH}</button>
        </div>
      </article>`;
  }

  function renderEmpty(list) {
    els.empty.classList.toggle("hidden", list.length > 0);
    if (list.length > 0) return;
    if (!tasks.length) {
      els.emptyTitle.textContent = "Belum ada tugas";
      els.emptyText.textContent = "Tulis tugas pertamamu di kolom atas, lalu tekan Tambah tugas.";
    } else if (query.trim()) {
      els.emptyTitle.textContent = "Tidak ada hasil";
      els.emptyText.textContent = "Tidak ada tugas yang cocok dengan pencarianmu. Coba kata kunci lain.";
    } else {
      els.emptyTitle.textContent = "Tidak ada tugas di sini";
      els.emptyText.textContent = "Belum ada tugas yang cocok dengan kategori atau filter ini.";
    }
  }

  function renderCats() {
    els.catNav.innerHTML = CATEGORIES.map(c => {
      const n = tasks.filter(t => t.category === c.id && !t.done).length;
      const active = currentCat === c.id;
      return `<button type="button" class="nav-item${active ? " is-active" : ""}" data-cat="${c.id}" aria-pressed="${active}">
        <i class="dot" style="background:${c.color}"></i><span>${c.label}</span><b>${n}</b></button>`;
    }).join("");
  }

  function sessionsOn(day) { return Number(focusLog[day]) || 0; }

  function renderFocus() {
    const next = nextTask();
    const done = tasks.filter(t => t.done).length;
    focusId = next ? String(next.id) : null;

    els.focusMeta.innerHTML = "";
    els.focusDone.classList.toggle("hidden", !next);

    if (next) {
      els.focusLabel.textContent = "Kerjakan ini dulu";
      els.focusTitle.textContent = next.title;
      const tag = txt => `<span class="tag">${txt}</span>`;
      const cat = catById(next.category);
      els.focusMeta.innerHTML =
        tag("Prioritas " + PRIORITY[next.priority].label.toLowerCase()) +
        tag(dueText(next.date)) +
        (isOverdue(next) ? tag("Terlambat") : "") +
        (cat ? tag(cat.label) : "");
    } else if (tasks.length) {
      els.focusLabel.textContent = "Semua beres";
      els.focusTitle.textContent = "Tidak ada tugas yang menunggu";
    } else {
      els.focusLabel.textContent = "Mulai dari sini";
      els.focusTitle.textContent = "Tulis satu tugas kecil dulu";
    }

    const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    els.progressNumber.textContent = pct + "%";
    els.progressCaption.textContent = `${done} dari ${tasks.length} selesai`;
    els.sessionNote.textContent = `${sessionsOn(today())} sesi fokus hari ini`;
    els.ringWrap.setAttribute("aria-label", `Progress ${pct} persen`);
    els.ringBar.style.strokeDashoffset = RING_LENGTH * (1 - pct / 100);
  }

  function updateTitle() {
    const base = FILTER_TITLES[currentFilter] || FILTER_TITLES.all;
    const c = catById(currentCat);
    els.title.textContent = c ? (currentFilter === "all" ? c.label : `${c.label}: ${base.toLowerCase()}`) : base;
  }

  function render() {
    const list = visibleTasks();
    els.list.innerHTML = list.map(rowHtml).join("");
    renderEmpty(list);

    const todayStr = today();
    $("#allCount").textContent = tasks.length;
    $("#todayCount").textContent = tasks.filter(t => t.date === todayStr && !t.done).length;
    $("#overdueCount").textContent = tasks.filter(isOverdue).length;
    $("#starredCount").textContent = tasks.filter(t => t.starred && !t.done).length;
    $("#completedCount").textContent = tasks.filter(t => t.done).length;

    renderCats();
    renderFocus();
  }

  /* ---------- Aksi tugas ---------- */
  function addTask(e) {
    e.preventDefault();
    const raw = els.input.value.trim();
    if (!raw) { els.input.focus(); return; }

    const q = parseQuick(raw);
    const checked = $('input[name="priority"]:checked').value;
    tasks.unshift(normalize({
      id: uid(),
      title: q.title,
      date: els.date.value || q.date || today(),
      done: false,
      created: Date.now(),
      priority: q.priority || checked,
      category: q.category || els.catInput.value,
      repeat: els.repeatInput.value
    }));

    els.input.value = "";
    els.date.value = "";
    els.repeatInput.value = "none";
    els.catInput.value = currentCat;
    $('input[name="priority"][value="med"]').checked = true;
    if (currentFilter === "completed") setFilter("all");
    save();
    render();
    els.input.focus();
  }

  function spawnNext(t) {
    let d = nextDate(t.date || today(), t.repeat);
    while (d < today()) d = nextDate(d, t.repeat);
    const copy = normalize({
      ...t,
      id: uid(),
      date: d,
      done: false,
      created: Date.now(),
      completedAt: null,
      spawnedId: null,
      subtasks: t.subtasks.map(s => ({ ...s, id: uid(), done: false }))
    });
    tasks.unshift(copy);
    t.spawnedId = String(copy.id);
    showToast(`Tugas berulang dijadwalkan: ${dueText(d).toLowerCase()}`);
  }

  function toggleTask(id) {
    const t = find(id);
    if (!t) return;
    t.done = !t.done;
    justDone = t.done ? String(t.id) : null;
    if (t.done) {
      t.completedAt = Date.now();
      if (t.repeat !== "none") spawnNext(t);
    } else {
      t.completedAt = null;
      if (t.spawnedId) {
        const n = find(t.spawnedId);
        if (n && !n.done) tasks = tasks.filter(x => x !== n);
        t.spawnedId = null;
      }
    }
    save();
    render();
    justDone = null;
  }

  function toggleStar(id) {
    const t = find(id);
    if (!t) return;
    t.starred = !t.starred;
    save();
    render();
  }

  function deleteTask(id) {
    if (!find(id)) return;
    snapshot = JSON.stringify(tasks);
    tasks = tasks.filter(x => String(x.id) !== String(id));
    save();
    render();
    showToast("Tugas dihapus", true);
  }

  function clearCompleted() {
    const count = tasks.filter(t => t.done).length;
    if (!count) { showToast("Belum ada tugas selesai."); return; }
    snapshot = JSON.stringify(tasks);
    tasks = tasks.filter(t => !t.done);
    save();
    render();
    showToast(`${count} tugas selesai dihapus`, true);
  }

  function clearAll() {
    if (!tasks.length) { showToast("Belum ada tugas."); return; }
    if (!confirm(`Hapus semua ${tasks.length} tugas? Kamu masih bisa mengurungkannya sesaat setelah ini.`)) return;
    snapshot = JSON.stringify(tasks);
    tasks = [];
    save();
    render();
    showToast("Semua tugas dihapus", true);
  }

  function undoLast() {
    if (!snapshot) return;
    tasks = JSON.parse(snapshot).map(normalize);
    snapshot = null;
    save();
    render();
    hideToast();
  }

  /* ---------- Detail tugas (dialog) ---------- */
  function fillSelect(sel, entries) {
    sel.innerHTML = entries.map(([v, l]) => `<option value="${v}">${escapeHtml(l)}</option>`).join("");
  }
  const catEntries = [["", "Tanpa kategori"], ...CATEGORIES.map(c => [c.id, c.label])];
  fillSelect(els.catInput, catEntries);
  fillSelect(els.dCategory, catEntries);
  fillSelect(els.repeatInput, Object.entries(REPEATS));
  fillSelect(els.dRepeat, Object.entries(REPEATS));
  fillSelect(els.dPriority, [["low", "Rendah"], ["med", "Sedang"], ["high", "Tinggi"]]);

  function renderSubs() {
    const done = draft.subtasks.filter(s => s.done).length;
    els.subList.innerHTML = draft.subtasks.map((s, i) => `
      <li class="sub${s.done ? " done" : ""}">
        <label><input type="checkbox" data-sub="${i}" ${s.done ? "checked" : ""}><span>${escapeHtml(s.title)}</span></label>
        <button type="button" class="act danger" data-sub-del="${i}" aria-label="Hapus subtugas">${ICON_TRASH}</button>
      </li>`).join("");
    els.subCount.textContent = draft.subtasks.length ? `(${done}/${draft.subtasks.length})` : "";
  }

  function addSub() {
    const title = els.subInput.value.trim();
    if (!title) { els.subInput.focus(); return; }
    if (draft.subtasks.length >= 50) { showToast("Maksimal 50 subtugas per tugas."); return; }
    draft.subtasks.push({ id: uid(), title: title.slice(0, 120), done: false });
    els.subInput.value = "";
    renderSubs();
    els.subInput.focus();
  }

  function openTask(id) {
    const t = find(id);
    if (!t) return;
    draft = JSON.parse(JSON.stringify(t));
    els.dTitle.value = t.title;
    els.dNotes.value = t.notes;
    els.dDate.value = t.date;
    els.dPriority.value = t.priority;
    els.dCategory.value = t.category;
    els.dRepeat.value = t.repeat;
    els.dStar.checked = t.starred;
    els.subInput.value = "";
    renderSubs();
    els.taskDialog.showModal();
  }

  els.taskForm.addEventListener("submit", e => {
    e.preventDefault();
    const t = draft && find(draft.id);
    const title = els.dTitle.value.trim();
    if (!t || !title) return;
    t.title = title;
    t.notes = els.dNotes.value.trim();
    t.date = els.dDate.value;
    t.priority = els.dPriority.value;
    t.category = els.dCategory.value;
    t.repeat = els.dRepeat.value;
    t.starred = els.dStar.checked;
    t.subtasks = draft.subtasks;
    save();
    render();
    els.taskDialog.close();
    showToast("Perubahan disimpan");
  });

  els.dDelete.addEventListener("click", () => {
    const id = draft && draft.id;
    els.taskDialog.close();
    if (id != null) deleteTask(id);
  });

  els.subAdd.addEventListener("click", addSub);
  els.subInput.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); addSub(); }
  });
  els.subList.addEventListener("change", e => {
    const i = e.target.dataset.sub;
    if (i === undefined) return;
    draft.subtasks[i].done = e.target.checked;
    renderSubs();
  });
  els.subList.addEventListener("click", e => {
    const btn = e.target.closest("[data-sub-del]");
    if (!btn) return;
    draft.subtasks.splice(Number(btn.dataset.subDel), 1);
    renderSubs();
  });

  /* Tutup dialog: tombol, klik latar */
  $$("dialog").forEach(dlg => {
    let downOnBackdrop = false;
    dlg.addEventListener("mousedown", e => { downOnBackdrop = e.target === dlg; });
    dlg.addEventListener("click", e => { if (e.target === dlg && downOnBackdrop) dlg.close(); });
    $$("[data-close]", dlg).forEach(b => b.addEventListener("click", () => dlg.close()));
  });

  /* ---------- Statistik ---------- */
  function lastDays(n) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) out.push(addDays(today(), -i));
    return out;
  }

  function renderStats() {
    const days = lastDays(7);
    const perDay = Object.fromEntries(days.map(d => [d, 0]));
    const doneDays = new Set();
    tasks.forEach(t => {
      if (t.done && t.completedAt) {
        const d = ymd(new Date(t.completedAt));
        doneDays.add(d);
        if (d in perDay) perDay[d]++;
      }
    });

    const weekTotal = days.reduce((s, d) => s + perDay[d], 0);
    const focusWeek = days.reduce((s, d) => s + sessionsOn(d), 0);
    let streak = 0;
    let cursor = today();
    if (!doneDays.has(cursor)) cursor = addDays(cursor, -1);
    while (doneDays.has(cursor)) { streak++; cursor = addDays(cursor, -1); }

    const doneAll = tasks.filter(t => t.done).length;
    const rate = tasks.length ? Math.round((doneAll / tasks.length) * 100) : 0;
    const max = Math.max(1, ...days.map(d => perDay[d]));

    const bars = days.map(d => {
      const label = new Date(d + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short" });
      const h = perDay[d] ? Math.max(6, Math.round((perDay[d] / max) * 96)) : 4;
      return `<div class="col${d === today() ? " today" : ""}">
        <span class="val">${perDay[d]}</span><div class="bar" style="height:${h}px"></div><span class="day">${label}</span></div>`;
    }).join("");
    const chartLabel = "Tugas selesai per hari: " + days.map(d =>
      new Date(d + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long" }) + " " + perDay[d]).join(", ");

    const catRows = [...CATEGORIES, { id: "", label: "Tanpa kategori", color: "#8791a4" }].map(c => {
      const all = tasks.filter(t => t.category === c.id);
      if (!all.length) return "";
      const d = all.filter(t => t.done).length;
      return `<div class="cat-row">
        <span class="name"><i class="dot" style="background:${c.color}"></i>${c.label}</span>
        <div class="meter" role="img" aria-label="${c.label}: ${d} dari ${all.length} selesai"><i style="width:${Math.round((d / all.length) * 100)}%"></i></div>
        <span class="frac">${d}/${all.length}</span></div>`;
    }).join("");

    els.statsBody.innerHTML = `
      <div class="stat-grid">
        <div class="stat"><strong>${weekTotal}</strong><span>Tugas selesai dalam 7 hari</span></div>
        <div class="stat"><strong>${streak}</strong><span>Hari berturut-turut ada tugas selesai</span></div>
        <div class="stat"><strong>${focusWeek}</strong><span>Sesi fokus dalam 7 hari</span></div>
        <div class="stat"><strong>${rate}%</strong><span>Dari semua tugas sudah selesai</span></div>
      </div>
      <section>
        <h3 class="stats-h">Selesai per hari</h3>
        <div class="chart" role="img" aria-label="${escapeHtml(chartLabel)}">${bars}</div>
      </section>
      <section>
        <h3 class="stats-h">Per kategori</h3>
        ${catRows ? `<div class="cat-rows">${catRows}</div>` : '<p class="stats-empty">Belum ada tugas. Tambahkan tugas untuk melihat ringkasannya di sini.</p>'}
      </section>`;
  }

  function openStats() {
    renderStats();
    els.statsDialog.showModal();
  }

  /* ---------- Timer fokus ---------- */
  const timer = { mode: "focus", remaining: MODES.focus * 60, endAt: null, id: null };

  const fmt = s => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

  function updateTimerUI() {
    const running = timer.endAt !== null;
    els.timerTime.textContent = fmt(timer.remaining);
    els.timerToggle.textContent = running ? "Jeda" : (timer.remaining < MODES[timer.mode] * 60 ? "Lanjut" : "Mulai");
    $$(".timer-mode").forEach(b => {
      const active = b.dataset.mode === timer.mode;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", active);
    });
    document.title = running ? `(${fmt(timer.remaining)}) ${BASE_TITLE}` : BASE_TITLE;
  }

  function stopTimer() {
    clearInterval(timer.id);
    timer.id = null;
    timer.endAt = null;
  }

  function tickTimer() {
    if (timer.endAt === null) return;
    timer.remaining = Math.max(0, Math.round((timer.endAt - Date.now()) / 1000));
    if (timer.remaining <= 0) { finishTimer(); return; }
    updateTimerUI();
  }

  function setMode(mode) {
    stopTimer();
    timer.mode = mode;
    timer.remaining = MODES[mode] * 60;
    updateTimerUI();
  }

  function toggleTimer() {
    if (timer.endAt !== null) {
      tickTimer();
      stopTimer();
    } else {
      timer.endAt = Date.now() + timer.remaining * 1000;
      timer.id = setInterval(tickTimer, 250);
    }
    updateTimerUI();
  }

  function beep() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
      osc.start();
      osc.stop(ctx.currentTime + 0.75);
    } catch {}
  }

  function finishTimer() {
    const finished = timer.mode;
    beep();
    if (finished === "focus") {
      focusLog[today()] = sessionsOn(today()) + 1;
      saveFocus();
      setMode("break");
      showToast("Sesi fokus selesai. Istirahat 5 menit dulu.");
      renderFocus();
    } else {
      setMode("focus");
      showToast("Istirahat selesai. Siap fokus lagi?");
    }
  }

  els.timerToggle.addEventListener("click", toggleTimer);
  els.timerReset.addEventListener("click", () => setMode(timer.mode));
  $$(".timer-mode").forEach(b => b.addEventListener("click", () => setMode(b.dataset.mode)));

  /* ---------- Toast ---------- */
  function showToast(message, withUndo = false) {
    clearTimeout(toastTimer);
    els.toast.innerHTML = "";
    const span = document.createElement("span");
    span.textContent = message;
    els.toast.append(span);
    if (withUndo) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Urungkan";
      btn.addEventListener("click", undoLast);
      els.toast.append(btn);
    }
    els.toast.classList.add("show");
    toastTimer = setTimeout(() => { hideToast(); snapshot = null; }, 6000);
  }

  function hideToast() { els.toast.classList.remove("show"); }

  /* ---------- Ekspor dan impor ---------- */
  function download(filename, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportTxt() {
    els.settingsDialog.close();
    if (!tasks.length) { showToast("Belum ada tugas untuk diekspor."); return; }

    const lines = [
      "TASKLY — DAFTAR TUGAS",
      "======================",
      `Diekspor: ${new Date().toLocaleString("id-ID")}`,
      ""
    ];
    tasks.forEach((t, i) => {
      const cat = catById(t.category);
      lines.push(`${i + 1}. [${t.done ? "✓" : " "}] ${t.starred ? "★ " : ""}${t.title}`);
      lines.push(`   Tanggal: ${formatDate(t.date)}`);
      lines.push(`   Prioritas: ${PRIORITY[t.priority].label}`);
      if (cat) lines.push(`   Kategori: ${cat.label}`);
      if (t.repeat !== "none") lines.push(`   Ulangi: ${REPEATS[t.repeat]}`);
      lines.push(`   Status: ${t.done ? "Selesai" : "Belum selesai"}`);
      if (t.notes) lines.push(`   Catatan: ${t.notes.replace(/\s*\n\s*/g, " ")}`);
      t.subtasks.forEach(s => lines.push(`     - [${s.done ? "✓" : " "}] ${s.title}`));
      lines.push("");
    });
    download(`taskly-${today()}.txt`, lines.join("\n"), "text/plain;charset=utf-8");
  }

  function exportJson() {
    els.settingsDialog.close();
    const data = { app: "taskly", version: 2, exported: new Date().toISOString(), tasks, focus: focusLog };
    download(`taskly-cadangan-${today()}.json`, JSON.stringify(data, null, 2), "application/json");
    showToast("Cadangan JSON diunduh");
  }

  els.importFile.addEventListener("change", async () => {
    const file = els.importFile.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const arr = Array.isArray(data) ? data : data.tasks;
      if (!Array.isArray(arr)) throw new Error("format");

      const before = JSON.stringify(tasks);
      const ids = new Set(tasks.map(t => String(t.id)));
      let added = 0;
      arr.filter(t => t && typeof t.title === "string").forEach(raw => {
        const t = normalize(raw);
        if (!ids.has(String(t.id))) { tasks.push(t); ids.add(String(t.id)); added++; }
      });
      if (data.focus && typeof data.focus === "object" && !Array.isArray(data.focus)) {
        Object.entries(data.focus).forEach(([d, n]) => {
          if (/^\d{4}-\d{2}-\d{2}$/.test(d)) focusLog[d] = Math.max(sessionsOn(d), Number(n) || 0);
        });
        saveFocus();
      }
      snapshot = before;
      save();
      render();
      els.settingsDialog.close();
      showToast(`${added} tugas diimpor`, added > 0);
    } catch {
      els.settingsDialog.close();
      showToast("File tidak valid. Pilih file cadangan JSON dari Taskly.");
    }
    els.importFile.value = "";
  });

  /* ---------- Filter, kategori, tema, aksen ---------- */
  function setFilter(filter) {
    currentFilter = filter;
    $$("[data-filter]").forEach(b => {
      const active = b.dataset.filter === filter;
      b.classList.toggle("is-active", active);
      if (b.classList.contains("filter")) b.setAttribute("aria-pressed", active);
    });
    updateTitle();
    render();
  }

  function setCat(id) {
    currentCat = currentCat === id ? "" : id;
    els.catInput.value = currentCat;
    updateTitle();
    render();
  }

  function updateThemeLabel() {
    const dark = document.documentElement.dataset.theme === "dark";
    $$(".theme-label").forEach(l => { l.textContent = dark ? "Mode terang" : "Mode gelap"; });
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    updateThemeLabel();
  }

  function setAccent(accent, persist = true) {
    document.documentElement.dataset.accent = accent;
    if (persist) { try { localStorage.setItem(ACCENT_KEY, accent); } catch {} }
    $$("#swatches [data-accent]").forEach(b => b.setAttribute("aria-pressed", b.dataset.accent === accent));
  }

  function updateDate() {
    $("#currentDate").textContent = new Date().toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
  }

  /* ---------- Event ---------- */
  els.form.addEventListener("submit", addTask);

  els.list.addEventListener("click", e => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const id = btn.closest(".task").dataset.id;
    const act = btn.dataset.act;
    if (act === "toggle") toggleTask(id);
    if (act === "star") toggleStar(id);
    if (act === "open") openTask(id);
    if (act === "delete") deleteTask(id);
  });

  els.focusDone.addEventListener("click", () => { if (focusId) toggleTask(focusId); });
  els.search.addEventListener("input", () => { query = els.search.value; render(); });
  els.sort.addEventListener("change", render);

  $$("[data-filter]").forEach(b => b.addEventListener("click", () => setFilter(b.dataset.filter)));
  els.catNav.addEventListener("click", e => {
    const b = e.target.closest("[data-cat]");
    if (b) setCat(b.dataset.cat);
  });

  $("#swatches").addEventListener("click", e => {
    const b = e.target.closest("[data-accent]");
    if (b) setAccent(b.dataset.accent);
  });

  const actions = {
    theme: toggleTheme,
    stats: openStats,
    settings: () => els.settingsDialog.showModal(),
    export: exportTxt,
    "export-json": exportJson,
    "import-json": () => els.importFile.click(),
    clear: () => { els.settingsDialog.close(); clearCompleted(); },
    "clear-all": () => { els.settingsDialog.close(); clearAll(); }
  };
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-action]");
    if (a && actions[a.dataset.action]) actions[a.dataset.action]();
  });

  document.addEventListener("keydown", e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector("dialog[open]")) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
    if (e.key === "/") { e.preventDefault(); els.search.focus(); }
    if (e.key === "n") { e.preventDefault(); els.input.focus(); }
    if (e.key === "f") { e.preventDefault(); toggleTimer(); }
  });

  window.addEventListener("storage", e => {
    if (e.key === STORAGE_KEY) { tasks = loadTasks(); render(); }
    if (e.key === FOCUS_KEY) { focusLog = loadFocus(); renderFocus(); }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    updateDate();
    tickTimer();
    render();
  });

  /* ---------- Mulai ---------- */
  updateDate();
  updateThemeLabel();
  setAccent(document.documentElement.dataset.accent || "blue", false);
  updateTimerUI();
  setFilter("all");
})();
