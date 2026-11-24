/* =====================================
   MOBILE MENU
===================================== */

/* =====================================
   MOBILE MENU - EVERELLIS
===================================== */

console.log("MAIN JS LOADED");

function toggleMenu() {
  const menu = document.getElementById("navMenu");
  const button = document.getElementById("menuBtn");

  if (!menu || !button) {
    console.error("MENU ELEMENT NOT FOUND");
    return;
  }

  const isOpen = menu.classList.toggle("open");

  button.textContent = isOpen ? "✕" : "☰";
  button.setAttribute("aria-expanded", String(isOpen));
  button.setAttribute("aria-label", isOpen ? "Цэс хаах" : "Цэс нээх");
}

function closeMenu() {
  const menu = document.getElementById("navMenu");
  const button = document.getElementById("menuBtn");

  if (!menu || !button) return;

  menu.classList.remove("open");

  button.textContent = "☰";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", "Цэс нээх");
}

window.toggleMenu = toggleMenu;
window.closeMenu = closeMenu;

document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("navMenu");

  if (!menu) return;

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
});

/* =====================================
   NOTIFICATION
===================================== */

function notify(message) {
  let box = document.getElementById("notification");

  if (!box) {
    box = document.createElement("div");
    box.id = "notification";

    Object.assign(box.style, {
      position: "fixed",
      bottom: "65px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#171e29",
      border: "1px solid #c9a45e",
      color: "#eed7a3",
      padding: "15px 25px",
      zIndex: "9999",
      fontSize: "12px",
      textAlign: "center",
      maxWidth: "90%",
    });

    document.body.appendChild(box);
  }

  box.textContent = message;
  box.style.display = "block";

  clearTimeout(window.notifyTimer);

  window.notifyTimer = setTimeout(() => {
    box.style.display = "none";
  }, 2800);
}

/* =====================================
   STORAGE
===================================== */

function getRecords(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function saveRecords(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* =====================================
   SAFE TEXT
===================================== */

function safeText(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

/* =====================================
   CITIZEN REGISTRATION
===================================== */

const citizenKey = "everellis_citizens";

function renderCitizens() {
  const records = getRecords(citizenKey);

  const list = document.getElementById("citizenRecords");
  const count = document.getElementById("citizenCount");

  if (!list || !count) return;

  count.textContent = records.length;

  if (!records.length) {
    list.innerHTML = "<p>Одоогоор бүртгэл байхгүй байна.</p>";
    return;
  }

  list.innerHTML = records
    .map(
      (r, i) => `
        <div class="panel">
          <h3>${safeText(r.name)}</h3>
          <p>Овог: ${safeText(r.house || "Тодорхойгүй")}</p>
          <p>Зэрэг дэв: ${safeText(r.role)}</p>
          <button class="outline-button"
            onclick="deleteCitizen(${i})">
            УСТГАХ
          </button>
        </div>
      `,
    )
    .join("");
}

function deleteCitizen(index) {
  const records = getRecords(citizenKey);

  if (index < 0 || index >= records.length) return;

  records.splice(index, 1);

  saveRecords(citizenKey, records);
  renderCitizens();

  notify("Бүртгэлийг устгалаа.");
}

function setupCitizenForm() {
  const citizenForm = document.getElementById("citizenForm");

  if (!citizenForm) return;

  citizenForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("citizenName").value.trim();

    if (!name) {
      notify("Нэрээ оруулна уу.");
      return;
    }

    const records = getRecords(citizenKey);

    if (records.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
      notify("Энэ дүр өмнө нь бүртгэгдсэн байна.");
      return;
    }

    records.push({
      name,
      house: document.getElementById("citizenHouse").value.trim(),
      role: document.getElementById("citizenRole").value,
      bio: document.getElementById("citizenBio").value.trim(),
    });

    saveRecords(citizenKey, records);
    citizenForm.reset();

    renderCitizens();

    notify("Хаант улсын бүртгэлд амжилттай нэмэгдлээ.");
  });

  renderCitizens();
}

/* =====================================
   DIPLOMACY
===================================== */

const diplomacyKey = "everellis_diplomacy";

function renderDiplomacy() {
  const records = getRecords(diplomacyKey);
  const list = document.getElementById("diplomacyRecords");

  if (!list) return;

  if (!records.length) {
    list.innerHTML = "<p>Одоогоор дипломат хүсэлт байхгүй байна.</p>";
    return;
  }

  list.innerHTML = records
    .map(
      (r, i) => `
        <div class="panel">
          <h3>${safeText(r.kingdom)}</h3>
          <p>Төлөөлөгч: ${safeText(r.representative || "Тодорхойгүй")}</p>
          <p>Харилцааны төрөл: ${safeText(r.type)}</p>
          <p>Төлөв: ХҮЛЭЭГДЭЖ БУЙ</p>
          <button class="outline-button"
            onclick="deleteDiplomacy(${i})">
            УСТГАХ
          </button>
        </div>
      `,
    )
    .join("");
}

function deleteDiplomacy(index) {
  const records = getRecords(diplomacyKey);

  if (index < 0 || index >= records.length) return;

  records.splice(index, 1);

  saveRecords(diplomacyKey, records);
  renderDiplomacy();

  notify("Дипломат хүсэлтийг устгалаа.");
}

function setupDiplomacyForm() {
  const diplomacyForm = document.getElementById("diplomacyForm");

  if (!diplomacyForm) return;

  diplomacyForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const records = getRecords(diplomacyKey);

    records.push({
      kingdom: document.getElementById("foreignName").value.trim(),
      representative: document.getElementById("representative").value.trim(),
      type: document.getElementById("relationType").value,
      proposal: document.getElementById("proposal").value.trim(),
    });

    saveRecords(diplomacyKey, records);

    diplomacyForm.reset();
    renderDiplomacy();

    notify("Дипломат хүсэлт илгээгдлээ.");
  });

  renderDiplomacy();
}

