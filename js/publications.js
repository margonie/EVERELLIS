let allPublications = [];

document.addEventListener("DOMContentLoaded", () => {
  loadPublications();

  document.querySelectorAll(".publication-filters button").forEach((button) => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll(".publication-filters button")
        .forEach((btn) => btn.classList.remove("active"));

      button.classList.add("active");
      filterPublications(button.dataset.category);
    });
  });
});

async function loadPublications() {
  const box = document.getElementById("publicationList");

  try {
    const { data, error } = await supabaseClient
      .from("publications")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (error) throw error;

    allPublications = data || [];
    filterPublications("all");
  } catch (error) {
    console.error("Publications error:", error);
    box.textContent = "Мэдээлэл ачаалахад алдаа гарлаа.";
  }
}

function filterPublications(category) {
  const filtered =
    category === "all"
      ? allPublications
      : allPublications.filter((item) => item.category === category);

  renderPublications(filtered);
}

function renderPublications(publications) {
  const box = document.getElementById("publicationList");

  if (!publications.length) {
    box.innerHTML = "<p>Одоогоор нийтлэгдсэн мэдээлэл алга байна.</p>";
    return;
  }

  box.innerHTML = publications
    .map(
      (item) => `
    <article class="publication-card">
      ${
        item.image_url
          ? `<img src="${escapeAttribute(item.image_url)}" alt="">`
          : ""
      }
      <div class="publication-card-content">
        <span class="publication-category">
          ${getCategoryName(item.category)}
        </span>
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.summary || "")}</p>
        <button onclick="viewPublication(${item.id})">
          ДЭЛГЭРЭНГҮЙ
        </button>
      </div>
    </article>
  `,
    )
    .join("");
}

function getCategoryName(category) {
  const names = {
    news: "УЛСЫН МЭДЭЭ",
    decree: "ХААНЫ ЗАРЛИГ",
    council_decision: "ЗӨВЛӨЛИЙН ШИЙДВЭР",
    announcement: "ЗАРЛАЛ",
  };

  return names[category] || "МЭДЭЭЛЭЛ";
}

function escapeHTML(value) {
  return String(value).replace(
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

function escapeAttribute(value) {
  return escapeHTML(value);
}

function viewPublication(id) {
  const item = allPublications.find((p) => p.id === id);
  if (!item) return;

  const detail = document.createElement("div");
  detail.className = "publication-modal";

  detail.innerHTML = `
    <div class="publication-modal-content">
      <button class="modal-close" aria-label="Хаах">×</button>
      <span>${getCategoryName(item.category)}</span>
      <h2>${escapeHTML(item.title)}</h2>
      <p class="publication-date">
        ${new Date(item.published_at || item.created_at).toLocaleDateString("mn-MN")}
      </p>
      ${
        item.image_url
          ? `<img src="${escapeAttribute(item.image_url)}" alt="">`
          : ""
      }
      <div class="publication-full-content">
        ${escapeHTML(item.content).replace(/\n/g, "<br>")}
      </div>
    </div>
  `;

  document.body.appendChild(detail);

  detail.querySelector(".modal-close").addEventListener("click", () => {
    detail.remove();
  });

  detail.addEventListener("click", (event) => {
    if (event.target === detail) detail.remove();
  });
}
