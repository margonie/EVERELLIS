// ===================================
// EVERELLIS CITIZEN SYSTEM
// ===================================

// ДЕМО АДМИН НЭВТРЭХ МЭДЭЭЛЭЛ
const ADMIN_USERNAME = "everellisadmin";
const ADMIN_PASSWORD = "123456";

// МЭДЭЭЛЭЛ ХАДГАЛАХ
function getCitizens() {
  return JSON.parse(localStorage.getItem("everellisCitizens") || "[]");
}

function saveCitizens(data) {
  localStorage.setItem("everellisCitizens", JSON.stringify(data));
}

let currentUser = null;

// ===================================
// SECTION SWITCH
// ===================================

function showSection(sectionId) {
  const sections = document.querySelectorAll("main section");

  sections.forEach((section) => {
    section.classList.add("hidden");
  });

  const selectedSection = document.getElementById(sectionId);

  if (!selectedSection) {
    console.error("Section олдсонгүй:", sectionId);
    return;
  }

  selectedSection.classList.remove("hidden");

  if (sectionId === "archiveSection") {
    renderArchive();
  }

  if (sectionId === "adminSection") {
    renderAdmin();
  }

  if (sectionId === "dashboardSection") {
    renderDashboard();
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}
// ===================================
// FORGOT PASSWORD
// ===================================

function forgotPassword() {
  showNotification(
    "Нууц үгээ сэргээхийн тулд EVERELLIS-ийн админтай холбогдоно уу.",
    "error",
  );
}

// ===================================
// REGISTER
// ===================================

document
  .getElementById("registerForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const citizens = getCitizens();

    const username = document.getElementById("regUsername").value.trim();

    const surname = document.getElementById("regSurname").value.trim();

    const name = document.getElementById("regName").value.trim();

    const character = document.getElementById("regCharacter").value.trim();

    const secondcharacter = document
      .getElementById("regSecondcharacter")
      .value.trim();

    // Үсгийн том жижиг, илүү зайг үл харгалзан харьцуулах
    const normalize = (value) =>
      String(value ?? "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();

    // НЭВТРЭХ НЭР ШАЛГАХ
    if (citizens.some((c) => normalize(c.username) === normalize(username))) {
      showNotification(
        "Энэ нэвтрэх нэр аль хэдийн бүртгэгдсэн байна.",
        "error",
      );
      return;
    }

    // ИРГЭНИЙ НЭР ШАЛГАХ
    if (citizens.some((c) => normalize(c.name) === normalize(name))) {
      showNotification(
        "Энэ нэртэй иргэн аль хэдийн бүртгэгдсэн байна. Өөр нэр сонгоно уу.",
        "error",
      );
      return;
    }

    // ДҮРИЙН НЭР ШАЛГАХ
    if (citizens.some((c) => normalize(c.character) === normalize(character))) {
      showNotification(
        "Энэ дүр нь анхдагч эзэнтэй байна. Өөр дүрийн нэр сонгоно уу.",
        "error",
      );
      return;
    }
    // ДҮРИЙН НЭР ШАЛГАХ
    if (
      citizens.some(
        (c) => normalize(c.secondcharacter) === normalize(secondcharacter),
      )
    ) {
      showNotification(
        "Энэ дүр нь хоёрдогч эзэнтэй байна. Өөр дүрийн нэр сонгоно уу.",
        "error",
      );
      return;
    }
    // ШИНЭ ИРГЭН БҮРТГЭХ
    const citizen = {
      id: Date.now(),

      surname: surname,
      name: name,
      username: username,
      password: document.getElementById("regPassword").value,

      city: document.getElementById("regCity").value.trim(),
      house: document.getElementById("regHouse").value.trim(),
      character: character,
      secondcharacter: secondcharacter,

      account: document.getElementById("regAccount").value.trim(),
      balance: 0,

      status: "pending",
    };

    citizens.push(citizen);
    saveCitizens(citizens);

    showNotification(
      "EVERELLIS хаант улсын иргэний хүсэлтийг тань хүлээн авлаа! Админ зөвшөөрөх хүртэл хэсэг хүлээгээд өөрийн нэвтрэх нэр нууц үгээр нэвтэрнэ үү!",
      "success",
    );
    this.reset();
    showSection("loginSection");
  });

// ===================================
// CITIZEN LOGIN
// ===================================

function login() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  const citizen = getCitizens().find(
    (c) => c.username.toLowerCase() === username.toLowerCase(),
  );

  if (!citizen || citizen.password !== password) {
    showNotification("Нэвтрэх нэр эсвэл нууц үг буруу байна.", "error");
    return;
  }

  if (citizen.status === "pending") {
    showNotification(
      "Таны бүртгэлийг админ шалгаж байна. Баталгаажихыг хүлээнэ үү.",
      "error",
    );
    return;
  }

  if (citizen.status === "rejected") {
    showNotification(
      "Таны бүртгэлийн хүсэлт баталгаажаагүй байна. Админтай холбогдоно уу.",
      "error",
    );
    return;
  }

  currentUser = citizen;
  sessionStorage.setItem("everellisUser", citizen.id);

  showSection("dashboardSection");
}