/* =====================================
   KINGDOM MAP
===================================== */

const regions = {
  north: {
    name: "Хойд муж",
    description:
      "Хаант улсын хойд хилийн нутаг. Эртний уламжлал, уул нуруудаараа алдартай.",
  },

  south: {
    name: "Өмнөд муж",
    description: "Худалдаа, газар тариалан, соёлын төв болсон нутаг.",
  },

  east: {
    name: "Зүүн муж",
    description: "Гадаад харилцаа, худалдаа хөгжсөн стратегийн бүс.",
  },

  west: {
    name: "Баруун муж",
    description: "Язгууртан угсааны орд харш, түүхэн суурингуудтай нутаг.",
  },
};

function showRegion(id) {
  const data = regions[id];

  if (!data) return;

  const name = document.getElementById("regionName");
  const description = document.getElementById("regionDescription");

  if (name) name.textContent = data.name;
  if (description) description.textContent = data.description;
}

/* =====================================
   INITIALIZE
===================================== */

document.addEventListener("DOMContentLoaded", () => {
  setupCitizenForm();
  setupDiplomacyForm();
});

// ===================================
// CITIZEN PRIVATE ACCOUNT STATEMENT
// ===================================

function renderMyStatement(citizen) {
  const statementBox = document.getElementById("myStatement");

  if (!statementBox) return;

  const transactions = citizen.transactions || [];

  if (transactions.length === 0) {
    statementBox.innerHTML =
      "<p class='description'>Одоогоор гүйлгээ бүртгэгдээгүй байна.</p>";
    return;
  }

  statementBox.innerHTML = `
    <h3>МИНИЙ ДАНСНЫ ХУУЛГА</h3>

    <div class="transaction-list">
      ${[...transactions]
        .reverse()
        .map((t) => {
          const income = t.type !== "expense";
          const sign = income ? "+" : "-";
          const date = new Date(t.date).toLocaleString("mn-MN");

          return `
          <div class="transaction-item">
            <div>
              <strong>${escapeHTML(t.description)}</strong>
              <small>${escapeHTML(date)}</small>
            </div>

            <strong class="${income ? "income-text" : "expense-text"}">
              ${sign}${Number(t.amount).toLocaleString("en-US")} ₮
            </strong>
          </div>
        `;
        })
        .join("")}
    </div>
  `;
}
const starContainer = document.querySelector(".floating-stars");

for (let i = 0; i < 45; i++) {
  const star = document.createElement("span");

  star.className = "star";
  star.innerHTML = "✦";

  star.style.left = Math.random() * 100 + "%";
  star.style.animationDuration = 8 + Math.random() * 12 + "s";
  star.style.animationDelay = Math.random() * 15 + "s";
  star.style.fontSize = 6 + Math.random() * 12 + "px";

  starContainer.appendChild(star);
}
