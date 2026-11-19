import { art } from "./art.js";
import { downloadDocument } from "./document.js";

const $ = (s) => document.querySelector(s);
const app = $("#app"),
  main = $("#content"),
  overlay = $("#overlay");
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
function button(label, action, cls = "btn") {
  const b = el("button", cls, label);
  b.type = "button";
  b.addEventListener("click", action);
  return b;
}
const price = 16500,
  startDate = "12.11.2026",
  endDate = "11.11.2027";
const accounts = [
  { id: "1234", balance: 500000 },
  { id: "5678", balance: 5000 },
  { id: "9012", balance: 2000000 },
];
const examples = [
  ["Вениаминов Константин Павлович", "12.08.2002"],
  ["Иванова Мария Викторовна", "11.12.1988"],
  ["Климов Пётр Денисович", "23.04.1995"],
  ["Петров Алексей Сергеевич", "05.06.1990"],
  ["Смирнова Анна Викторовна", "05.11.1998"],
].map(([name, birth], i) => ({
  name,
  birth,
  phone: "+7 000 000 00 0" + (i + 1),
  email: "demo" + (i + 1) + "@example.org",
}));
const money = (n, dec = false) =>
  n.toLocaleString("ru-RU", {
    minimumFractionDigits: dec ? 2 : 0,
    maximumFractionDigits: dec ? 2 : 0,
  }) + " ₽";
const employeesWord = (n) =>
  n +
  " " +
  (n % 100 >= 11 && n % 100 <= 14
    ? "сотрудников"
    : n % 10 === 1
      ? "сотрудник"
      : n % 10 >= 2 && n % 10 <= 4
        ? "сотрудника"
        : "сотрудников");
let page = "store",
  device = "",
  people = [],
  policies = [],
  account = 0,
  fault = "",
  pop = null,
  focusOrigin = null;
let cardMenu = -1,
  accountMenu = false,
  targetPolicy = null,
  issued = null,
  toastTimer,
  loadTimer,
  codeTimer;
