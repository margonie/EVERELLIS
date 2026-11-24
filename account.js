// ===================================
// EVERELLIS CITIZEN SYSTEM
// ===================================

// МЭДЭЭЛЭЛ ХАДГАЛАХ

async function renderArchive() {
  const searchInput = document.getElementById("archiveSearch");
  const list = document.getElementById("archiveList");
  const count = document.getElementById("archiveCount");

  if (!searchInput || !list) return;

  const search = searchInput.value.toLowerCase().trim();

  list.innerHTML = "<p>Иргэдийн мэдээлэл ачаалж байна...</p>";

  const { data: citizens, error } = await supabaseClient
    .from("citizen_archive")
    .select("*")
    .order("surname", { ascending: true });

  if (error) {
    console.error("Archive loading error:", error);
    list.innerHTML = "<p class='description'>Архив ачаалахад алдаа гарлаа.</p>";
    if (count) count.textContent = "";
    return;
  }

  const filtered = (citizens || []).filter((c) => {
    const searchableText = [
      c.surname,
      c.name,
      c.character_name,
      c.second_character_name,
      c.city,
      c.house,
      c.tsol,
      c.albantushaal,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search);
  });

  if (count) {
    count.textContent = `Нийт ${filtered.length} иргэн олдлоо.`;
  }

  if (filtered.length === 0) {
    list.innerHTML = "<p class='description'>Иргэн олдсонгүй.</p>";
    return;
  }

  list.innerHTML = filtered
    .map(
      (c) => `
    <div class="archive-card">
      <h3>${escapeHTML(c.character_name || "Дүрийн нэргүй")}</h3>
      <h4>Хоёрдогч дүр: ${escapeHTML(c.second_character_name || "Байхгүй")}</h4>
      <p>Овог: ${escapeHTML(c.surname || "")}</p>
      <p>Нэр: ${escapeHTML(c.name || "")}</p>
      <p>Хот: ${escapeHTML(c.city || "")}</p>
      <p>House: ${escapeHTML(c.house || "")}</p>
      <p>Цол: ${escapeHTML(c.tsol || "")}</p>
      <p>Албан тушаал: ${escapeHTML(c.albantushaal || "")}</p>

    </div>
  `,
    )
    .join("");
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
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;

    const surname = document.getElementById("regSurname").value.trim();
    const name = document.getElementById("regName").value.trim();

    const city = document.getElementById("regCity").value.trim();
    const house = document.getElementById("regHouse").value.trim();
    const tsol = document.getElementById("regTsol").value.trim();
    const albantushaal = document
      .getElementById("regAlbantushaal")
      .value.trim();

    const character = document.getElementById("regCharacter").value.trim();
    const secondcharacter = document
      .getElementById("regSecondcharacter")
      .value.trim();

    const account = document.getElementById("regAccount").value.trim();

    if (password.length < 8) {
      showNotification("Нууц үг дор хаяж 8 тэмдэгт байх ёстой.", "error");
      return;
    }

    if (
      !email ||
      !surname ||
      !name ||
      !city ||
      !house ||
      !tsol ||
      !albantushaal ||
      !character ||
      !secondcharacter ||
      !account
    ) {
      showNotification("Бүх талбарыг бөглөнө үү.", "error");
      return;
    }

    try {
      // 1. Supabase Auth хэрэглэгч үүсгэх
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            surname,
            name,
            city,
            house,
            tsol,
            albantushaal,
            character_name: character,
            second_character_name: secondcharacter,
            account_number: account,
          },
        },
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Хэрэглэгч үүссэнгүй.");
      }

      // 2. Session үүссэн эсэхийг шалгах
      if (!data.session) {
        showNotification(
          "Бүртгэл үүслээ. Нэвтрэх session үүсээгүй байна. Supabase-ийн Confirm Email тохиргоог шалгана уу.",
          "error",
        );
        return;
      }

      // 3. Иргэний мэдээллийг citizens хүснэгтэд хадгалах
      const newCitizen = {
        id: data.user.id,
        email: data.user.email,
        surname,
        name,
        character_name: character,
        second_character_name: secondcharacter,
        city,
        house,
        tsol,
        albantushaal,
        account_number: account,
        balance: 0,
        status: "pending",
      };

      const { error: insertError } = await supabaseClient
        .from("citizens")
        .insert(newCitizen);

      if (insertError) throw insertError;

      // 4. Амжилттай бүртгэх
      showNotification(
        "Бүртгэл амжилттай! Таны хүсэлтийг админ шалгаж байна.",
        "success",
      );

      this.reset();

      await supabaseClient.auth.signOut();

      showSection("loginSection");
    } catch (error) {
      console.error("Registration error:", error);

      if (error.code === "23505") {
        showNotification(
          "Энэ хэрэглэгчийн нэр эсвэл бүртгэл аль хэдийн байна.",
          "error",
        );
      } else if (error.message?.toLowerCase().includes("already")) {
        showNotification("Энэ имэйл аль хэдийн бүртгэгдсэн байна.", "error");
      } else {
        showNotification(
          error.message || "Бүртгэл хийхэд алдаа гарлаа.",
          "error",
        );
      }
    }
  });

// ===================================
// CITIZEN LOGIN
// ===================================