// ===================================
// CITIZEN DASHBOARD
// ===================================

function renderDashboard() {
  if (!currentUser) return;

  const citizen = getCitizens().find((c) => c.id === currentUser.id);

  if (!citizen) {
    logout();
    return;
  }

  currentUser = citizen;

  document.getElementById("welcomeText").textContent =
    "Тавтай морил, " + citizen.name + "!";

  const fields = [
    ["Овог", citizen.surname],
    ["Нэр", citizen.name],
    ["Нэвтрэх нэр", citizen.username],
    ["Хот", citizen.city],
    ["House", citizen.house],
    ["Анхдагч дүр", citizen.character],
    ["Хоёрдогч дүр", citizen.secondcharacter],
  ];

  document.getElementById("citizenInfo").innerHTML = fields
    .map(
      ([label, value]) => `
      <div class="info-item">
        <small>${escapeHTML(label)}</small>
        <strong>${escapeHTML(value)}</strong>
      </div>
    `,
    )
    .join("");

  document.getElementById("myAccount").textContent = citizen.account;

  document.getElementById("myBalance").textContent =
    Number(citizen.balance).toLocaleString("en-US") + " VD";
  renderMyStatement(citizen);
}

// ===================================
// CITIZEN EDIT
// ===================================

function editCitizen() {
  if (!currentUser) return;

  const citizens = getCitizens();
  const index = citizens.findIndex((c) => c.id === currentUser.id);

  if (index === -1) return;

  const citizen = citizens[index];

  const surname = prompt("Овог:", citizen.surname);
  if (surname === null) return;

  const name = prompt("Нэр:", citizen.name);
  if (name === null) return;

  const city = prompt("Хот:", citizen.city);
  if (city === null) return;

  const house = prompt("House:", citizen.house);
  if (house === null) return;

  const character = prompt("Анхдагч дүр:", citizen.character);
  if (character === null) return;

  const secondcharacter = prompt("Хоёрдогч дүр:", citizen.secondcharacter);
  if (secondcharacter === null) return;

  citizens[index] = {
    ...citizen,
    surname: surname.trim(),
    name: name.trim(),
    city: city.trim(),
    house: house.trim(),
    character: character.trim(),
    secondcharacter: secondcharacter.trim(),
  };

  saveCitizens(citizens);

  currentUser = citizens[index];

  showNotification("Таны мэдээлэл шинэчлэгдлээ.", "success");
  renderDashboard();
}

// ===================================
// PUBLIC ARCHIVE
// ===================================

function renderArchive() {
  const search = document
    .getElementById("archiveSearch")
    .value.toLowerCase()
    .trim();

  const citizens = getCitizens().filter(
    (c) => c.status !== "pending" && c.status !== "rejected",
  );

  const filtered = citizens.filter((c) =>
    (c.surname + " " + c.name + " " + c.character)
      .toLowerCase()
      .includes(search),
  );

  const list = document.getElementById("archiveList");

  if (filtered.length === 0) {
    list.innerHTML = "<p class='description'>Иргэн олдсонгүй.</p>";
    return;
  }

  list.innerHTML = filtered
    .map(
      (c) => `
    <div class="archive-card">
      <h3>${escapeHTML(c.character)}</h3>
      <h4>Хоёрдогч дүр: ${escapeHTML(c.secondcharacter)}</h3> 
      <p>Овог: ${escapeHTML(c.surname)}</p>
      <p>Нэр: ${escapeHTML(c.name)}</p>
      <p>Хот: ${escapeHTML(c.city)}</p>
      <p>House: ${escapeHTML(c.house)}</p>
    </div>
  `,
    )
    .join("");
}

// ===================================
// ADMIN LOGIN
// ===================================

