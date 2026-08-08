'use strict';

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const PLATFORMS = ['BOSS直聘', '智联招聘', '前程无忧', '实习僧', '其他'];
const ACTIONS = ['打招呼', '回复', '交换简历', '约面试', '面试', 'Offer', '拒绝'];

let records = load('jd_records');
let interviews = load('jd_interviews');
let todos = load('jd_todos');
let currentTab = 'dash';

/* ---------- 工具 ---------- */
function load(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return [];
  }
}

function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function today() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmtDate(s) {
  if (!s) return '';
  const p = s.split('-');
  return p.length === 3 ? p[1] + '/' + p[2] : s;
}

function fmtCN(d) {
  const p = d.split('-');
  const wk = ['日', '一', '二', '三', '四', '五', '六'];
  const dt = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  return Number(p[1]) + '月' + Number(p[2]) + '日 周' + wk[dt.getDay()];
}

function barRow(label, pct, color) {
  const w = Math.max(2, Math.min(100, pct));
  return (
    '<div>' +
    '<div class="row-line" style="margin-bottom:6px"><span>' + label + '</span><span class="v">' + pct + '%</span></div>' +
    '<div class="bar"><div class="bar-fill" style="width:' + w + '%;background:' + color + '"></div></div>' +
    '</div>'
  );
}

function actionClass(a) {
  return {
    '打招呼': 'comm',
    '回复': 'reply',
    '交换简历': 'exchange',
    '约面试': 'interview',
    '面试': 'interview',
    'Offer': 'offer',
    '拒绝': 'reject'
  }[a] || 'comm';
}

function resultClass(r) {
  return { 'Offer': 'offer', '通过': 'pass', '待定': 'wait', '未通过': 'fail' }[r] || 'wait';
}

/* ---------- 统计 ---------- */
function stats() {
  const out = { comm: 0, reply: 0, exchange: 0, interview: 0, offer: 0 };
  records.forEach((r) => {
    if (r.action === '打招呼') out.comm++;
    else if (r.action === '回复') out.reply++;
    else if (r.action === '交换简历') out.exchange++;
    else if (r.action === '面试') out.interview++;
    else if (r.action === 'Offer') out.offer++;
  });
  interviews.forEach((i) => {
    if (i.result === 'Offer') out.offer++;
  });
  return out;
}

/* ---------- 渲染：看板 ---------- */
function renderDashboard() {
  const s = stats();
  const cards = [
    { n: s.comm, l: '累计沟通', c: 'var(--blue)', i: '💬' },
    { n: s.reply, l: '收到回复', c: 'var(--cyan)', i: '📨' },
    { n: s.exchange, l: '交换简历', c: 'var(--green)', i: '📄' },
    { n: interviews.length, l: '面试场次', c: 'var(--amber)', i: '🎤' },
    { n: s.offer, l: 'Offer', c: 'var(--green)', i: '🎉', wide: true }
  ];
  $('#statCards').innerHTML = cards
    .map((x) => '<div class="stat' + (x.wide ? ' wide' : '') + '" style="--sc:' + x.c + '"><div class="ico">' + x.i + '</div><div class="num">' + x.n + '</div><div class="lbl">' + x.l + '</div></div>')
    .join('');

  const exchRate = s.exchange && s.comm ? Math.round((s.exchange / s.comm) * 100) : 0;
  const ivRate = s.exchange ? Math.round((interviews.length / s.exchange) * 100) : 0;
  $('#conversionCard').innerHTML =
    '<h3>转化漏斗</h3>' +
    '<div class="kv">' +
    barRow('沟通 → 交换简历', exchRate, 'var(--blue)') +
    barRow('交换简历 → 面试', ivRate, 'var(--green)') +
    '</div>';

  const t = today();
  const todayComm = records.filter((r) => r.date === t && r.action === '打招呼').length;
  const todayReply = records.filter((r) => r.date === t && r.action === '回复').length;
  const todayExch = records.filter((r) => r.date === t && r.action === '交换简历').length;
  const todayIv = interviews.filter((i) => i.date === t).length;
  $('#todayStats').innerHTML =
    '<div class="row-line"><span>今日沟通</span><span class="v">' + todayComm + ' 次</span></div>' +
    '<div class="row-line"><span>今日回复</span><span class="v">' + todayReply + ' 次</span></div>' +
    '<div class="row-line"><span>今日交换</span><span class="v">' + todayExch + ' 次</span></div>' +
    '<div class="row-line"><span>今日面试</span><span class="v">' + todayIv + ' 场</span></div>';

  const recent = interviews.slice().sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)).slice(0, 3);
  $('#recentInterviews').innerHTML = recent.length
    ? recent
        .map(
          (i) =>
            '<div class="row-line"><span>' + esc(i.company) + ' · ' + esc(i.position || '') + '</span><span class="v">' + fmtDate(i.date) + ' · ' + esc(i.result) + '</span></div>'
        )
        .join('')
    : '<div class="empty">还没有面试记录</div>';

  const pend = todos.filter((t2) => !t2.done).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4);
  $('#pendingTodos').innerHTML = pend.length
    ? pend
        .map((t2) => {
          const late = t2.due < today() ? ' <span class="badge fail">已过期</span>' : '';
          return '<div class="row-line"><span>' + esc(t2.text) + late + '</span><span class="v">' + fmtDate(t2.due) + '</span></div>';
        })
        .join('')
    : '<div class="empty">暂无待办</div>';
}