async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    showNotification("Имэйл болон нууц үгээ оруулна уу.", "error");
    return;
  }

  try {
    // 1. Supabase Auth нэвтрэлт
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const user = data.user;

    // 2. Админ хэрэглэгчийг иргэний нэвтрэлтээс ялгах
    if (user.app_metadata?.role === "admin") {
      showNotification(
        "Админ бүртгэл байна. Админ нэвтрэх хэсгийг ашиглана уу.",
        "error",
      );
      await supabaseClient.auth.signOut();
      return;
    }

    // 3. Citizens хүснэгтээс иргэний мэдээлэл хайх
    let { data: citizen, error: citizenError } = await supabaseClient
      .from("citizens")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (citizenError) throw citizenError;

    // 4. Анхны нэвтрэлт бол иргэний хүсэлт үүсгэх
    if (!citizen) {
      const profile = user.user_metadata || {};

      const newCitizen = {
        id: user.id,
        email: user.email,
        surname: profile.surname,
        name: profile.name,
        character_name: profile.character_name,
        second_character_name: profile.second_character_name,
        city: profile.city,
        house: profile.house,
        tsol: profile.tsol,
        albantushaal: profile.albantushaal,
        account_number: profile.account_number,
        balance: 0,
        status: "pending",
      };

      const { data: inserted, error: insertError } = await supabaseClient
        .from("citizens")
        .insert(newCitizen)
        .select()
        .single();

      if (insertError) throw insertError;

      citizen = inserted;
    }

    // 5. Бүртгэлийн төлөв шалгах
    if (citizen.status === "pending") {
      showNotification(
        "Таны бүртгэлийг админ шалгаж байна. Баталгаажихыг хүлээнэ үү.",
        "error",
      );
      await supabaseClient.auth.signOut();
      return;
    }

    if (citizen.status === "rejected") {
      showNotification(
        "Таны бүртгэлийн хүсэлт баталгаажаагүй байна. Админтай холбогдоно уу.",
        "error",
      );
      await supabaseClient.auth.signOut();
      return;
    }

    if (citizen.status !== "approved") {
      throw new Error("Иргэний бүртгэлийн төлөв тодорхойгүй байна.");
    }

    // 6. Амжилттай нэвтрүүлэх
    currentUser = citizen;
    sessionStorage.setItem("everellisUser", citizen.id);

    showNotification("Тавтай морил!", "success");
    showSection("dashboardSection");

    if (typeof renderDashboard === "function") {
      await renderDashboard();
    }
  } catch (error) {
    console.error("Citizen login error:", error);

    showNotification(error.message || "Нэвтрэхэд алдаа гарлаа.", "error");
  }
}

// ===================================
// CITIZEN DASHBOARD
// ===================================

async function renderDashboard() {
  if (!currentUser) return;

  try {
    // Supabase-ээс иргэний мэдээлэл авах
    const { data: citizen, error } = await supabaseClient
      .from("citizens")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (error) throw error;

    if (!citizen || citizen.status !== "approved") {
      await logout();
      return;
    }

    currentUser = citizen;

    // Мэндчилгээ
    document.getElementById("welcomeText").textContent =
      "Тавтай морил, " + citizen.name + "!";

    // Иргэний мэдээлэл
    const fields = [
      ["Овог", citizen.surname],
      ["Нэр", citizen.name],
      ["Хот", citizen.city],
      ["Өргөө", citizen.house],
      ["Цол", citizen.tsol],
      ["Албан тушаал", citizen.albantushaal],
      ["Анхдагч дүр", citizen.character_name],
      ["Хоёрдогч дүр", citizen.second_character_name],
    ];

    document.getElementById("citizenInfo").innerHTML = fields
      .map(
        ([label, value]) => `
          <div class="info-item">
            <small>${escapeHTML(label)}</small>
            <strong>${escapeHTML(value ?? "-")}</strong>
          </div>
        `,
      )
      .join("");

    // Дансны дугаар
    document.getElementById("myAccount").textContent =
      citizen.account_number || "-";

    // Дансны үлдэгдэл
    document.getElementById("myBalance").textContent =
      Number(citizen.balance || 0).toLocaleString("en-US") + " VD";

    // Гүйлгээний түүх
    await renderMyStatement(citizen);
  } catch (error) {
    console.error("Dashboard error:", error);

    showNotification("Иргэний мэдээлэл авахад алдаа гарлаа.", "error");
  }
}

// ===================================
// CITIZEN EDIT
// ===================================

// =====================================
// CITIZEN EDIT OWN PROFILE - SUPABASE
// =====================================

async function editCitizen() {
  const { data: authData, error: authError } =
    await supabaseClient.auth.getUser();

  const user = authData?.user;

  if (authError || !user) {
    alert("Та эхлээд нэвтэрнэ үү.");
    return;
  }

  // Зөвхөн өөрийн бүртгэлийг татна
  const { data: citizen, error } = await supabaseClient
    .from("citizens")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !citizen) {
    console.error(error);
    alert("Таны бүртгэлийн мэдээллийг олсонгүй.");
    return;
  }

  const surname = prompt("Овог:", citizen.surname || "");
  if (surname === null) return;

  const name = prompt("Нэр:", citizen.name || "");
  if (name === null) return;

  const city = prompt("Хот:", citizen.city || "");
  if (city === null) return;

  const house = prompt("Өргөө:", citizen.house || "");
  if (house === null) return;
  const tsol = prompt("Цол:", citizen.tsol || "");
  if (tsol === null) return;
  const albantushaal = prompt("Албан тушаал:", citizen.albantushaal || "");
  if (albantushaal === null) return;

  const character = prompt("Анхдагч дүр:", citizen.character_name || "");
  if (character === null) return;

  const secondCharacter = prompt(
    "Хоёрдогч дүр:",
    citizen.second_character_name || "",
  );
  if (secondCharacter === null) return;

  const { data: updatedCitizen, error: updateError } = await supabaseClient
    .from("citizens")
    .update({
      surname: surname.trim(),
      name: name.trim(),
      city: city.trim(),
      house: house.trim(),
      tsol: tsol.trim(),
      albantushaal: albantushaal.trim(),
      character_name: character.trim(),
      second_character_name: secondCharacter.trim(),
    })
    .eq("id", user.id)
    .select()
    .maybeSingle();

  if (updateError) {
    console.error("Profile update error:", updateError);
    alert("Мэдээлэл хадгалахад алдаа гарлаа: " + updateError.message);
    return;
  }

  if (!updatedCitizen) {
    alert(
      "Мэдээлэл шинэчлэгдсэнгүй. Supabase RLS UPDATE policy-г шалгах шаардлагатай.",
    );
    return;
  }

  currentUser = updatedCitizen;

  showNotification("Таны мэдээлэл шинэчлэгдлээ.", "success");

  await renderDashboard();
}