function adminLogin() {
  const username = document.getElementById("adminUsername").value;
  const password = document.getElementById("adminPassword").value;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    sessionStorage.setItem("everellisAdmin", "true");
    showSection("adminSection");
  } else {
    showNotification("Эзэн хаан тавтай морил.", "success");
  }
}

// ===================================
// ADMIN PANEL
// ===================================

function renderAdmin() {
  if (sessionStorage.getItem("everellisAdmin") !== "true") {
    showSection("loginSection");
    return;
  }

  const citizens = getCitizens();

  // PENDING ИРГЭД
  const pending = citizens.filter((c) => c.status === "pending");

  document.getElementById("pendingCount").textContent = pending.length;

  document.getElementById("pendingList").innerHTML =
    pending.length === 0
      ? "<p>Шинэ хүсэлт байхгүй байна.</p>"
      : pending
          .map(
            (c) => `
        <div class="admin-card">
          <h3>${escapeHTML(c.surname)} ${escapeHTML(c.name)}</h3>

          <p>Нэвтрэх нэр: ${escapeHTML(c.username)}</p>
          <p>Анхдагч дүр: ${escapeHTML(c.character)}</p>
          <p>Хоёрдогч дүр: ${escapeHTML(c.secondcharacter)}</p>
          <p>Хот: ${escapeHTML(c.city)}</p>
          <p>House: ${escapeHTML(c.house)}</p>

          <div class="admin-actions">
            <button onclick="approveCitizen(${c.id})">
              APPROVE
            </button>

            <button class="danger-button"
              onclick="rejectCitizen(${c.id})">
              REJECT
            </button>
          </div>
        </div>
      `,
          )
          .join("");

  // БАТАЛГААЖСАН ИРГЭД
  const approved = citizens.filter(
    (c) => c.status !== "pending" && c.status !== "rejected",
  );

  document.getElementById("citizenCount").textContent = approved.length;

  const search = document
    .getElementById("adminSearch")
    .value.toLowerCase()
    .trim();

  const filtered = approved.filter((c) =>
    (c.surname + " " + c.name + " " + c.character + " " + c.secondcharacter)
      .toLowerCase()
      .includes(search),
  );

  document.getElementById("adminList").innerHTML = filtered
    .map(
      (c) => `
      <div class="admin-card">
        <h3>${escapeHTML(c.surname)} ${escapeHTML(c.name)}</h3>

        <p>Нэвтрэх нэр: ${escapeHTML(c.username)}</p>
        <p>Анхдагч дүр: ${escapeHTML(c.character)}</p>
        <p>Хоёрдогч дүр: ${escapeHTML(c.secondcharacter)}</p>
        <p>Хот: ${escapeHTML(c.city)}</p>
        <p>House: ${escapeHTML(c.house)}</p>
        <p>Данс: ${escapeHTML(c.account)}</p>
        <p>Үлдэгдэл: ${Number(c.balance).toLocaleString("en-US")} ₮</p>

               <div class="admin-actions">
          <button onclick="adminEdit(${c.id})">ЗАСАХ</button>

          <button onclick="adminBalance(${c.id})">
            ДАНС ЗАСАХ
          </button>

          <button onclick="adminViewStatement(${c.id})">
            ДАНСНЫ ХУУЛГА
          </button>

          <button class="danger-button"
            onclick="deleteCitizen(${c.id})">
            УСТГАХ
          </button>
        </div>
      </div>
    `,
    )
    .join("");
}
// ===================================
// APPROVE CITIZEN
// ===================================

function approveCitizen(id) {
  if (sessionStorage.getItem("everellisAdmin") !== "true") return;

  const citizens = getCitizens();
  const index = citizens.findIndex((c) => c.id === id);

  if (index === -1) return;

  citizens[index].status = "approved";

  saveCitizens(citizens);

  showNotification("Иргэний бүртгэл амжилттай баталгаажлаа!", "success");

  renderAdmin();
}

// ===================================
// REJECT CITIZEN
// ===================================

function rejectCitizen(id) {
  if (sessionStorage.getItem("everellisAdmin") !== "true") return;

  if (!confirm("Энэ иргэний хүсэлтээс татгалзах уу?")) return;

  const citizens = getCitizens().filter((c) => c.id !== id);

  saveCitizens(citizens);

  showNotification("Иргэний бүртгэлийн хүсэлтээс татгалзлаа.", "error");

  renderAdmin();
}

// ===================================
// ADMIN EDIT CITIZEN
// ===================================