/* ---------- 渲染：记录 ---------- */
function renderRecords() {
  const sorted = records.slice().sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
  $('#recordCount').textContent = sorted.length;
  $('#recordList').innerHTML = sorted.length
    ? sorted
        .map(
          (r) =>
            '<div class="item">' +
            '<div class="head"><span class="name">' + esc(r.company) + '</span><span class="badge ' + actionClass(r.action) + '">' + esc(r.action) + '</span></div>' +
            '<div class="sub">' + fmtDate(r.date) + ' · ' + esc(r.platform) + (r.position ? ' · ' + esc(r.position) : '') + '</div>' +
            (r.note ? '<div class="note">' + esc(r.note) + '</div>' : '') +
            '<div style="margin-top:6px;text-align:right"><button class="del-btn" data-del-record="' + r.id + '" title="删除">×</button></div>' +
            '</div>'
        )
        .join('')
    : '<div class="empty">还没有记录，去上方记一笔</div>';
}

/* ---------- 渲染：面试 ---------- */
function renderInterviews() {
  const sorted = interviews.slice().sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
  $('#interviewList').innerHTML = sorted.length
    ? sorted
        .map((i) => {
          const stars = '★'.repeat(Math.max(1, Math.min(5, Number(i.rating) || 3)));
          return (
            '<div class="item">' +
            '<div class="head"><span class="name">' + esc(i.company) + '</span><span class="badge ' + resultClass(i.result) + '">' + esc(i.result) + '</span></div>' +
            '<div class="sub">' + fmtDate(i.date) + ' · ' + esc(i.form || '') + (i.position ? ' · ' + esc(i.position) : '') + '</div>' +
            '<div class="sub stars">' + stars + '</div>' +
            (i.review ? '<div class="note">' + esc(i.review).replace(/\n/g, '<br>') + '</div>' : '') +
            '<div style="margin-top:6px;text-align:right"><button class="del-btn" data-del-interview="' + i.id + '" title="删除">×</button></div>' +
            '</div>'
          );
        })
        .join('')
    : '<div class="empty">还没有面试记录，面完来复盘</div>';
}

/* ---------- 渲染：待办 ---------- */
function renderTodos() {
  const t = today();
  const sorted = todos.slice().sort((a, b) => (a.done === b.done ? a.due.localeCompare(b.due) : a.done ? 1 : -1));
  $('#todoList').innerHTML = sorted.length
    ? sorted
        .map((x) => {
          const late = !x.done && x.due < t;
          return (
            '<div class="item ' + (x.done ? 'todo-done' : '') + (late ? 'overdue' : '') + '">' +
            '<div class="head"><span class="name">' + esc(x.text) + '</span><span class="sub">' + fmtDate(x.due) + (late ? ' · 已过期' : '') + '</span></div>' +
            '<div style="display:flex;gap:8px;margin-top:6px">' +
            '<button class="btn-ghost" data-toggle-todo="' + x.id + '">' + (x.done ? '↩ 撤销' : '✓ 完成') + '</button>' +
            '<button class="del-btn" data-del-todo="' + x.id + '" title="删除">×</button>' +
            '</div>' +
            '</div>'
          );
        })
        .join('')
    : '<div class="empty">暂无待办，加一个跟进提醒</div>';
}