// ===================================
// PUBLIC ARCHIVE
// ===================================

// ===================================
// ADMIN LOGIN
// ===================================

async function adminLogin() {
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;

  if (!email || !password) {
    showNotification("Имэйл болон нууц үгээ оруулна уу.", "error");
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showNotification("Имэйл эсвэл нууц үг буруу байна.", "error");
      return;
    }

    const user = data.user;

    if (user.app_metadata?.role !== "admin") {
      await supabaseClient.auth.signOut();
      showNotification("Танд админы эрх байхгүй байна.", "error");
      return;
    }

    sessionStorage.setItem("everellisAdmin", "true");

    showNotification("Админ эрхээр амжилттай нэвтэрлээ.", "success");
    showSection("adminSection");

    if (typeof renderAdmin === "function") {
      await renderAdmin();
    }
  } catch (error) {
    console.error("Admin login error:", error);
    showNotification("Алдаа гарлаа. Дахин оролдоно уу.", "error");
  }
}

// ===================================
// ADMIN PANEL
// ===================================

async function renderAdmin() {
  try {
    // 1. Админы эрх шалгах
    const { data: authData, error: authError } =
      await supabaseClient.auth.getUser();

    if (
      authError ||
      !authData.user ||
      authData.user.app_metadata?.role !== "admin"
    ) {
      showSection("loginSection");
      return;
    }
    await renderAdminLaws();

    // 2. Иргэдийн мэдээлэл авах
    const { data: citizens, error } = await supabaseClient
      .from("citizens")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const pending = citizens.filter((c) => c.status === "pending");
    const approved = citizens.filter((c) => c.status === "approved");

    // 3. Бүх гүйлгээг авах
    const { data: transactions, error: transactionError } = await supabaseClient
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (transactionError) throw transactionError;
    adminReportTransactions = transactions;
    adminReportCitizens = citizens;

    const citizenFilter = document.getElementById("transactionCitizenFilter");

    if (citizenFilter) {
      const previousValue = citizenFilter.value;

      citizenFilter.innerHTML =
        '<option value="all">Бүх иргэн</option>' +
        citizens
          .filter((c) => c.status === "approved")
          .map(
            (c) => `
        <option value="${c.id}">
          ${escapeHTML(c.surname + " " + c.name)}
        </option>
      `,
          )
          .join("");

      citizenFilter.value = previousValue;
    }
    // 4. Санхүүгийн тооцоолол
    const totalBalance = approved.reduce(
      (sum, c) => sum + Number(c.balance || 0),
      0,
    );

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // 5. Тайлангийн мэдээлэл харуулах
    document.getElementById("reportCitizenCount").textContent = approved.length;

    document.getElementById("reportBalance").textContent =
      totalBalance.toLocaleString("en-US") + " VD";

    document.getElementById("reportIncome").textContent =
      totalIncome.toLocaleString("en-US") + " VD";

    document.getElementById("reportExpense").textContent =
      totalExpense.toLocaleString("en-US") + " VD";

    // 6. Сүүлийн 10 гүйлгээ
    renderFilteredTransactions(transactions.slice(0, 10));

    // 7. Хүлээгдэж буй хүсэлтүүд
    document.getElementById("pendingCount").textContent = pending.length;

    document.getElementById("pendingList").innerHTML =
      pending.length === 0
        ? "<p>Шинэ хүсэлт байхгүй байна.</p>"
        : pending
            .map(
              (c) => `
          <div class="admin-card">
            <h3>${escapeHTML(c.surname)} ${escapeHTML(c.name)}</h3>
            <p>Имэйл: ${escapeHTML(c.email || "")}</p>
            <p>Нэвтрэх нэр: ${escapeHTML(c.username)}</p>
            <p>Анхдагч дүр: ${escapeHTML(c.character_name)}</p>
            <p>Хоёрдогч дүр: ${escapeHTML(c.second_character_name)}</p>
            <p>Хот: ${escapeHTML(c.city)}</p>
            <p>Өргөө: ${escapeHTML(c.house)}</p>
            <p>Цол: ${escapeHTML(c.tsol)}</p>
            <p>Албан тушаал: ${escapeHTML(c.albantushaal)}</p>

            <div class="admin-actions">
              <button onclick="approveCitizen('${c.id}')">
                APPROVE
              </button>

              <button class="danger-button"
                onclick="rejectCitizen('${c.id}')">
                REJECT
              </button>
            </div>
          </div>
        `,
            )
            .join("");

    // 8. Баталгаажсан иргэд
    document.getElementById("citizenCount").textContent = approved.length;

    const searchInput = document.getElementById("adminSearch");
    const search = (searchInput?.value || "").toLowerCase().trim();

    const filtered = approved.filter((c) =>
      [
        c.surname,
        c.name,
        c.tsol,
        c.albantushaal,
        c.character_name,
        c.second_character_name,
        c.account_number,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search),
    );

    document.getElementById("adminList").innerHTML =
      filtered.length === 0
        ? "<p>Баталгаажсан иргэн олдсонгүй.</p>"
        : filtered
            .map(
              (c) => `
          <div class="admin-card">
            <h3>${escapeHTML(c.surname)} ${escapeHTML(c.name)}</h3>
            <p>Имэйл: ${escapeHTML(c.email || "")}</p>
            <p>Нэвтрэх нэр: ${escapeHTML(c.username)}</p>
            <p>Анхдагч дүр: ${escapeHTML(c.character_name)}</p>
            <p>Хоёрдогч дүр: ${escapeHTML(c.second_character_name)}</p>
            <p>Хот: ${escapeHTML(c.city)}</p>
            <p>Өргөө: ${escapeHTML(c.house)}</p>
            <p>Цол: ${escapeHTML(c.tsol)}</p>
            <p>Албан тушаал: ${escapeHTML(c.albantushaal)}</p>
            <p>Данс: ${escapeHTML(c.account_number)}</p>
            <p>Үлдэгдэл: ${Number(c.balance || 0).toLocaleString("en-US")} VD</p>

            <div class="admin-actions">
              <button onclick="adminEdit('${c.id}')">ЗАСАХ</button>
              <button onclick="adminBalance('${c.id}')">ДАНС ЗАСАХ</button>
              <button onclick="adminViewStatement('${c.id}')">
                ДАНСНЫ ХУУЛГА
              </button>
              <button class="danger-button"
                onclick="deleteCitizen('${c.id}')">
                УСТГАХ
              </button>
            </div>
          </div>
        `,
            )
            .join("");
  } catch (error) {
    console.error("Admin render error:", error);
    showNotification("Админ мэдээлэл татахад алдаа гарлаа.", "error");
  }
}

