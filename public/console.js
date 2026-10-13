(function () {
  var role = 'user', token = null, logEl = document.getElementById('log');
  var hues = [215, 160, 280, 30, 190, 340, 100, 250];
  function $(id) { return document.getElementById(id); }
  function log(method, url, status, body) {
    var line = method + ' ' + url + '  →  ' + status + '\n' + JSON.stringify(body, null, 2);
    logEl.textContent = line + '\n\n' + (logEl.dataset.started ? logEl.textContent : '');
    logEl.dataset.started = '1';
  }
  function api(method, path, body) {
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    return fetch(path, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { log(method, path, r.status, j); return { ok: r.ok, status: r.status, data: j }; }); });
  }
  function loadCourses() {
    api('GET', '/api/course/courses/all').then(function (r) {
      var list = (r.data.allCourses || []);
      $('count').textContent = '(' + list.length + ')';
      var box = $('courses'); box.textContent = '';
      list.forEach(function (c, i) {
        var d = document.createElement('div'); d.className = 'course';
        var t = document.createElement('div'); t.className = 'thumb'; t.textContent = 'COURSE ' + (i + 1);
        var b = document.createElement('div'); b.className = 'b';
        var h = document.createElement('h3'); h.textContent = c.title;
        var f = document.createElement('div'); f.className = 'f';
        var p = document.createElement('span'); p.className = 'price'; p.textContent = '₹' + c.price;
        f.appendChild(p);
        if (role === 'user') { var btn = document.createElement('button'); btn.textContent = 'Buy'; btn.onclick = function () { buy(c._id); }; f.appendChild(btn); }
        if (role === 'admin' && token) { var del = document.createElement('button'); del.className = 'danger'; del.textContent = 'Delete'; del.onclick = function () { remove(c._id); }; f.appendChild(del); }
        b.appendChild(h); b.appendChild(f); d.appendChild(t); d.appendChild(b); box.appendChild(d);
      });
    });
  }
  function loadMine() {
    if (!token || role !== 'user') { $('myCard').hidden = true; return; }
    api('GET', '/api/user/courses').then(function (r) {
      $('myCard').hidden = false; var ul = $('mine'); ul.textContent = '';
      (r.data.courses || []).forEach(function (c) { var li = document.createElement('li'); li.textContent = c.title; ul.appendChild(li); });
      if (!(r.data.courses || []).length) { var li = document.createElement('li'); li.textContent = 'Nothing purchased yet'; ul.appendChild(li); }
    });
  }
  function buy(id) {
    if (!token) { $('who').textContent = 'Sign in as a learner first'; return; }
    api('POST', '/api/user/purchase-course', { courseId: id }).then(loadMine);
  }
  function remove(id) { api('DELETE', '/api/admin/Delete-course', { courseId: id }).then(loadCourses); }
  function setRole(r) {
    role = r; token = null; $('who').textContent = 'Not signed in'; $('adminCard').hidden = true;
    document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('on', t.dataset.role === r); });
    loadMine(); loadCourses();
  }
  document.querySelectorAll('.tab').forEach(function (t) { t.onclick = function () { setRole(t.dataset.role); }; });
  $('fill').onclick = function () {
    var f = $('auth'); f.email.value = role === 'admin' ? 'demo-admin@coursify.dev' : 'demo-user@coursify.dev'; f.password.value = 'Demo@12345';
  };
  var lastAct = 'signin';
  document.querySelectorAll('#auth button[data-act]').forEach(function (b) { b.onclick = function () { lastAct = b.dataset.act; }; });
  $('auth').onsubmit = function (e) {
    e.preventDefault(); var f = e.target;
    var body = { email: f.email.value, password: f.password.value };
    if (lastAct === 'signup') { body.FirstName = f.FirstName.value || 'New'; body.LastName = f.LastName.value || 'User'; }
    api('POST', '/api/' + role + '/' + lastAct, body).then(function (r) {
      if (r.ok && r.data.token) {
        token = r.data.token; $('who').textContent = 'Signed in as ' + role + ' · ' + body.email;
        $('adminCard').hidden = role !== 'admin'; loadMine(); loadCourses();
      } else if (r.ok) { $('who').textContent = 'Account created, now sign in'; }
      else { $('who').textContent = (r.data.msg || 'Request failed'); }
    });
  };
  $('create').onsubmit = function (e) {
    e.preventDefault(); var f = e.target;
    api('POST', '/api/admin/create-course', { title: f.title.value, price: Number(f.price.value) }).then(function () { f.reset(); loadCourses(); });
  };
  loadCourses();
})();