/* ---------- 表单提交 ---------- */
function bindForms() {
  $('#recordForm').addEventListener('submit', (e) => {
    e.preventDefault();
    records.push({
      id: uid(),
      date: $('#recDate').value || today(),
      company: $('#recCompany').value.trim(),
      position: $('#recPosition').value.trim(),
      platform: $('#recPlatform').value,
      action: $('#recAction').value,
      note: $('#recNote').value.trim(),
      createdAt: new Date().toISOString()
    });
    save('jd_records', records);
    e.target.reset();
    $('#recDate').value = today();
    renderAll();
  });

  $('#interviewForm').addEventListener('submit', (e) => {
    e.preventDefault();
    interviews.push({
      id: uid(),
      date: $('#ivDate').value || today(),
      company: $('#ivCompany').value.trim(),
      position: $('#ivPosition').value.trim(),
      form: $('#ivForm').value,
      rating: $('#ivRating').value,
      result: $('#ivResult').value,
      review: $('#ivReview').value.trim(),
      createdAt: new Date().toISOString()
    });
    save('jd_interviews', interviews);
    e.target.reset();
    $('#ivDate').value = today();
    renderAll();
  });

  $('#todoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    todos.push({
      id: uid(),
      due: $('#todoDue').value || today(),
      text: $('#todoText').value.trim(),
      done: false,
      createdAt: new Date().toISOString()
    });
    save('jd_todos', todos);
    e.target.reset();
    $('#todoDue').value = today();
    renderAll();
  });
}

/* ---------- 事件委托：删除 / 完成 ---------- */
function bindListActions() {
  document.addEventListener('click', (e) => {
    const dr = e.target.closest('[data-del-record]');
    if (dr) {
      records = records.filter((r) => r.id !== dr.dataset.delRecord);
      save('jd_records', records);
      renderAll();
      return;
    }
    const di = e.target.closest('[data-del-interview]');
    if (di) {
      interviews = interviews.filter((i) => i.id !== di.dataset.delInterview);
      save('jd_interviews', interviews);
      renderAll();
      return;
    }
    const dt = e.target.closest('[data-del-todo]');
    if (dt) {
      todos = todos.filter((x) => x.id !== dt.dataset.delTodo);
      save('jd_todos', todos);
      renderAll();
      return;
    }
    const tg = e.target.closest('[data-toggle-todo]');
    if (tg) {
      const x = todos.find((t) => t.id === tg.dataset.toggleTodo);
      if (x) {
        x.done = !x.done;
        save('jd_todos', todos);
        renderAll();
      }
    }
  });
}

/* ---------- Tab 切换 ---------- */
function bindNav() {
  $$('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.tab;
      $$('.nav-btn').forEach((b) => b.classList.toggle('active', b === btn));
      $$('.tab').forEach((t) => t.classList.toggle('active', t.id === 'tab-' + currentTab));
      renderAll();
    });
  });
}

/* ---------- 导入导出 ---------- */
function exportData() {
  const data = { exportedAt: new Date().toISOString(), records, interviews, todos };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '求职日记备份-' + today() + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

function importData(text) {
  try {
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.records) || !Array.isArray(data.interviews) || !Array.isArray(data.todos)) {
      throw new Error('格式不对');
    }
    records = data.records;
    interviews = data.interviews;
    todos = data.todos;
    save('jd_records', records);
    save('jd_interviews', interviews);
    save('jd_todos', todos);
    return true;
  } catch (e) {
    return false;
  }
}

function bindImportExport() {
  $('#btnExport').addEventListener('click', exportData);
  $('#btnImport').addEventListener('click', () => {
    $('#importText').value = '';
    $('#importDialog').showModal();
  });
  $('#importCancel').addEventListener('click', () => $('#importDialog').close());
  $('#importOk').addEventListener('click', () => {
    const ok = importData($('#importText').value);
    $('#importDialog').close();
    alert(ok ? '导入成功' : '导入失败：请检查粘贴的内容');
    renderAll();
  });
}

/* ---------- 启动 ---------- */
function renderAll() {
  renderDashboard();
  renderRecords();
  renderInterviews();
  renderTodos();
}

function init() {
  $('#todayLabel').textContent = fmtCN(today());
  $('#recDate').value = today();
  $('#ivDate').value = today();
  $('#todoDue').value = today();
  bindForms();
  bindListActions();
  bindNav();
  bindImportExport();
  renderAll();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