// ===================================
// APPROVE CITIZEN
// ===================================

async function approveCitizen(id) {
  try {
    const { data: authData } = await supabaseClient.auth.getUser();

    if (authData.user?.app_metadata?.role !== "admin") {
      showNotification("Админы эрх шаардлагатай.", "error");
      return;
    }

    const { error } = await supabaseClient
      .from("citizens")
      .update({ status: "approved" })
      .eq("id", id)
      .eq("status", "pending");

    if (error) throw error;

    showNotification("Иргэний бүртгэл баталгаажлаа!", "success");
    await renderAdmin();
    await renderAdminPublications();
  } catch (error) {
    console.error(error);
    showNotification("Бүртгэл батлахад алдаа гарлаа.", "error");
  }
}

// ===================================
// REJECT CITIZEN
// ===================================

async function rejectCitizen(id) {
  if (!confirm("Энэ иргэний хүсэлтээс татгалзах уу?")) return;

  try {
    const { data: authData } = await supabaseClient.auth.getUser();

    if (authData.user?.app_metadata?.role !== "admin") {
      showNotification("Админы эрх шаардлагатай.", "error");
      return;
    }

    const { error } = await supabaseClient
      .from("citizens")
      .update({ status: "rejected" })
      .eq("id", id)
      .eq("status", "pending");

    if (error) throw error;

    showNotification("Хүсэлтээс татгалзлаа.", "success");
    await renderAdmin();
  } catch (error) {
    console.error(error);
    showNotification("Хүсэлт татгалзахад алдаа гарлаа.", "error");
  }
}

// ===================================
// ADMIN EDIT CITIZEN
// ===================================

// =====================================
// ADMIN EDIT CITIZEN - SUPABASE
// =====================================

async function adminEdit(id) {
  const { data: authData, error: authError } =
    await supabaseClient.auth.getUser();

  if (authError || authData.user?.app_metadata?.role !== "admin") {
    alert("Админ эрх шаардлагатай.");
    return;
  }

  const { data: c, error } = await supabaseClient
    .from("citizens")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !c) {
    alert("Иргэний мэдээлэл олдсонгүй.");
    return;
  }

  const surname = prompt("Овог:", c.surname || "");
  if (surname === null) return;

  const name = prompt("Нэр:", c.name || "");
  if (name === null) return;

  const character = prompt("Анхдагч дүр:", c.character_name || "");
  if (character === null) return;

  const secondCharacter = prompt(
    "Хоёрдогч дүр:",
    c.second_character_name || "",
  );
  if (secondCharacter === null) return;

  const city = prompt("Хот:", c.city || "");
  if (city === null) return;

  const house = prompt("Өргөө:", c.house || "");
  if (house === null) return;
  const tsol = prompt("Цол:", c.tsol || "");
  if (tsol === null) return;

  const albantushaal = prompt("Албан тушаал:", c.albantushaal || "");
  if (albantushaal === null) return;
  const accountNumber = prompt("Дансны дугаар:", c.account_number || "");
  if (accountNumber === null) return;

  const { error: updateError } = await supabaseClient
    .from("citizens")
    .update({
      surname: surname.trim(),
      name: name.trim(),
      character_name: character.trim(),
      second_character_name: secondCharacter.trim(),
      city: city.trim(),
      house: house.trim(),
      tsol: tsol.trim(),
      albantushaal: albantushaal.trim(),
      account_number: accountNumber.trim(),
    })
    .eq("id", id);

  if (updateError) {
    console.error(updateError);
    alert("Мэдээлэл засахад алдаа гарлаа: " + updateError.message);
    return;
  }

  showNotification("Иргэний мэдээлэл шинэчлэгдлээ.", "success");
  await renderAdmin();
}

// =====================================
// DELETE CITIZEN - SUPABASE
// =====================================

async function deleteCitizen(id) {
  const { data: authData, error: authError } =
    await supabaseClient.auth.getUser();

  if (authError || authData.user?.app_metadata?.role !== "admin") {
    alert("Админ эрх шаардлагатай.");
    return;
  }

  if (!confirm("Энэ иргэний бүртгэлийг устгах уу?")) return;

  const { error } = await supabaseClient.from("citizens").delete().eq("id", id);

  if (error) {
    console.error(error);
    alert("Устгахад алдаа гарлаа: " + error.message);
    return;
  }

  showNotification("Иргэний бүртгэл устгагдлаа.", "success");
  await renderAdmin();
}
// ===================================
// ADMIN TRANSACTION SYSTEM
// ===================================

