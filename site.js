/* Veriden (data/apps.json) uygulama kartlarını ve gizlilik politikalarını üretir.
   Mevcut statik içerik korunur; veri dosyasındaki alanlar üstüne uygulanır. */
(function () {
  function el(t, c, txt) { var e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; }
  function bil(en, tr) {
    var a = el("span", null, en); a.setAttribute("lang", "en");
    var b = el("span", null, tr); b.setAttribute("lang", "tr");
    return [a, b];
  }
  function fmt(iso, loc) {
    var d = new Date(iso + "T00:00:00Z");
    return d.toLocaleDateString(loc, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  }
  function card(a) {
    var c = el("div", "c"), t = el("div", "t"), img = el("img");
    img.src = a.icon; img.alt = ""; img.width = 72; img.height = 72;
    var h = el("h3", null, a.name); h.setAttribute("translate", "no");
    t.appendChild(img); t.appendChild(h); c.appendChild(t);
    c.appendChild(el("p", null, a.tagline_en));
    var ac = el("div", "ac");
    if (a.status === "live" && a.store_url) {
      var gp = el("a", "gp"); gp.href = a.store_url; gp.target = "_blank"; gp.rel = "noopener";
      /* Rozet: sayfadaki mevcut rozetin dilini ve boyutunu al (dil değişince setL hepsini günceller) */
      var ref = document.querySelector("img.gpb");
      var im = el("img", "gpb");
      im.src = ref ? ref.getAttribute("src") : "https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png";
      im.alt = ref ? ref.getAttribute("alt") : "Get it on Google Play";
      gp.appendChild(im); ac.appendChild(gp);
    } else {
      var s = el("span", "soon"); bil("Coming soon", "Yakında").forEach(function (x) { s.appendChild(x); }); ac.appendChild(s);
    }
    c.appendChild(ac);
    attachCopy(c, a);
    return c;
  }
  /* Panelden eklenen kartlar: ikona 10 tıklama -> gizlilik ve Play linki kopyalama düğmeleri */
  function attachCopy(card, a) {
    var im = card.querySelector(".t img"), n = 0, last = 0;
    if (!im) return;
    im.addEventListener("click", function () {
      var now = Date.now();
      n = now - last > 2500 ? 1 : n + 1;
      last = now;
      if (n < 10) return;
      n = 0;
      var old = card.querySelector(".hx");
      if (old) { old.remove(); return; }
      var tr = document.documentElement.getAttribute("data-l") === "tr";
      var base = location.origin + location.pathname.replace(/index\.html$/, "");
      var L = [[tr ? "Gizlilik politikası linkini kopyala" : "Copy privacy policy link", base + "?privacy=" + a.id]];
      if (a.status === "live" && a.store_url) L.push([tr ? "Google Play linkini kopyala" : "Copy Google Play link", a.store_url]);
      var p = el("div", "hx"); p.setAttribute("translate", "no");
      L.forEach(function (x) {
        var b = el("button", "cpb", x[0]); b.type = "button"; b.dataset.t = x[0];
        b.onclick = function () { cpy(x[1], b); };
        p.appendChild(b);
      });
      card.appendChild(p);
    });
  }
  function fillPolicy(pb, a, tpl) {
    while (pb.firstChild) pb.removeChild(pb.firstChild);
    var date = a.policy_date || tpl.updated;
    var head = el("p");
    bil("Last updated: " + fmt(date, "en-US") + " · Developer: Labs Dev Apps · Contact:",
        "Son güncelleme: " + fmt(date, "tr-TR") + " · Geliştirici: Labs Dev Apps · İletişim:")
      .forEach(function (x) { head.appendChild(x); });
    head.appendChild(document.createTextNode(" "));
    var m = el("a", null, "labsdevapps@gmail.com"); m.href = "mailto:labsdevapps@gmail.com"; head.appendChild(m);
    pb.appendChild(head);
    (a.policy_text || tpl.text).split(/\n\s*\n/).forEach(function (block) {
      var lines = block.split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
      if (!lines.length) return;
      var text = lines.join(" ").split("{app}").join(a.name);
      var isHeading = lines.length === 1 && text.length <= 60 && !/[.!?:;]$/.test(text);
      pb.appendChild(el(isHeading ? "h4" : "p", null, text));
    });
  }
  function article(a, tpl) {
    var art = el("article", "pv"); art.id = "pv-" + a.id;
    var h1 = el("h1"), img = el("img");
    img.src = a.icon; img.alt = ""; img.width = 56; img.height = 56; h1.appendChild(img);
    var sp = el("span"), nm = el("span", null, a.name); nm.setAttribute("translate", "no");
    var sm = el("small"); sm.style.cssText = "font-size:15px;font-weight:600;color:var(--mut)";
    bil("Privacy Policy", "Gizlilik Politikası").forEach(function (x) { sm.appendChild(x); });
    sp.appendChild(nm); sp.appendChild(el("br")); sp.appendChild(sm); h1.appendChild(sp);
    art.appendChild(h1);
    var pb = el("div", "pb"); art.appendChild(pb); fillPolicy(pb, a, tpl);
    return art;
  }
  function run(data) {
    var grid = document.querySelector("#apps .g"), tpl = data.policy_template, main = document.getElementById("pvw");
    var stamp = Date.now();
    /* Silinen uygulamalar: sabit HTML'deki kart ve gizlilik sayfasını kaldır */
    (data.deleted || []).forEach(function (id) {
      var pv = document.getElementById("pv-" + id); if (pv) pv.remove();
      document.querySelectorAll('.g .c img[src^="icons/' + id + '.png"]').forEach(function (im) {
        var c = im.closest(".c"); if (c) c.remove();
      });
    });
    /* İkonlar: önbelleği aşmak için sürüm numarası ekle */
    document.querySelectorAll('img[src^="icons/"]').forEach(function (im) {
      im.src = im.getAttribute("src").split("?")[0] + "?v=" + stamp;
    });
    /* Üstteki kayan ikon bandı: veriden yeniden üret (iki özdeş yarı, animasyon için) */
    var mq = document.querySelector(".mq");
    if (mq && data.apps.length) {
      var half = document.createDocumentFragment();
      var copies = Math.max(1, Math.ceil(8 / data.apps.length));
      for (var r = 0; r < copies; r++) {
        data.apps.forEach(function (a) {
          var im = el("img"); im.src = a.icon + "?v=" + stamp; im.alt = ""; im.width = 60; im.height = 60;
          half.appendChild(im);
        });
      }
      mq.innerHTML = "";
      mq.appendChild(half.cloneNode(true));
      mq.appendChild(half);
    }
    /* Uygulama sayısı */
    var cnt = document.querySelector(".st b");
    if (cnt) cnt.textContent = data.apps.length;
    var gone = data.deleted || [];
    data.apps = data.apps.filter(function (a) { return gone.indexOf(a.id) < 0; });
    data.apps.forEach(function (a) {
      if (grid && !grid.querySelector('img[src^="' + a.icon + '"]')) { grid.appendChild(card(a)); added = true; }
      var pv = document.getElementById("pv-" + a.id);
      if (!pv && main) { main.appendChild(article(a, tpl)); PV.push(a.id); added = true; }
      else if (pv && a.policy_text) fillPolicy(pv.querySelector(".pb"), a, tpl);
    });
    var q = new URLSearchParams(location.search).get("privacy");
    if (q && !document.documentElement.classList.contains("pvm") && document.getElementById("pv-" + q)) route();
    /* Panelden eklenen içerik İngilizce; Türkçe seçiliyse sayfayı Google Translate ile çevir */
    if (added) askTr();
  }
  var added = false;
  /* Panelden eklenen içerik İngilizce. Seçili dil (cihaz dili ya da kullanıcının seçimi) İngilizce değilse
     sayfayı o dile Google Translate ile çevirir; kullanıcı dili değiştirirse de aynı şekilde davranır. */
  function askTr() {
    var sel = document.getElementById("lsel");
    if (!sel) return;
    if (sel.value && sel.value !== "en") setTimeout(function () { gt(sel.value); }, 600);
    if (!sel.dataset.autoTr) {
      sel.dataset.autoTr = "1";
      sel.addEventListener("change", function () {
        if (sel.value !== "en") setTimeout(function () { gt(sel.value); }, 400);
      });
    }
  }
  fetch("data/apps.json?v=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.json(); }).then(run).catch(function () {});

  /* Üst bardaki "Labs Dev Apps" logosuna kısa sürede 10 tıklama: yönetici paneli.
     (Uygulama ikonlarındaki 10 tıklama kopyalama menüsünü açmaya devam eder.) */
  var brand = document.querySelector("nav a.br");
  if (brand) {
    var n = 0, last = 0;
    brand.addEventListener("click", function () {
      var now = Date.now();
      n = now - last > 2500 ? 1 : n + 1;
      last = now;
      if (n >= 10) { n = 0; location.href = "admin.html"; }
    });
  }
})();
