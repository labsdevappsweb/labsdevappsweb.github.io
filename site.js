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
    var p = el("p"); bil(a.tagline_en, a.tagline_tr).forEach(function (x) { p.appendChild(x); }); c.appendChild(p);
    var ac = el("div", "ac");
    if (a.status === "live" && a.store_url) {
      var gp = el("a", "gp"); gp.href = a.store_url; gp.target = "_blank"; gp.rel = "noopener";
      var im = el("img", "gpb"); im.src = "https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png";
      im.alt = "Get it on Google Play"; im.height = 52; gp.appendChild(im); ac.appendChild(gp);
    } else {
      var s = el("span", "soon"); bil("Coming soon", "Yakında").forEach(function (x) { s.appendChild(x); }); ac.appendChild(s);
    }
    c.appendChild(ac);
    return c;
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
    data.apps.forEach(function (a) {
      if (grid && !grid.querySelector('img[src^="' + a.icon + '"]')) grid.appendChild(card(a));
      var pv = document.getElementById("pv-" + a.id);
      if (!pv && main) { main.appendChild(article(a, tpl)); PV.push(a.id); }
      else if (pv && a.policy_text) fillPolicy(pv.querySelector(".pb"), a, tpl);
    });
    var q = new URLSearchParams(location.search).get("privacy");
    if (q && !document.documentElement.classList.contains("pvm") && document.getElementById("pv-" + q)) route();
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