function adminEdit(id) {
  if (sessionStorage.getItem("everellisAdmin") !== "true") return;

  const citizens = getCitizens();
  const index = citizens.findIndex((c) => c.id === id);

  if (index === -1) return;

  const c = citizens[index];

  const surname = prompt("Овог:", c.surname);
  if (surname === null) return;

  const name = prompt("Нэр:", c.name);
  if (name === null) return;

  const character = prompt("Анхдагч дүр:", c.character);
  if (character === null) return;

  const secondcharacter = prompt("Хоёрдогч дүр:", c.secondcharacter);
  if (character === null) return;

  const city = prompt("Хот:", c.city);
  if (city === null) return;

  const house = prompt("House:", c.house);
  if (house === null) return;

  const account = prompt("Дансны дугаар:", c.account);
  if (account === null) return;

  citizens[index] = {
    ...c,
    surname: surname.trim(),
    name: name.trim(),
    character: character.trim(),
    secondcharacter: secondcharacter.trim(),
    city: city.trim(),
    house: house.trim(),
    account: account.trim(),
  };

  saveCitizens(citizens);

  showNotification("Иргэний мэдээлэл шинэчлэгдлээ.", "success");
  renderAdmin();
}

// ===================================
// ADMIN TRANSACTION SYSTEM
// ===================================

function adminBalance(id) {
  if (sessionStorage.getItem("everellisAdmin") !== "true") return;

  const citizens = getCitizens();
  const index = citizens.findIndex((c) => c.id === id);

  if (index === -1) return;

  const citizen = citizens[index];

  const description = prompt("Гүйлгээний утга:");
  if (description === null || !description.trim()) {
    showNotification("Гүйлгээний утгаа оруулна уу.", "error");
    return;
  }

  const type = prompt("Гүйлгээний төрөл оруулна уу:\n1 - Орлого\n2 - Зарлага");

  if (type === null) return;

  if (type !== "1" && type !== "2") {
    showNotification("1 эсвэл 2 гэж сонгоно уу.", "error");
    return;
  }

  const amountInput = prompt("Мөнгөн дүн:");
  if (amountInput === null) return;

  const amount = Number(amountInput);

  if (!Number.isFinite(amount) || amount <= 0) {
    showNotification("Зөв мөнгөн дүн оруулна уу.", "error");
    return;
  }

  // Хуучин дансны үлдэгдлийг хадгалах
  if (!Array.isArray(citizen.transactions)) {
    citizen.transactions = [];

    if (Number(citizen.balance) > 0) {
      citizen.transactions.push({
        id: Date.now() - 1,
        type: "opening",
        description: "Өмнөх дансны үлдэгдэл",
        amount: Number(citizen.balance),
        date: new Date().toISOString(),
      });
    }
  }

  const isIncome = type === "1";

  const currentBalance = Number(citizen.balance) || 0;

  if (!isIncome && amount > currentBalance) {
    showNotification("Дансны үлдэгдэл хүрэлцэхгүй байна.", "error");
    return;
  }

  // Гүйлгээ бүртгэх
  const transaction = {
    id: Date.now(),
    type: isIncome ? "income" : "expense",
    description: description.trim(),
    amount: amount,
    date: new Date().toISOString(),
  };

  citizen.transactions.push(transaction);

  // Үлдэгдэл автоматаар шинэчлэх
  citizen.balance = isIncome
    ? currentBalance + amount
    : currentBalance - amount;

  saveCitizens(citizens);

  showNotification(
    isIncome
      ? "Орлого амжилттай бүртгэгдлээ."
      : "Зарлага амжилттай бүртгэгдлээ.",
    "success",
  );

  renderAdmin();
}

// ===================================
// ADMIN VIEW CITIZEN STATEMENT
// ===================================

function adminViewStatement(id) {
  if (sessionStorage.getItem("everellisAdmin") !== "true") return;

  const citizen = getCitizens().find((c) => c.id === id);

  if (!citizen) return;

  const transactions = citizen.transactions || [];

  if (transactions.length === 0) {
    alert("Энэ дансанд гүйлгээ бүртгэгдээгүй байна.");
    return;
  }

  const statement = transactions
    .map((t) => {
      const date = new Date(t.date).toLocaleString("mn-MN");
      const sign = t.type === "expense" ? "-" : "+";

      return `${date}\n${t.description}\n${sign}${Number(t.amount).toLocaleString("en-US")} ₮`;
    })
    .join("\n\n");

  alert(
    `${citizen.character} — ДАНСНЫ ХУУЛГА\n\n${statement}\n\nҮлдэгдэл: ${Number(citizen.balance).toLocaleString("en-US")} ₮`,
  );
}