const total = () => people.length * price;
function toast(msg) {
  clearTimeout(toastTimer);
  $("#toast").textContent = msg;
  toastTimer = setTimeout(() => ($("#toast").textContent = ""), 3100);
}
function hotspot(parent, label, box, action) {
  const [x, y, w, h] = box,
    b = button("", action, "hit");
  b.setAttribute("aria-label", label);
  b.title = label;
  Object.assign(b.style, {
    left: x + "px",
    top: y + "px",
    width: w + "px",
    height: h + "px",
  });
  parent.append(b);
  return b;
}
function picture(key, actions = {}, replacements = {}) {
  const m = art[key],
    n = el("div", "art");
  n.dataset.art = key;
  n.style.width = m.w + "px";
  n.style.height = m.h + "px";
  const img = el("img");
  img.decoding = "sync";
  img.src = "./assets/" + key + ".webp";
  img.alt = "";
  img.width = m.w;
  img.height = m.h;
  n.append(img);
  const summary = [];
  for (const t of m.texts) {
    if (Object.hasOwn(replacements, t.v)) {
      const val = el("span", "value", replacements[t.v]);
      val.style.fontSize = t.s + "px";
      val.style.top = t.y - t.s * 0.95 + "px";
      val.style.left = t.x + "px";
      if (t.v.startsWith("Начнёт действовать")) {
        val.style.left = (device === "d" ? 52 : 0) + "px";
        val.style.width = (device === "d" ? 824 : m.w) + "px";
        val.style.textAlign = "center";
      }
      if (key.endsWith("-card") && /^\d+ сотруд|^До /.test(t.v))
        val.style.fontWeight = "600";
      n.append(val);
    } else if (actions[t.v]) {
      let box = t.b || [
        t.x - 12,
        t.y - 25,
        Math.max(78, t.v.length * 9 + 24),
        40,
      ];
      if (box[3] < 32)
        box = [
          Math.max(0, box[0] - 12),
          Math.max(0, box[1] - 13),
          box[2] + 24,
          box[3] + 26,
        ];
      hotspot(n, t.v, box, actions[t.v]);
    } else if (!summary.includes(t.v)) summary.push(t.v);
  }
  if (summary.length) {
    const description = el("span", "sr", summary.join(". "));
    n.prepend(description);
  }
  return n;
}
function go(next, { top = true, replace = false } = {}) {
  clearTimeout(loadTimer);
  const replaceDialog = history.state?.dialog;
  closeModal(false, true);
  page = next;
  cardMenu = -1;
  accountMenu = false;
  history[replace || replaceDialog ? "replaceState" : "pushState"](
    { page },
    "",
    location.pathname + location.search + "#" + page,
  );
  render();
  if (top) {
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }
}
function closeModal(restore = true, keepHistory = false) {
  const backFromDialog = !!pop && !!history.state?.dialog && !keepHistory;
  clearInterval(codeTimer);
  overlay.replaceChildren();
  overlay.className = "";
  document.body.classList.remove("lock");
  app.inert = false;
  $("#demo").inert = false;
  pop = null;
  if (restore && focusOrigin?.isConnected)
    focusOrigin.focus({ preventScroll: true });
  if (backFromDialog) history.back();
}
function showModal(
  title,
  body,
  { kind = "", drawer = false, onClose = null } = {},
) {
  const origin = document.activeElement;
  if (!pop) focusOrigin = origin;
  closeModal(false, true);
  if (!history.state?.dialog)
    history.pushState({ page, dialog: true }, "", location.href);
  const p = el("section", drawer ? "drawer" : "panel " + kind);
  p.setAttribute("role", "dialog");
  p.setAttribute("aria-modal", "true");
  p.setAttribute("aria-label", title);
  p.tabIndex = -1;
  const dismiss = onClose || (() => closeModal());
  if (!drawer) {
    const h = el("h2", "", title);
    p.append(h);
    const x = button("×", dismiss, "x");
    x.setAttribute("aria-label", "Закрыть");
    p.append(x);
  }
  body(p);
  overlay.append(p);
  overlay.className = drawer ? "drawer-open" : "";
  app.inert = true;
  $("#demo").inert = true;
  document.body.classList.add("lock");
  pop = { dismiss };
  p.focus({ preventScroll: true });
  return p;
}
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) pop?.dismiss();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (pop) {
      e.preventDefault();
      pop.dismiss();
    } else if (cardMenu !== -1 || accountMenu) {
      cardMenu = -1;
      accountMenu = false;
      render();
    }
    return;
  }
  if (e.key === "Tab" && pop) {
    const list = [
      ...overlay.querySelectorAll(
        "button:not(:disabled),input:not(:disabled),select,[href]",
      ),
    ].filter((b) => b.getClientRects().length);
    if (!list.length) return;
    if (
      e.shiftKey &&
      (document.activeElement === list[0] ||
        document.activeElement === overlay.firstChild)
    ) {
      e.preventDefault();
      list.at(-1).focus();
    } else if (!e.shiftKey && document.activeElement === list.at(-1)) {
      e.preventDefault();
      list[0].focus();
    }
  }
});
function resetDraft() {
  people = [];
  account = 0;
  fault = "";
  cardMenu = -1;
  accountMenu = false;
}
function start() {
  resetDraft();
  go("calculate");
}
function shop() {
  go(policies.length ? "policies" : "store");
}
function abandon() {
  if (!people.length) {
    resetDraft();
    shop();
    return;
  }
  showModal("Закончить оформление полиса?", (p) => {
    p.append(
      el("p", "intro", "Данные не сохранятся — придётся вводить всё заново"),
    );
    const a = el("div", "actions");
    a.append(
      button(
        "Да, закончить",
        () => {
          resetDraft();
          shop();
        },
        "btn primary",
      ),
      button("Продолжить", () => closeModal()),
    );
    p.append(a);
  });
}
function back() {
  if (page === "calculate") abandon();
  else if (page === "review") go("calculate");
  else if (page === "store" || page === "policies") scenarios();
  else shop();
}
function details(scrollPosition = 0) {
  const key = device + "-details";
  const drawer = showModal(
    "ДМС · Программа Пульс здоровья",
    (p) => {
      const n = picture(key, {
        "К оформлению": start,
        "Договор-оферта добровольного медицинского страхования": () => {
          const beforeDocument = p.scrollTop;
          documentView("offer", () => details(beforeDocument));
        },
      });
      hotspot(
        n,
        "Закрыть",
        device === "m" ? [306, 38, 65, 58] : [art[key].w - 75, 6, 65, 68],
        () => closeModal(),
      );
      p.append(n);
      p.style.width = art[key].w + "px";
    },
    { drawer: true },
  );
  if (typeof scrollPosition === "number") drawer.scrollTop = scrollPosition;
}
function store() {
  const n = picture(device + "-store", {
    "К оформлению": start,
    "Узнать больше": details,
  });
  if (device === "m")
    hotspot(n, "ДМС · Узнать больше", [20, 122, 343, 222], details);
  main.append(n);
}
function staffSection() {
  if (!people.length)
    return picture(device + "-empty", { Добавить: () => employeeForm() });
  const s = el("section", "card");
  s.append(el("h2", "", "Сотрудники"));
  const list = el("div", "staff-list");
  people.forEach((person, i) => {
    const row = el("div", "employee"),
      info = el("div", "employee-info"),
      meta = el("div", "person-meta");
    [person.birth, person.phone, person.email].forEach((v, j) => {
      if (j) meta.append(el("span", "sep", "·"));
      meta.append(el("span", "", v));
    });
    info.append(el("p", "person-name", person.name), meta);
    const more = button(
      "···",
      () => {
        cardMenu = cardMenu === i ? -1 : i;
        accountMenu = false;
        render();
      },
      "more",
    );
    more.setAttribute("aria-label", "Действия с сотрудником " + person.name);
    more.setAttribute("aria-expanded", String(cardMenu === i));
    row.append(el("span", "num", i + 1 + "."), info, more);
    if (cardMenu === i) {
      const menu = el("div", "morelist");
      menu.append(
        button("Редактировать", () => employeeForm(i)),
        button("Удалить", () => removePerson(i)),
      );
      row.append(menu);
    }
    list.append(row);
  });
  const a = el("div", "addrow");
  a.append(button("＋  Добавить", () => employeeForm(), "btn small"));
  s.append(list, a);
  return s;
}
function removePerson(i) {
  showModal("Удалить сотрудника?", (p) => {
    p.append(el("p", "intro", people[i].name));
    const a = el("div", "actions");
    a.append(
      button(
        "Удалить",
        () => {
          people.splice(i, 1);
          cardMenu = -1;
          closeModal(false);
          render();
          toast("Сотрудник удалён");
        },
        "btn primary",
      ),
      button("Отменить", () => closeModal()),
    );
    p.append(a);
  });
}
function calculate() {
  main.append(picture(device + "-calc"));
  const col = el("div", "column");
  col.append(staffSection());
  const ac = el("section", "card account");
  ac.append(el("h2", "", "Счёт списания"));
  if (fault === "accounts-load" || fault === "no-accounts") {
    const reload = fault === "accounts-load";
    ac.append(
      el(
        "p",
        "",
        reload
          ? "Не получилось загрузить. Попробуйте ещё раз или зайдите позже"
          : "У вас нет доступных счетов для оплаты",
      ),
    );
    ac.append(
      button(
        reload ? "Попробовать ещё раз" : "К счетам",
        () => {
          if (reload) {
            fault = "";
            render();
          } else accountPicker();
        },
        "btn small",
      ),
    );
  } else {
    const sel = button(
        "",
        () => {
          accountMenu = !accountMenu;
          cardMenu = -1;
          render();
        },
        "select",
      ),
      wrap = el("span");
    wrap.append(
      el("small", "", "Рублёвый счёт ·· " + accounts[account].id),
      el("strong", "", money(accounts[account].balance, true)),
    );
    sel.append(wrap, el("span", "", "⌄"));
    sel.setAttribute("aria-expanded", String(accountMenu));
    if (account === 0 && total() <= accounts[0].balance) {
      ac.classList.add("original-account");
      ac.replaceChildren();
      const skin = picture(device + "-account", {
        "Рублёвый счёт ·· 1234, 500 000,00 ₽": () => {
          accountMenu = !accountMenu;
          cardMenu = -1;
          render();
        },
      });
      const pick = skin.querySelector(".hit");
      pick.classList.add("select");
      pick.setAttribute("aria-expanded", String(accountMenu));
      ac.append(skin);
    } else ac.append(sel);
    if (accountMenu) {
      const opts = el("div", "options");
      accounts.forEach((a, i) =>
        opts.append(
          button("·· " + a.id + "　" + money(a.balance, true), () => {
            account = i;
            accountMenu = false;
            render();
          }),
        ),
      );
      ac.append(opts);
    }
    if (accounts[account].balance < total())
      ac.append(
        el(
          "p",
          "err",
          "На счёте недостаточно денег. Пополните счёт или выберите другой",
        ),
      );
  }
  col.append(ac);
  if (!people.length && !fault) {
    const zero = picture(device + "-total-zero", {
      Продолжить: () => {
        toast("Добавьте хотя бы одного сотрудника");
        employeeForm();
      },
    });
    zero.classList.add("zero-total");
    col.append(zero);
    main.append(col);
    return;
  }
  const totals = el("div", "totals");
  for (const [key, val] of [
    ["Сумма", money(total())],
    ["Количество сотрудников", String(people.length)],
  ]) {
    const t = el("div", "total");
    t.append(el("small", "", key), el("strong", "", val));
    totals.append(t);
  }
  col.append(totals);
  const a = el("div", "proceed");
  a.append(
    button(
      "Продолжить",
      () => {
        if (!people.length) {
          toast("Добавьте хотя бы одного сотрудника");
          employeeForm();
          return;
        }
        if (fault || accounts[account].balance < total()) {
          toast("Выберите доступный счёт с достаточным остатком");
          ac.scrollIntoView({ block: "center" });
          return;
        }
        go("review");
      },
      "btn primary",
    ),
  );
  col.append(a);
  main.append(col);
}
function accountPicker() {
  showModal("Счета", (p) => {
    p.append(
      el(
        "p",
        "intro",
        "В этом сценарии нет доступных счетов для оплаты. Можно вернуться к оформлению или подключить демонстрационный счёт.",
      ),
    );
    const a = el("div", "actions");
    a.append(
      button(
        "Подключить демосчёт",
        () => {
          fault = "";
          account = 0;
          closeModal(false);
          render();
        },
        "btn primary",
      ),
      button("Назад", () => closeModal()),
    );
    p.append(a);
  });
}
function review() {
  const values = {
    5: people.length,
    7: people.length,
    "82 500,00 ₽": money(total(), true),
    "·· 1234": "·· " + accounts[account].id,
    "12.11.2026": startDate,
  };
  const n = picture(
    device + "-review",
    {
      "Страховой полис": () => documentView("policy"),
      "Поручение на перевод страховой премии": () => documentView("payment"),
      "Подписать и оплатить": () => codeDialog(),
      Продолжить: () => codeDialog(),
      Назад: () => go("calculate"),
      "Расчёт полиса страхования": () => go("calculate"),
    },
    values,
  );
  if (device === "m") {
    const b = button("Назад", () => go("calculate"), "btn mobile-back");
    Object.assign(b.style, {
      position: "absolute",
      left: "20px",
      width: "335px",
      top: "836px",
    });
    n.querySelector('[aria-label="Назад"]')?.remove();
    n.append(b);
  }
  main.append(n);
}
function finish() {
  if (page !== "review" || !people.length) return;
  issued = {
    number: "ДМС-" + String(policies.length + 1).padStart(5, "0"),
    count: people.length,
    amount: total(),
    start: startDate,
    end: endDate,
    account: accounts[account].id,
    active: false,
    people: people.map((p) => ({ ...p })),
  };
  policies.unshift(issued);
  resetDraft();
  go("success", { replace: true });
}
function success() {
  main.append(
    picture(
      device + "-success",
      { "К страховкам": () => go("policies") },
      {
        "Начнёт действовать с 01.03.2026":
          "Начнёт действовать с " + (issued?.start || startDate),
      },
    ),
  );
}
function policiesPage() {
  main.append(picture(device + "-policies-header"));
  const strip = el("div", "policy-strip"),
    wrap = el("div", "strip-wrap");
  policies.forEach((pol, i) => {
    const key = pol.active ? "active-card" : "processing-card",
      repl = {};
    for (const t of art[key].texts) {
      if (t.v.startsWith("Полис №")) repl[t.v] = "Полис №" + pol.number;
      else if (t.v.startsWith("До ")) repl[t.v] = "До " + pol.end;
      else if (/^\d+ сотруд/.test(t.v)) repl[t.v] = employeesWord(pol.count);
    }
    const c = picture(key, {}, repl);
    c.classList.add("policy-card");
    const b = button("", () => policyDetails(i), "policy-open");
    b.setAttribute(
      "aria-label",
      "Полис №" + pol.number + " · " + (pol.active ? "Активен" : "В обработке"),
    );
    c.append(b);
    strip.append(c);
    if (pol.active)
      hotspot(c, "Меню полиса №" + pol.number, [230, 12, 52, 47], () =>
        policyDetails(i, true),
      );
  });
  wrap.append(strip);
  main.append(wrap);
  if (policies.length > { d: 4, t: 2, m: 1 }[device]) {
    const controls = el("div", "arrows");
    const prev = button("‹", () => step(-1)),
      next = button("›", () => step(1));
    prev.setAttribute("aria-label", "Предыдущий полис");
    next.setAttribute("aria-label", "Следующий полис");
    function step(dir) {
      strip.scrollBy({
        left:
          dir *
          (strip.children[0].offsetWidth +
            parseFloat(getComputedStyle(strip).gap)),
        behavior: "smooth",
      });
    }
    function update() {
      prev.disabled = strip.scrollLeft < 2;
      next.disabled =
        strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 2;
    }
    controls.append(prev, next);
    wrap.append(controls);
    strip.addEventListener("scroll", update);
    requestAnimationFrame(update);
  }
  const offer = picture(device + "-offer", {
    "К оформлению": start,
    "Узнать больше": details,
  });
  if (device === "m")
    hotspot(offer, "ДМС · Узнать больше", [20, 58, 335, 162], details);
  main.append(offer);
}
function policyDetails(i, menuOnly = false) {
  targetPolicy = policies[i];
  showModal(menuOnly ? "Действия с полисом" : "Полис ДМС", (p) => {
    p.append(
      el(
        "p",
        "intro",
        "Полис №" +
          targetPolicy.number +
          " · " +
          (targetPolicy.active ? "Активен" : "В обработке"),
      ),
    );
    if (!menuOnly)
      p.append(
        el(
          "p",
          "docs",
          employeesWord(targetPolicy.count) +
            " · " +
            money(targetPolicy.amount, true) +
            " · до " +
            targetPolicy.end,
        ),
      );
    const a = el("div", "actions");
    a.append(
      button(
        "Скачать договор",
        () => downloadDocument("policy", targetPolicy),
        "btn primary",
      ),
      button("К страховкам", () => closeModal()),
    );
    p.append(a);
  });
}
function documentView(type, returnTo = null) {
  const names = {
    policy: "Страховой полис",
    payment: "Поручение на перевод страховой премии",
    offer: "Договор-оферта добровольного медицинского страхования",
  };
  const data = {
    number: "Проект",
    count: people.length,
    amount: total(),
    account: accounts[account].id,
    start: startDate,
    end: endDate,
  };
  showModal(
    names[type],
    (p) => {
      const d = el("div", "docs");
      d.append(
        el("h3", "", "Демонстрационный образец"),
        el(
          "p",
          "",
          type === "offer"
            ? "Программа «Пульс здоровья». ДМС для сотрудников от 18 до 65 лет."
            : "ДМС · Программа «Пульс здоровья»",
        ),
      );
      const dl = el("dl");
      const rows =
        type === "offer"
          ? [
              ["Срок", "1 год"],
              ["За сотрудника", money(price)],
            ]
          : [
              ["Застраховано", employeesWord(data.count)],
              ["Страховая премия", money(data.amount, true)],
              ["Счёт списания", "·· " + data.account],
              ["Срок", data.start + " — " + data.end],
            ];
      rows.forEach(([k, v]) => dl.append(el("dt", "", k), el("dd", "", v)));
      d.append(dl);
      p.append(d);
      const a = el("div", "actions");
      a.append(
        button(
          "Скачать PDF",
          () => downloadDocument(type, data),
          "btn primary",
        ),
        button("Назад", returnTo || (() => closeModal())),
      );
      p.append(a);
    },
    { onClose: returnTo },
  );
}
const norm = (v) =>
  v.trim().toLocaleLowerCase("ru").replace(/ё/g, "е").replace(/\s+/g, " ");