async function adminBalance(id) {
  if (sessionStorage.getItem("everellisAdmin") !== "true") {
    showNotification("Админы эрх шаардлагатай.", "error");
    return;
  }

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

  const transactionType = type === "1" ? "income" : "expense";

  try {
    const { data, error } = await supabaseClient.rpc(
      "admin_record_transaction",
      {
        p_citizen_id: id,
        p_type: transactionType,
        p_description: description.trim(),
        p_amount: amount,
      },
    );

    if (error) throw error;

    showNotification(
      transactionType === "income"
        ? "Орлого амжилттай бүртгэгдлээ."
        : "Зарлага амжилттай бүртгэгдлээ.",
      "success",
    );

    await renderAdmin();
  } catch (error) {
    console.error("Transaction error:", error);

    showNotification(error.message || "Гүйлгээ хийхэд алдаа гарлаа.", "error");
  }
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

async function renderMyStatement(citizen) {
  const statementBox = document.getElementById("myStatement");

  if (!statementBox) return;

  statementBox.innerHTML = `
    <h2 class="gold-text">МИНИЙ ДАНСНЫ ХУУЛГА</h2>
    <p class="description">Гүйлгээ ачаалж байна...</p>
  `;

  try {
    // Supabase-ээс тухайн иргэний гүйлгээг авах
    const { data: transactions, error } = await supabaseClient
      .from("transactions")
      .select("*")
      .eq("citizen_id", citizen.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!transactions || transactions.length === 0) {
      statementBox.innerHTML = `
        <h2 class="gold-text">МИНИЙ ДАНСНЫ ХУУЛГА</h2>
        <p class="description">
          Одоогоор гүйлгээ бүртгэгдээгүй байна.
        </p>
      `;
      return;
    }

    const transactionHTML = transactions
      .map((t) => {
        const isExpense = t.type === "expense";
        const sign = isExpense ? "-" : "+";

        const date = new Date(t.created_at).toLocaleString("mn-MN");

        return `
        <div class="transaction-item">
          <div>
            <strong>${escapeHTML(t.description)}</strong>
            <small>${date}</small>
          </div>

          <strong class="${isExpense ? "expense-text" : "income-text"}">
            ${sign}${Number(t.amount).toLocaleString("en-US")} VD
          </strong>
        </div>
      `;
      })
      .join("");

    statementBox.innerHTML = `
      <h2 class="gold-text">МИНИЙ ДАНСНЫ ХУУЛГА</h2>
      ${transactionHTML}
    `;
  } catch (error) {
    console.error("Statement error:", error);

    statementBox.innerHTML = `
      <h2 class="gold-text">МИНИЙ ДАНСНЫ ХУУЛГА</h2>
      <p class="description">
        Гүйлгээний мэдээлэл авахад алдаа гарлаа.
      </p>
    `;
  }
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
let adminReportTransactions = [];
let adminReportCitizens = [];

function filterAdminTransactions() {
  const type = document.getElementById("transactionTypeFilter").value;
  const citizenId = document.getElementById("transactionCitizenFilter").value;
  const date = document.getElementById("transactionDateFilter").value;

  const filtered = adminReportTransactions.filter((t) => {
    const matchesType = type === "all" || t.type === type;
    const matchesCitizen = citizenId === "all" || t.citizen_id === citizenId;

    const transactionDate = new Date(t.created_at).toLocaleDateString("en-CA");

    const matchesDate = !date || transactionDate === date;

    return matchesType && matchesCitizen && matchesDate;
  });

  renderFilteredTransactions(filtered);
}

function renderFilteredTransactions(transactions) {
  const box = document.getElementById("recentTransactions");

  if (!box) return;

  if (transactions.length === 0) {
    box.innerHTML = "<p>Тохирох гүйлгээ олдсонгүй.</p>";
    return;
  }

  box.innerHTML = transactions
    .map((t) => {
      const citizen = adminReportCitizens.find((c) => c.id === t.citizen_id);
      const isExpense = t.type === "expense";
      const sign = isExpense ? "-" : "+";
      const citizenName = citizen
        ? `${citizen.surname} ${citizen.name}`
        : "Тодорхойгүй иргэн";

      return `
      <div class="transaction-item">
        <div>
          <strong>${escapeHTML(citizenName)}</strong>
          <p>${escapeHTML(t.description)}</p>
          <small>${new Date(t.created_at).toLocaleString("mn-MN")}</small>
        </div>

        <strong class="${isExpense ? "expense-text" : "income-text"}">
          ${sign}${Number(t.amount).toLocaleString("en-US")} VD
        </strong>
      </div>
    `;
    })
    .join("");
}

function resetTransactionFilters() {
  document.getElementById("transactionTypeFilter").value = "all";
  document.getElementById("transactionCitizenFilter").value = "all";
  document.getElementById("transactionDateFilter").value = "";

  filterAdminTransactions();
}

const publicationForm = document.getElementById("publicationForm");

if (publicationForm) {
  publicationForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const { data: authData, error: authError } =
      await supabaseClient.auth.getUser();

    if (authError || authData.user?.app_metadata?.role !== "admin") {
      showNotification("Админы эрх шаардлагатай.", "error");
      return;
    }

    const editId = document.getElementById("publicationEditId").value;
    const isPublished = document.getElementById("publicationPublish").checked;

    const publication = {
      title: document.getElementById("publicationTitle").value.trim(),
      category: document.getElementById("publicationCategory").value,
      summary: document.getElementById("publicationSummary").value.trim(),
      content: document.getElementById("publicationContent").value.trim(),
      image_url:
        document.getElementById("publicationImage").value.trim() || null,
      is_published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    try {
      let result;

      if (editId) {
        result = await supabaseClient
          .from("publications")
          .update(publication)
          .eq("id", editId);
      } else {
        publication.created_by = authData.user.id;

        result = await supabaseClient.from("publications").insert(publication);
      }

      if (result.error) throw result.error;

      showNotification("Мэдээлэл амжилттай хадгалагдлаа.", "success");

      resetPublicationForm();
      await renderAdminPublications();
    } catch (error) {
      console.error("Publication error:", error);
      showNotification("Мэдээлэл хадгалахад алдаа гарлаа.", "error");
    }
  });
}

function resetPublicationForm() {
  document.getElementById("publicationForm").reset();
  document.getElementById("publicationEditId").value = "";
}

async function renderAdminPublications() {
  const box = document.getElementById("adminPublicationList");
  if (!box) return;

  const { data, error } = await supabaseClient
    .from("publications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    box.textContent = "Мэдээлэл ачаалж чадсангүй.";
    return;
  }

  box.innerHTML =
    data.length === 0
      ? "<p>Одоогоор нийтлэл байхгүй.</p>"
      : data
          .map(
            (p) => `
      <div class="admin-card">
        <h3>${escapeHTML(p.title)}</h3>
        <p>${escapeHTML(p.category)}</p>
        <p>${p.is_published ? "Нийтлэгдсэн" : "Ноорог"}</p>

        <div class="admin-actions">
          <button onclick="editPublication(${p.id})">ЗАСАХ</button>
          <button class="danger-button"
            onclick="deletePublication(${p.id})">УСТГАХ</button>
        </div>
      </div>
    `,
          )
          .join("");
}

async function editPublication(id) {
  const { data, error } = await supabaseClient
    .from("publications")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    showNotification("Нийтлэл олдсонгүй.", "error");
    return;
  }

  document.getElementById("publicationEditId").value = data.id;
  document.getElementById("publicationTitle").value = data.title;
  document.getElementById("publicationCategory").value = data.category;
  document.getElementById("publicationSummary").value = data.summary || "";
  document.getElementById("publicationContent").value = data.content;
  document.getElementById("publicationImage").value = data.image_url || "";
  document.getElementById("publicationPublish").checked = data.is_published;

  document.getElementById("publicationForm").scrollIntoView({
    behavior: "smooth",
  });
}