// ===================================
// DELETE CITIZEN
// ===================================

function deleteCitizen(id) {
  if (sessionStorage.getItem("everellisAdmin") !== "true") return;

  if (!confirm("Энэ иргэний бүртгэлийг устгах уу?")) return;

  const citizens = getCitizens().filter((c) => c.id !== id);

  saveCitizens(citizens);

  showNotification("Иргэний бүртгэл устгагдлаа ", "success");
  renderAdmin();
}

// ===================================
// LOGOUT
// ===================================

function logout() {
  currentUser = null;

  sessionStorage.removeItem("everellisUser");
  sessionStorage.removeItem("everellisAdmin");

  document.getElementById("loginUsername").value = "";
  document.getElementById("loginPassword").value = "";

  showSection("loginSection");
}
// ===================================
// EVERELLIS CUSTOM NOTIFICATION
// ===================================

let notificationTimer;

function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  const title = document.getElementById("notificationTitle");
  const text = document.getElementById("notificationMessage");
  const icon = document.getElementById("notificationIcon");

  if (!notification || !title || !text || !icon) {
    console.error("Notification HTML элемент олдсонгүй!");
    return;
  }

  clearTimeout(notificationTimer);

  notification.classList.remove("success", "error", "show");

  if (type === "success") {
    title.textContent = "АМЖИЛТТАЙ";
    icon.textContent = "✓";
    notification.classList.add("success");
  } else {
    title.textContent = "АНХААРУУЛГА";
    icon.textContent = "!";
    notification.classList.add("error");
  }

  text.textContent = message;

  requestAnimationFrame(() => {
    notification.classList.add("show");
  });

  notificationTimer = setTimeout(hideNotification, 3500);
}

function hideNotification() {
  const notification = document.getElementById("notification");

  if (notification) {
    notification.classList.remove("show");
  }
}
// ===================================
// HTML TEXT PROTECTION
// ===================================

function escapeHTML(value) {
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

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener("DOMContentLoaded", function () {
  if (location.hash === "#archive") {
    showSection("archiveSection");
  }
});
function renderMyStatement(citizen) {
  const statementBox = document.getElementById("myStatement");

  if (!statementBox) return;

  const transactions = citizen.transactions || [];

  if (transactions.length === 0) {
    statementBox.innerHTML = `
      <h2 class="gold-text">МИНИЙ ДАНСНЫ ХУУЛГА</h2>
      <p class="description">Одоогоор гүйлгээ бүртгэгдээгүй байна.</p>
    `;
    return;
  }

  statementBox.innerHTML = `
    <h2 class="gold-text">МИНИЙ ДАНСНЫ ХУУЛГА</h2>
    ${[...transactions]
      .reverse()
      .map(
        (t) => `
      <div class="transaction-item">
        <div>
          <strong>${escapeHTML(t.description)}</strong>
          <small>${new Date(t.date).toLocaleString("mn-MN")}</small>
        </div>
        <strong class="${t.type === "expense" ? "expense-text" : "income-text"}">
          ${t.type === "expense" ? "-" : "+"}${Number(t.amount).toLocaleString("en-US")} VD
        </strong>
      </div>
    `,
      )
      .join("")}
  `;
}
// =====================================
// EVERELLIS EVENT MANAGEMENT
// =====================================

const eventStorageKey = "everellisEvents";

// EVENT DATA
function getEvents() {
  try {
    return JSON.parse(localStorage.getItem(eventStorageKey) || "[]");
  } catch {
    return [];
  }
}

function saveEvents(events) {
  localStorage.setItem(eventStorageKey, JSON.stringify(events));
}

// ADMIN AUTH CHECK
function isEventAdmin() {
  return sessionStorage.getItem("everellisAdmin") === "true";
}

// EVENT FORM
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("eventForm");

  if (!form) return;

  form.addEventListener("submit", saveEvent);

  renderAdminEvents();
});