const identity = (p) => norm(p.name) + "|" + p.birth;
const birthString = (y, m, d) =>
  String(d).padStart(2, "0") + "." + String(m + 1).padStart(2, "0") + "." + y;
function parseDate(text) {
  const a = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text);
  if (!a) return null;
  const [day, month, year] = a.slice(1).map(Number),
    dt = new Date(year, month - 1, day);
  return dt.getFullYear() === year &&
    dt.getMonth() === month - 1 &&
    dt.getDate() === day
    ? dt
    : null;
}
function calendar(box, input) {
  const existing = box.querySelector(".calendar");
  if (existing) {
    existing.remove();
    return;
  }
  const c = el("div", "calendar");
  c.setAttribute("aria-label", "Календарь даты рождения");
  const dt = parseDate(input.value) || new Date(2002, 7, 1);
  let y = dt.getFullYear(),
    m = dt.getMonth();
  function paint() {
    c.replaceChildren();
    const head = el("div", "cal-head"),
      years = el("select"),
      months = el("select");
    months.setAttribute("aria-label", "Месяц");
    years.setAttribute("aria-label", "Год");
    const names = [
      "Январь",
      "Февраль",
      "Март",
      "Апрель",
      "Май",
      "Июнь",
      "Июль",
      "Август",
      "Сентябрь",
      "Октябрь",
      "Ноябрь",
      "Декабрь",
    ];
    names.forEach((n, i) =>
      months.add(new Option(n, String(i), false, m === i)),
    );
    for (let v = Math.max(2026, y); v >= Math.min(1920, y); v--)
      years.add(new Option(v, v, false, v === y));
    months.onchange = () => {
      m = Number(months.value);
      paint();
    };
    years.onchange = () => {
      y = Number(years.value);
      paint();
    };
    const move = (d) => {
      const v = new Date(y, m + d, 1);
      y = v.getFullYear();
      m = v.getMonth();
      paint();
    };
    const prev = button("‹", () => move(-1)),
      next = button("›", () => move(1));
    prev.setAttribute("aria-label", "Предыдущий месяц");
    next.setAttribute("aria-label", "Следующий месяц");
    head.append(prev, months, years, next);
    const grid = el("div", "cal-grid");
    for (const wd of ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"])
      grid.append(el("span", "", wd));
    for (let i = 0; i < (new Date(y, m, 1).getDay() + 6) % 7; i++)
      grid.append(el("span"));
    for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) {
      const v = birthString(y, m, d);
      const b = button(d, () => {
        input.value = v;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        c.remove();
        input.focus();
      });
      b.setAttribute("aria-label", v);
      grid.append(b);
    }
    c.append(head, grid);
  }
  paint();
  box.append(c);
}
function employeeForm(index = null) {
  const edit = index !== null,
    person = edit ? people[index] : {},
    title = edit ? "Редактирование сотрудника" : "Добавление сотрудника";
  showModal(
    title,
    (p) => {
      const form = el("form");
      form.autocomplete = "off";
      form.noValidate = true;
      const banner = el("div");
      banner.setAttribute("role", "alert");
      form.append(banner);
      const fields = el("div", "fields"),
        controls = {};
      for (const [key, label, type] of [
        ["name", "ФИО", "text"],
        ["birth", "Дата рождения", "text"],
        ["phone", "Телефон", "tel"],
        ["email", "Email", "email"],
      ]) {
        const field = el(
            "div",
            "field " + (["name", "email"].includes(key) ? "full" : ""),
          ),
          input = el("input");
        input.type = type;
        input.id = "person-" + key;
        input.name = key;
        input.value = person[key] || "";
        input.placeholder = label;
        input.maxLength = key === "birth" ? 10 : key === "phone" ? 24 : 140;
        input.required = true;
        input.autocomplete = "off";
        if (key === "birth") input.inputMode = "numeric";
        const cap = el("label", "", label);
        cap.htmlFor = input.id;
        const error = el("small");
        error.id = input.id + "-error";
        input.setAttribute("aria-describedby", error.id);
        field.append(input, cap);
        if (key === "birth") {
          const cal = button("▦", () => calendar(form, input), "cal");
          cal.setAttribute("aria-label", "Выбрать дату рождения в календаре");
          field.append(cal);
        }
        field.append(error);
        fields.append(field);
        controls[key] = input;
        input.addEventListener("input", () => {
          if (key === "birth") {
            const beforeCaret = input.value
              .slice(0, input.selectionStart)
              .replace(/\D/g, "").length;
            const digits = input.value.replace(/\D/g, "").slice(0, 8);
            const formatted = [
              digits.slice(0, 2),
              digits.slice(2, 4),
              digits.slice(4),
            ]
              .filter(Boolean)
              .join(".");
            if (input.value !== formatted) {
              input.value = formatted;
              const caret =
                beforeCaret + Number(beforeCaret > 2) + Number(beforeCaret > 4);
              input.setSelectionRange(caret, caret);
            }
          }
          error.textContent = "";
          input.removeAttribute("aria-invalid");
          banner.textContent = "";
          banner.className = "";
          submit.disabled = false;
        });
      }
      form.append(fields);
      const a = el("div", "actions"),
        submit = el("button", "btn primary", edit ? "Сохранить" : "Добавить");
      submit.type = "submit";
      a.append(
        submit,
        button("Отменить", () => closeModal()),
      );
      form.append(a);
      const hint = el("div", "form-hint");
      hint.append(
        button(
          "Подставить демоданные",
          () => {
            const used = new Set(
              [...people, ...policies.flatMap((pol) => pol.people || [])].map(
                identity,
              ),
            );
            let generated = {
              name: "Орлов Николай Андреевич",
              birth: "12.03.1990",
              phone: "+7 000 000 00 00",
              email: "orlov@example.org",
            };
            for (let d = 0; used.has(identity(generated)); d++) {
              const dt = new Date(1990, 2, 13 + d);
              generated = {
                ...generated,
                birth: birthString(
                  dt.getFullYear(),
                  dt.getMonth(),
                  dt.getDate(),
                ),
              };
            }
            const sample =
              examples.find(
                (ex) =>
                  !people.some((q) => identity(q) === identity(ex)) &&
                  !policies.some((pol) =>
                    pol.people?.some((q) => identity(q) === identity(ex)),
                  ),
              ) || generated;
            for (const [k, v] of Object.entries(sample)) {
              controls[k].value = v;
              controls[k].dispatchEvent(new Event("input", { bubbles: true }));
            }
          },
          "sample",
        ),
      );
      form.append(hint);
      p.append(form);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const val = Object.fromEntries(
          Object.entries(controls).map(([k, f]) => [k, f.value.trim()]),
        );
        const errors = {},
          dt = parseDate(val.birth),
          today = parseDate(startDate);
        if (!val.name) errors.name = "Введите ФИО";
        else if (
          val.name.split(/\s+/).length < 2 ||
          !/^[\p{L}\p{M}\s.'’–-]+$/u.test(val.name)
        )
          errors.name = "Введите фамилию и имя";
        if (!val.birth) errors.birth = "Введите дату рождения";
        else if (!dt) errors.birth = "Введите дату в формате ДД.ММ.ГГГГ";
        else {
          let age = today.getFullYear() - dt.getFullYear();
          if (
            today.getMonth() < dt.getMonth() ||
            (today.getMonth() === dt.getMonth() &&
              today.getDate() < dt.getDate())
          )
            age--;
          if (age < 18 || age > 65)
            errors.birth = "Возраст сотрудника — от 18 до 65 лет";
        }
        if (!val.phone) errors.phone = "Введите телефон";
        else if (!/^[78]\d{10}$/.test(val.phone.replace(/\D/g, "")))
          errors.phone = "Введите российский номер полностью";
        if (!val.email) errors.email = "Введите email";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.email))
          errors.email = "Проверьте адрес email";
        for (const [k, input] of Object.entries(controls)) {
          const message = errors[k] || "";
          document.getElementById(input.id + "-error").textContent = message;
          input.setAttribute("aria-invalid", String(!!message));
        }
        if (Object.keys(errors).length) {
          controls[Object.keys(errors)[0]].focus();
          return;
        }
        let duplicate = "";
        if (people.some((q, i) => i !== index && identity(q) === identity(val)))
          duplicate = "Сотрудник с таким ФИО и датой рождения уже добавлен";
        if (
          policies.some((pol) =>
            pol.people?.some((q) => identity(q) === identity(val)),
          )
        )
          duplicate = "Сотрудник с таким ФИО и датой рождения уже застрахован";
        if (duplicate) {
          banner.className = "banner";
          banner.textContent = duplicate;
          submit.disabled = true;
          return;
        }
        const num = val.phone.replace(/\D/g, "");
        val.phone =
          "+7 " +
          num.slice(1, 4) +
          " " +
          num.slice(4, 7) +
          " " +
          num.slice(7, 9) +
          " " +
          num.slice(9);
        if (edit) people[index] = val;
        else people.push(val);
        cardMenu = -1;
        closeModal(false);
        render();
        toast(edit ? "Изменения сохранены" : "Сотрудник добавлен");
      });
    },
    { kind: "employee-panel" },
  );
}
function codeDialog(initialError = false) {
  let state = initialError ? "error" : "empty",
    remaining = 25,
    seq = 0;
  const panel = showModal(
    "Введите код из уведомления",
    (p) => {
      p.append(
        el("p", "intro", "Подписание в деморежиме · Тестовый код 00000"),
      );
      const digits = el("div", "digits");
      digits.setAttribute("aria-label", "Пять разрядов тестового кода");
      const cells = Array.from({ length: 5 }, (_, i) => {
        const d = button("", () => enterDigit("0"), "digit");
        d.setAttribute("aria-label", "Ввести 0 · разряд " + (i + 1));
        return d;
      });
      digits.append(...cells);
      p.append(digits);
      const feedback = el("div", "err");
      feedback.setAttribute("role", "status");
      const write = () => {
        cells.forEach((c, i) => {
          c.textContent = i < seq ? (state === "error" ? "1" : "0") : "";
        });
        feedback.textContent =
          state === "error" ? "Код не подходит, проверьте его" : "";
      };
      if (initialError) {
        seq = 5;
        write();
      }
      p.append(feedback);
      const ctrl = el("div", "code-controls");
      function ok() {
        state = "filled";
        seq = 5;
        write();
        confirm.disabled = true;
        wrong.disabled = true;
        loadTimer = setTimeout(() => {
          if (overlay.contains(p)) finish();
        }, 400);
      }
      const confirm = button("Подставить 00000", ok, "btn small"),
        wrong = button(
          "Проверить неверный код",
          () => {
            state = "error";
            seq = 5;
            write();
          },
          "sample",
        );
      ctrl.append(confirm, wrong);
      p.append(ctrl);
      function enterDigit(d) {
        if (state === "filled") return;
        if (state === "error") {
          state = "empty";
          seq = 0;
        }
        if (d === "1") state = "incorrect";
        seq = Math.min(seq + 1, 5);
        if (seq === 5 && state === "incorrect") state = "error";
        write();
        if (seq === 5 && state !== "error") ok();
      }
      p.addEventListener("keydown", (e) => {
        if (e.key === "0" || e.key === "1") {
          e.preventDefault();
          enterDigit(e.key);
        }
      });
      const timer = el("p"),
        again = button(
          "Запросить новый код",
          () => {
            remaining = 25;
            state = "empty";
            seq = 0;
            write();
            tick();
            toast("Демонстрационный код обновлён");
          },
          "link",
        );
      p.append(timer, again);
      function tick() {
        timer.textContent = remaining
          ? "Запросить новый можно через 00:" +
            String(remaining).padStart(2, "0")
          : "";
        again.hidden = remaining > 0;
      }
      tick();
      codeTimer = setInterval(() => {
        remaining = Math.max(remaining - 1, 0);
        tick();
      }, 1000);
      const help = button(
        "Не приходит код?",
        () => {
          const n = p.querySelector(".code-help");
          if (n) n.remove();
          else
            p.append(
              el(
                "p",
                "intro code-help",
                "В демонстрации уведомления отключены. Нажмите «Подставить 00000» или пять раз нажмите 0.",
              ),
            );
        },
        "link",
      );
      p.append(help);
    },
    { kind: "code-panel" },
  );
  panel.focus();
}
function loading(which, next, delay = 700) {
  go(which);
  loadTimer = setTimeout(() => go(next, { replace: true }), delay);
}
function errorPage() {
  if (device === "d") {
    const actions = {
      "Попробовать ещё раз": () =>
        loading(
          page === "policy-error" ? "policies-loading" : "store-loading",
          page === "policy-error" ? "policies" : "store",
        ),
      "На главную": shop,
      Рассчитать: start,
      Подробнее: details,
    };
    main.append(picture(page, actions));
    return;
  }
  const states = {
    offline: [
      "Потеряли связь с вами",
      "Проверьте подключение к интернету и попробуйте ещё раз",
    ],
    denied: ["Недостаточно прав", "Обратитесь к своему руководителю"],
    "load-error": [
      "Не получилось загрузить",
      "Уже исправляем. Попробуйте ещё раз или зайдите позже",
    ],
    "policy-error": [
      "Не получилось загрузить полис",
      "Уже исправляем. Попробуйте ещё раз или зайдите позже",
    ],
  };
  const c = el("section", "error-card");
  const [title, sub] = states[page];
  c.append(
    el("h1", "", title),
    el("p", "intro", sub),
    button(page === "denied" ? "На главную" : "Попробовать ещё раз", () =>
      page === "denied"
        ? shop()
        : loading(
            "store-loading",
            page === "policy-error" ? "policies" : "store",
          ),
    ),
  );
  main.append(c);
}
const samplePolicy = (n = 1, active = true) => ({
  number: "123125123/" + (2311 + n),
  count: active ? 7 : 4,
  amount: (active ? 7 : 4) * price,
  start: startDate,
  end: active ? "01.08.2027" : "10.09.2027",
  account: "1234",
  active,
  people: [],
});
function scenarios() {
  showModal("Сценарии прототипа", (p) => {
    p.append(
      el(
        "p",
        "intro",
        "ДМС для бизнеса. Все действия выполняются в этой вкладке. Для заполнения формы доступны вымышленные сотрудники.",
      ),
    );
    const nav = el("div", "agenda");
    p.append(nav);
    const group = (name, items) => {
      nav.append(el("h3", "", name));
      items.forEach(([label, act]) => nav.append(button(label, act)));
    };
    const fill = (n = 5) => {
      resetDraft();
      people = examples.slice(0, n).map((o) => ({ ...o }));
    };
    group("Оформление", [
      [
        "Витрина без полисов",
        () => {
          policies = [];
          resetDraft();
          go("store");
        },
      ],
      [
        "Расчёт с пятью сотрудниками",
        () => {
          policies = [];
          fill();
          go("calculate");
        },
      ],
      [
        "Проверка и подписание",
        () => {
          fill();
          go("review");
        },
      ],
      [
        "Прерывание оформления",
        () => {
          fill();
          go("calculate");
          abandon();
        },
      ],
    ]);
    group("Проверки и ошибки", [
      [
        "Обязательные поля",
        () => {
          resetDraft();
          go("calculate");
          employeeForm();
          overlay.querySelector("form").requestSubmit();
        },
      ],
      ["Повторное добавление сотрудника", () => duplicateDemo(false)],
      ["Сотрудник уже застрахован", () => duplicateDemo(true)],
      [
        "Недостаточно денег",
        () => {
          fill();
          account = 1;
          go("calculate");
          scrollToAccount();
        },
      ],
      [
        "Не загрузился список счетов",
        () => {
          fill();
          fault = "accounts-load";
          go("calculate");
          scrollToAccount();
        },
      ],
      [
        "Нет доступных счетов",
        () => {
          fill();
          fault = "no-accounts";
          go("calculate");
          scrollToAccount();
        },
      ],
      [
        "Неверный код подтверждения",
        () => {
          fill();
          go("review");
          codeDialog(true);
        },
      ],
      [
        "Не загрузился полис",
        () => {
          policies = [samplePolicy()];
          go("policy-error");
        },
      ],
      ["Недостаточно прав", () => go("denied")],
      ["Не получилось загрузить страницу", () => go("load-error")],
      ["Пропала связь", () => go("offline")],
    ]);
    group("Полисы и загрузка", [
      [
        "Витрина с полисами",
        () => {
          policies = [samplePolicy(1, false), samplePolicy(2)];
          go("policies");
        },
      ],
      [
        "Пять полисов в карусели",
        () => {
          policies = Array.from({ length: 5 }, (_, i) =>
            samplePolicy(i + 1, i !== 0),
          );
          go("policies");
        },
      ],
      ["Загрузка витрины", () => loading("store-loading", "store", 1800)],
      [
        "Загрузка полисов",
        () => {
          policies = [samplePolicy()];
          loading("policies-loading", "policies", 1800);
        },
      ],
      [
        "Загрузка документов",
        () => {
          fill();
          loading("review-loading", "review", 1800);
        },
      ],
    ]);
  });
}
function scrollToAccount() {
  requestAnimationFrame(() =>
    $(".account")?.scrollIntoView({ block: "center" }),
  );
}
function duplicateDemo(insured) {
  resetDraft();
  policies = insured
    ? [{ ...samplePolicy(), people: [{ ...examples[0] }] }]
    : [];
  if (!insured) people = [{ ...examples[0] }];
  go("calculate");
  employeeForm();
  const f = overlay.querySelector("form");
  Object.entries(examples[0]).forEach(
    ([k, v]) => (f.elements.namedItem(k).value = v),
  );
  f.requestSubmit();
}
function render() {
  document.getElementById("canvas").dataset.stage = page;
  main.replaceChildren();
  $("#side").replaceChildren();
  $("#header").replaceChildren();
  $("#bar").replaceChildren();
  const hdr = picture(device + "-header", { Назад: back });
  if (device === "m") hotspot(hdr, "Назад", [4, 42, 58, 56], back);
  if (device === "t" && page !== "store" && page !== "policies")
    hotspot(hdr, "Вернуться", [0, 0, 62, 56], back);
  $("#header").append(hdr);
  if (device === "d") {
    const sideKey =
      {
        calculate: "d-side-calc",
        review: "d-side-review",
        policies: "d-side-policies",
      }[page] || "d-side";
    const n = picture(sideKey);
    const row = art["d-side"].texts.find(
      (t) => t.v === "Страховки для бизнеса",
    );
    if (row)
      hotspot(
        n,
        row.v,
        [0, row.y - 26, 248, 42],
        page === "calculate" || page === "review" ? abandon : shop,
      );
    $("#side").append(n);
  }
  if (device !== "m") $("#bar").append(picture(device + "-footer"));
  if (page === "store") store();
  else if (page === "calculate") calculate();
  else if (page === "review") review();
  else if (page === "success") success();
  else if (page === "policies") policiesPage();
  else if (page.endsWith("-loading")) {
    if (device === "d") main.append(picture(page));
    else {
      const s = el("div", "skeletons");
      s.setAttribute("aria-label", "Загрузка");
      s.append(el("i"), el("i"), el("i"));
      main.append(s);
    }
  } else errorPage();
  main.setAttribute(
    "aria-label",
    {
      store: "Страховки для бизнеса",
      calculate: "Расчёт полиса",
      review: "Проверка и подписание",
      success: "Страховой полис оформлен",
      policies: "Ваши полисы",
    }[page] || "Состояние оформления",
  );
}
function size() {
  const w = document.documentElement.clientWidth;
  const d = w < 600 ? "m" : w < 1060 ? "t" : "d";
  const board = { d: 1600, t: 768, m: 375 }[d];
  const z = Math.min(w / board, d === "d" ? 1.22 : 2);
  const root = document.documentElement;
  root.style.setProperty("--board", board + "px");
  root.style.setProperty("--zoom", z);
  root.style.setProperty(
    "--ui",
    d === "m" ? w / 375 : Math.min(z, (w - 24) / 764, 1.15),
  );
  root.style.setProperty("--side", d === "d" ? "248px" : "0px");
  root.style.setProperty("--inset", { d: 52, t: 32, m: 0 }[d] + "px");
  root.style.setProperty("--cw", { d: 824, t: 704, m: 375 }[d] + "px");
  document.body.classList.toggle("mobile", d === "m");
  if (d !== device) {
    const hasDetails = overlay.querySelector(".drawer");
    device = d;
    render();
    if (hasDetails) details();
  }
}
$("#demo").onclick = scenarios;
document.addEventListener("click", (e) => {
  if (cardMenu !== -1 && !e.target.closest(".employee,.panel") && !pop) {
    cardMenu = -1;
    render();
  } else if (accountMenu && !e.target.closest(".account,.panel") && !pop) {
    accountMenu = false;
    render();
  }
});
window.addEventListener("resize", size);
window.addEventListener("popstate", (e) => {
  const dest = e.state?.page || "store";
  if (pop) {
    pop.dismiss();
    return;
  }
  if (dest === page && !e.state?.dialog) return;
  if (
    page === "calculate" &&
    people.length &&
    ["store", "policies"].includes(dest)
  ) {
    history.pushState(
      { page },
      "",
      location.pathname + location.search + "#" + page,
    );
    abandon();
    return;
  }
  const unavailable =
    (dest === "review" && !people.length) ||
    (dest === "success" && !issued) ||
    (dest === "policies" && !policies.length) ||
    dest.endsWith("-loading");
  go(unavailable ? (policies.length ? "policies" : "store") : dest, {
    replace: true,
  });
});
const openScenarios = location.hash === "#scenarios";
history.replaceState(
  { page },
  "",
  location.pathname +
    location.search +
    (openScenarios ? "#scenarios" : "#store"),
);
size();
if (openScenarios) scenarios();