async function deletePublication(id) {
  if (!confirm("Энэ мэдээллийг устгах уу?")) return;

  const { error } = await supabaseClient
    .from("publications")
    .delete()
    .eq("id", id);

  if (error) {
    showNotification("Устгахад алдаа гарлаа.", "error");
    return;
  }

  showNotification("Мэдээлэл устгагдлаа.", "success");
  await renderAdminPublications();
}

// =====================================
// EVERELLIS LAW MANAGEMENT
// =====================================

let selectedLawId = null;
let selectedChapterId = null;

// ADMIN CHECK
async function isLawAdmin() {
  const { data, error } = await supabaseClient.auth.getUser();

  return !error && data.user && data.user.app_metadata?.role === "admin";
}

// LOAD LAW DOCUMENTS

async function renderAdminLaws() {
  const lawSelect = document.getElementById("adminLawSelect");
  const chapterSelect = document.getElementById("adminChapterSelect");

  if (!lawSelect || !chapterSelect) return;

  if (!(await isLawAdmin())) {
    showNotification("Админы эрх шаардлагатай.", "error");
    return;
  }

  const { data, error } = await supabaseClient
    .from("law_documents")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Law documents error:", error);
    showNotification("Хуулийн мэдээлэл ачаалж чадсангүй.", "error");
    return;
  }

  if (!data || data.length === 0) {
    lawSelect.innerHTML = '<option value="">Хууль олдсонгүй</option>';
    return;
  }

  // Өмнө сонгосон хуулийн ID-г хадгалах
  const previousLawId = selectedLawId;

  lawSelect.innerHTML = "";

  data.forEach((law) => {
    const option = document.createElement("option");
    option.value = String(law.id);
    option.textContent = law.title;
    lawSelect.appendChild(option);
  });

  // Өмнөх сонголт байвал хадгална, үгүй бол эхний хуулийг сонгоно
  const lawStillExists = data.some(
    (law) => Number(law.id) === Number(previousLawId),
  );

  selectedLawId = lawStillExists ? Number(previousLawId) : Number(data[0].id);

  lawSelect.value = String(selectedLawId);

  function updateLawStatus() {
    const law = data.find((item) => Number(item.id) === Number(selectedLawId));

    if (!law) return;

    document.getElementById("adminLawStatus").innerHTML = `
      <p>Төлөв:
        <strong>
          ${law.is_published ? "НИЙТЛЭГДСЭН" : "НУУГДСАН"}
        </strong>
      </p>
      <button type="button"
        onclick="toggleLawPublish(${law.id}, ${law.is_published})">
        ${law.is_published ? "ХУУЛЬ НУУХ" : "ХУУЛЬ НИЙТЛЭХ"}
      </button>
    `;
  }

  lawSelect.onchange = async function () {
    selectedLawId = Number(this.value);
    selectedChapterId = null;

    updateLawStatus();
    await renderAdminChapters();
  };

  updateLawStatus();
  await renderAdminChapters();
}

// LOAD CHAPTERS

async function renderAdminChapters() {
  const select = document.getElementById("adminChapterSelect");
  const articleList = document.getElementById("adminLawArticleList");

  if (!selectedLawId || !select) return;

  const { data, error } = await supabaseClient
    .from("law_chapters")
    .select("*")
    .eq("law_id", selectedLawId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Chapter error:", error);
    showNotification("Бүлэг ачаалж чадсангүй.", "error");
    return;
  }

  select.innerHTML = "";

  if (!data || data.length === 0) {
    select.innerHTML = '<option value="">Бүлэг олдсонгүй</option>';
    selectedChapterId = null;

    if (articleList) {
      articleList.innerHTML = "<p>Энэ хуульд бүлэг бүртгэгдээгүй байна.</p>";
    }
    return;
  }

  data.forEach((chapter) => {
    const option = document.createElement("option");
    option.value = chapter.id;
    option.textContent = chapter.chapter_number + " — " + chapter.title;

    select.appendChild(option);
  });

  selectedChapterId = Number(select.value);

  // Бүлэг солих үед тухайн бүлгийн зүйлүүдийг харуулах
  select.onchange = async function () {
    selectedChapterId = Number(this.value);
    await renderAdminArticles();
  };

  await renderAdminArticles();
}