// SAVE / EDIT EVENT
function saveEvent(e) {
  e.preventDefault();

  if (!isEventAdmin()) {
    showNotification("Админаар нэвтэрнэ үү.", "error");
    return;
  }

  const id = document.getElementById("eventEditId").value;

  const title = document.getElementById("eventTitle").value.trim();
  const category = document.getElementById("eventCategory").value;
  const date = document.getElementById("eventDate").value;
  const location = document.getElementById("eventLocation").value.trim();
  const image = document.getElementById("eventImage").value.trim();
  const description = document.getElementById("eventDescription").value.trim();

  if (!title || !date || !location || !description) {
    showNotification("Бүх шаардлагатай мэдээллийг бөглөнө үү.", "error");
    return;
  }

  if (image) {
    try {
      const imageURL = new URL(image);

      if (!["http:", "https:"].includes(imageURL.protocol)) {
        throw new Error("Invalid URL");
      }
    } catch {
      showNotification("Зургийн URL буруу байна.", "error");
      return;
    }
  }

  const events = getEvents();

  if (id) {
    const index = events.findIndex((event) => String(event.id) === id);

    if (index === -1) return;

    events[index] = {
      ...events[index],
      title,
      category,
      date,
      location,
      image,
      description,
    };

    showNotification("Эвент шинэчлэгдлээ.", "success");
  } else {
    events.push({
      id: Date.now(),
      title,
      category,
      date,
      location,
      image,
      description,
      published: false,
      createdAt: new Date().toISOString(),
    });

    showNotification("Шинэ эвент хадгалагдлаа.", "success");
  }

  saveEvents(events);

  document.getElementById("eventForm").reset();
  document.getElementById("eventEditId").value = "";

  renderAdminEvents();
}

// ADMIN EVENT LIST
function renderAdminEvents() {
  const list = document.getElementById("adminEventList");
  const count = document.getElementById("eventAdminCount");

  if (!list || !count) return;

  const events = getEvents();

  count.textContent = events.length + " эвент";

  if (!events.length) {
    list.innerHTML = "<p class='description'>Одоогоор эвент байхгүй байна.</p>";
    return;
  }

  list.innerHTML = events
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(
      (event) => `
      <div class="admin-card">
        <h3>${escapeHTML(event.title)}</h3>

        <p>Төрөл: ${escapeHTML(event.category)}</p>
        <p>Огноо: ${new Date(event.date).toLocaleString("mn-MN")}</p>
        <p>Байршил: ${escapeHTML(event.location)}</p>

        <p>
          Төлөв:
          <strong>
            ${event.published ? "НИЙТЛЭГДСЭН" : "НООРОГ"}
          </strong>
        </p>

        <div class="admin-actions">

          <button onclick="toggleEventPublish(${event.id})">
            ${event.published ? "НУУХ" : "НИЙТЛЭХ"}
          </button>

          <button onclick="editEvent(${event.id})">
            ЗАСАХ
          </button>

          <button class="danger-button"
            onclick="deleteEvent(${event.id})">
            УСТГАХ
          </button>

        </div>
      </div>
    `,
    )
    .join("");
}

// EDIT EVENT
function editEvent(id) {
  if (!isEventAdmin()) return;

  const event = getEvents().find((item) => item.id === id);

  if (!event) return;

  document.getElementById("eventEditId").value = event.id;
  document.getElementById("eventTitle").value = event.title;
  document.getElementById("eventCategory").value = event.category;
  document.getElementById("eventDate").value = event.date;
  document.getElementById("eventLocation").value = event.location;
  document.getElementById("eventImage").value = event.image || "";
  document.getElementById("eventDescription").value = event.description;

  document.getElementById("eventForm").scrollIntoView({
    behavior: "smooth",
  });
}

// CANCEL EDIT
function cancelEventEdit() {
  const form = document.getElementById("eventForm");

  if (!form) return;

  form.reset();
  document.getElementById("eventEditId").value = "";
}

// PUBLISH / HIDE
function toggleEventPublish(id) {
  if (!isEventAdmin()) return;

  const events = getEvents();

  const event = events.find((item) => item.id === id);

  if (!event) return;

  event.published = !event.published;

  saveEvents(events);
  renderAdminEvents();

  showNotification(
    event.published
      ? "Эвент амжилттай нийтлэгдлээ."
      : "Эвент нийтлэлээс хасагдлаа.",
    "success",
  );
}

// DELETE EVENT
function deleteEvent(id) {
  if (!isEventAdmin()) return;

  if (!confirm("Энэ эвентийн мэдээллийг устгах уу?")) return;

  const events = getEvents().filter((event) => event.id !== id);

  saveEvents(events);
  renderAdminEvents();

  showNotification("Эвент устгагдлаа.", "success");
}