// LOAD ARTICLES
async function renderAdminArticles() {
  const list = document.getElementById("adminLawArticleList");

  if (!selectedChapterId || !list) return;

  const { data, error } = await supabaseClient
    .from("law_articles")
    .select("*")
    .eq("chapter_id", selectedChapterId)
    .order("sort_order");

  if (error) {
    console.error("Articles error:", error);
    list.innerHTML = "<p>Зүйлүүдийг ачаалж чадсангүй.</p>";
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = "<p>Энэ бүлэгт зүйл бүртгэгдээгүй байна.</p>";
    return;
  }

  list.innerHTML = data
    .map(
      (article) => `
    <div class="admin-card">
      <h3>
        ${escapeHTML(article.article_number)} дүгээр зүйл.
        ${escapeHTML(article.title)}
      </h3>

      <p>
        Төлөв:
        <strong>
          ${article.is_published ? "НИЙТЛЭГДСЭН" : "НУУГДСАН"}
        </strong>
      </p>

      <div class="admin-actions">
        <button onclick="editLawArticle(${article.id})">
          ЗАСАХ
        </button>

        <button onclick="toggleLawArticlePublish(${article.id}, ${article.is_published})">
          ${article.is_published ? "НУУХ" : "НИЙТЛЭХ"}
        </button>

        <button class="danger-button"
          onclick="deleteLawArticle(${article.id})">
          УСТГАХ
        </button>
      </div>
    </div>
  `,
    )
    .join("");
}

// CHANGE CHAPTER
document
  .getElementById("adminChapterSelect")
  ?.addEventListener("change", async function () {
    selectedChapterId = Number(this.value);
    await renderAdminArticles();
    resetLawArticleForm();
  });

// CHANGE LAW
document
  .getElementById("adminLawSelect")
  ?.addEventListener("change", async function () {
    selectedLawId = Number(this.value);

    await renderAdminLaws();
  });

// SAVE / EDIT ARTICLE
document
  .getElementById("lawArticleForm")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!(await isLawAdmin())) {
      showNotification("Админы эрх шаардлагатай.", "error");
      return;
    }

    if (!selectedChapterId) {
      showNotification("Эхлээд бүлэг сонгоно уу.", "error");
      return;
    }

    const editId = document.getElementById("lawArticleEditId").value;

    const article = {
      chapter_id: selectedChapterId,
      article_number: document.getElementById("lawArticleNumber").value.trim(),
      title: document.getElementById("lawArticleTitle").value.trim(),
      content: document.getElementById("lawArticleContent").value.trim(),
      is_published: document.getElementById("lawArticlePublish").checked,
      updated_at: new Date().toISOString(),
    };

    if (!article.article_number || !article.title || !article.content) {
      showNotification("Бүх талбарыг бөглөнө үү.", "error");
      return;
    }

    try {
      let result;

      if (editId) {
        result = await supabaseClient
          .from("law_articles")
          .update(article)
          .eq("id", editId);
      } else {
        const { data: lastArticle } = await supabaseClient
          .from("law_articles")
          .select("sort_order")
          .eq("chapter_id", selectedChapterId)
          .order("sort_order", { ascending: false })
          .limit(1)
          .maybeSingle();

        article.sort_order = (lastArticle?.sort_order || 0) + 1;

        result = await supabaseClient.from("law_articles").insert(article);
      }

      if (result.error) throw result.error;

      showNotification("Хуулийн зүйл амжилттай хадгалагдлаа.", "success");

      resetLawArticleForm();
      await renderAdminArticles();
    } catch (error) {
      console.error("Save law article error:", error);
      showNotification(error.message || "Хадгалахад алдаа гарлаа.", "error");
    }
  });

// EDIT ARTICLE
async function editLawArticle(id) {
  if (!(await isLawAdmin())) return;

  const { data, error } = await supabaseClient
    .from("law_articles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    showNotification("Зүйл олдсонгүй.", "error");
    return;
  }

  document.getElementById("lawArticleEditId").value = data.id;
  document.getElementById("lawArticleNumber").value = data.article_number;
  document.getElementById("lawArticleTitle").value = data.title;
  document.getElementById("lawArticleContent").value = data.content;
  document.getElementById("lawArticlePublish").checked = data.is_published;

  document.getElementById("lawArticleForm").scrollIntoView({
    behavior: "smooth",
  });
}

// RESET FORM
function resetLawArticleForm() {
  document.getElementById("lawArticleForm")?.reset();
  document.getElementById("lawArticleEditId").value = "";
  document.getElementById("lawArticlePublish").checked = true;
}

// DELETE ARTICLE
async function deleteLawArticle(id) {
  if (!(await isLawAdmin())) return;

  if (!confirm("Энэ зүйлийг устгах уу?")) return;

  const { error } = await supabaseClient
    .from("law_articles")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    showNotification("Устгахад алдаа гарлаа.", "error");
    return;
  }

  showNotification("Зүйл устгагдлаа.", "success");
  await renderAdminArticles();
}

// PUBLISH / HIDE ARTICLE
async function toggleLawArticlePublish(id, currentStatus) {
  if (!(await isLawAdmin())) return;

  const { error } = await supabaseClient
    .from("law_articles")
    .update({ is_published: !currentStatus })
    .eq("id", id);

  if (error) {
    showNotification("Төлөв өөрчилж чадсангүй.", "error");
    return;
  }

  showNotification("Зүйлийн төлөв шинэчлэгдлээ.", "success");
  await renderAdminArticles();
}

// PUBLISH / HIDE CHAPTER
async function toggleLawChapterPublish(id, currentStatus) {
  if (!(await isLawAdmin())) return;

  const { error } = await supabaseClient
    .from("law_chapters")
    .update({ is_published: !currentStatus })
    .eq("id", id);

  if (error) {
    showNotification("Бүлгийн төлөв өөрчилж чадсангүй.", "error");
    return;
  }

  showNotification("Бүлгийн төлөв шинэчлэгдлээ.", "success");
  await renderAdminChapters();
}

// PUBLISH / HIDE LAW
async function toggleLawPublish(id, currentStatus) {
  if (!(await isLawAdmin())) return;

  const { error } = await supabaseClient
    .from("law_documents")
    .update({ is_published: !currentStatus })
    .eq("id", id);

  if (error) {
    showNotification("Хуулийн төлөв өөрчилж чадсангүй.", "error");
    return;
  }

  showNotification("Хуулийн төлөв шинэчлэгдлээ.", "success");
  await renderAdminLaws();
}

async function addLawChapter() {
  if (!(await isLawAdmin())) {
    showNotification("Админы эрх шаардлагатай.", "error");
    return;
  }

  if (!selectedLawId) {
    showNotification("Эхлээд хууль сонгоно уу.", "error");
    return;
  }

  const chapterNumber = prompt("Бүлгийн дугаар оруулна уу. Жишээ: I, II, III");
  if (!chapterNumber || !chapterNumber.trim()) return;

  const chapterTitle = prompt("Бүлгийн нэр оруулна уу.");
  if (!chapterTitle || !chapterTitle.trim()) return;

  const { data: existing, error: fetchError } = await supabaseClient
    .from("law_chapters")
    .select("sort_order")
    .eq("law_id", selectedLawId)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (fetchError) {
    console.error(fetchError);
    showNotification("Бүлгийн дараалал уншиж чадсангүй.", "error");
    return;
  }

  const nextOrder = existing?.length ? existing[0].sort_order + 1 : 1;

  const { data, error } = await supabaseClient
    .from("law_chapters")
    .insert({
      law_id: selectedLawId,
      chapter_number: chapterNumber.trim(),
      title: chapterTitle.trim(),
      sort_order: nextOrder,
      is_published: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Add chapter error:", error);
    showNotification("Бүлэг нэмэхэд алдаа гарлаа: " + error.message, "error");
    return;
  }

  await renderAdminChapters();

  const chapterSelect = document.getElementById("adminChapterSelect");
  if (chapterSelect) {
    chapterSelect.value = String(data.id);
    selectedChapterId = data.id;
    await renderAdminArticles();
  }

  showNotification("Шинэ бүлэг амжилттай нэмэгдлээ!", "success");
}
// =====================================
// ADMIN EVENT MANAGEMENT
// =====================================

async function saveEvent(e) {
  e.preventDefault();

  const editId = document.getElementById("eventEditId").value;

  const title = document.getElementById("eventTitle").value.trim();
  const category = document.getElementById("eventCategory").value;
  const eventDate = document.getElementById("eventDate").value;
  const location = document.getElementById("eventLocation").value.trim();
  const imageUrl = document.getElementById("eventImage").value.trim();
  const description = document.getElementById("eventDescription").value.trim();

  if (!title || !eventDate || !location || !description) {
    alert("Бүх шаардлагатай талбарыг бөглөнө үү.");
    return;
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    alert("Нэвтрэх шаардлагатай.");
    return;
  }

  const eventData = {
    title,
    category,
    event_date: new Date(eventDate).toISOString(),
    location,
    image_url: imageUrl || null,
    description,
    is_published: true,
  };

  let result;

  if (editId) {
    result = await supabaseClient
      .from("events")
      .update(eventData)
      .eq("id", editId);
  } else {
    eventData.created_by = user.id;

    result = await supabaseClient.from("events").insert([eventData]);
  }

  if (result.error) {
    console.error("Event save error:", result.error);
    alert("Эвент хадгалахад алдаа гарлаа: " + result.error.message);
    return;
  }

  alert(editId ? "Эвент амжилттай засагдлаа." : "Эвент амжилттай нэмэгдлээ.");

  document.getElementById("eventForm").reset();
  document.getElementById("eventEditId").value = "";

  await renderAdminEvents();
}

async function renderAdminEvents() {
  const list = document.getElementById("adminEventList");
  const count = document.getElementById("eventAdminCount");

  if (!list) return;

  list.innerHTML = "<p>Эвентүүд ачаалж байна...</p>";

  const { data: events, error } = await supabaseClient
    .from("events")
    .select("*")
    .order("event_date", { ascending: false });

  if (error) {
    console.error("Admin events error:", error);
    list.innerHTML = "<p>Эвентүүдийг ачаалж чадсангүй.</p>";
    return;
  }

  count.textContent = `${events.length} эвент`;

  if (!events.length) {
    list.innerHTML = "<p>Одоогоор эвент байхгүй байна.</p>";
    return;
  }

  list.innerHTML = events
    .map(
      (event) => `
    <div class="panel" style="margin-bottom:15px;">
      <h3>${escapeHTML(event.title)}</h3>
      <p>${escapeHTML(event.category)}</p>
      <p>${escapeHTML(event.location)}</p>
      <p>${new Date(event.event_date).toLocaleString("mn-MN")}</p>
      <p>${event.is_published ? "Нийтлэгдсэн" : "Ноорог"}</p>

      <button class="gold-button"
        onclick="editEvent(${event.id})">
        ЗАСАХ
      </button>

      <button class="outline-button"
        onclick="deleteEvent(${event.id})">
        УСТГАХ
      </button>
    </div>
  `,
    )
    .join("");
}

async function editEvent(id) {
  const { data: event, error } = await supabaseClient
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert("Эвентийн мэдээлэл олдсонгүй.");
    return;
  }

  document.getElementById("eventEditId").value = event.id;
  document.getElementById("eventTitle").value = event.title;
  document.getElementById("eventCategory").value = event.category;
  document.getElementById("eventLocation").value = event.location;
  document.getElementById("eventImage").value = event.image_url || "";
  document.getElementById("eventDescription").value = event.description;

  const date = new Date(event.event_date);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  document.getElementById("eventDate").value = localDate;

  document.getElementById("eventForm").scrollIntoView({
    behavior: "smooth",
  });
}

async function deleteEvent(id) {
  if (!confirm("Энэ эвентийн мэдээллийг устгах уу?")) return;

  const { error } = await supabaseClient.from("events").delete().eq("id", id);

  if (error) {
    alert("Устгахад алдаа гарлаа: " + error.message);
    console.error(error);
    return;
  }

  alert("Эвент устгагдлаа.");
  await renderAdminEvents();
}

function cancelEventEdit() {
  document.getElementById("eventForm").reset();
  document.getElementById("eventEditId").value = "";
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
