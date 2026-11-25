// =====================================
// EVERELLIS LAW PAGE - SUPABASE
// =====================================

let lawChapters = [];

function escapeLawHTML(value) {
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

// Бүлэг сонгох
function showLawChapter(index, button) {
  const sections = document.querySelectorAll(".law-content .law-section");

  const buttons = document.querySelectorAll(".law-sidebar .law-chapter-btn");

  sections.forEach((section) => section.classList.remove("active"));
  buttons.forEach((item) => item.classList.remove("active"));

  if (sections[index]) {
    sections[index].classList.add("active");
  }

  if (button) {
    button.classList.add("active");
  }
}

// Гар утасны бүлгийн цэс
// ХУУЛИЙН БҮЛГИЙН ЦЭС НЭЭХ / ХААХ
function toggleLawMenu() {
  const sidebar = document.querySelector(".law-sidebar");
  const nav = document.getElementById("lawChapterNav");
  const arrow = document.getElementById("lawArrow");

  if (!sidebar || !nav) return;

  const isOpen = nav.classList.toggle("visible");

  sidebar.classList.toggle("open", isOpen);

  if (arrow) {
    arrow.textContent = isOpen ? "−" : "＋";
  }
}

// =====================================
// ХУУЛИЙН МЭДЭЭЛЭЛ АЧААЛАХ
// =====================================

async function loadLawPage() {
  const nav = document.getElementById("lawChapterNav");
  const content = document.querySelector(".law-content");

  if (!nav || !content) return;

  nav.innerHTML = "<p>Бүлгүүд ачаалж байна...</p>";
  content.innerHTML = "<p>Хуулийн мэдээлэл ачаалж байна...</p>";

  try {
    // Үндсэн хуулийг авах
    const { data: law, error: lawError } = await window.supabaseClient
      .from("law_documents")
      .select("id, title, description")
      .eq("slug", window.CURRENT_LAW_SLUG || "undsen")
      .eq("is_published", true)
      .single();

    if (lawError) throw lawError;

    // Нийтлэгдсэн бүлгүүдийг авах
    const { data: chapters, error: chapterError } = await window.supabaseClient
      .from("law_chapters")
      .select("id, chapter_number, title, sort_order")
      .eq("law_id", law.id)
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (chapterError) throw chapterError;

    lawChapters = chapters || [];

    nav.innerHTML = "";
    content.innerHTML = "";

    if (lawChapters.length === 0) {
      nav.innerHTML = "<p>Нийтлэгдсэн бүлэг алга.</p>";
      content.innerHTML = "<p>Хуулийн мэдээлэл одоогоор байхгүй байна.</p>";
      return;
    }

    // Бүлгүүдийг дэлгэцэнд гаргах
    for (let i = 0; i < lawChapters.length; i++) {
      const chapter = lawChapters[i];

      const button = document.createElement("button");
      button.className = "law-chapter-btn";
      button.textContent = `${chapter.chapter_number}. ${chapter.title}`;

      button.addEventListener("click", () => {
        showLawChapter(i, button);
      });

      nav.appendChild(button);

      // Тухайн бүлгийн зүйлүүдийг авах
      const { data: articles, error: articleError } =
        await window.supabaseClient
          .from("law_articles")
          .select("id, article_number, title, content, sort_order")
          .eq("chapter_id", chapter.id)
          .eq("is_published", true)
          .order("sort_order", { ascending: true });

      if (articleError) throw articleError;

      const section = document.createElement("section");
      section.className = "law-section";

      section.innerHTML = `
        <div class="law-document-heading">
          <span>CHAPTER ${escapeLawHTML(chapter.chapter_number)}</span>
          <h2>${escapeLawHTML(chapter.title)}</h2>
        </div>

        <div class="law-articles-container">
          ${
            articles && articles.length
              ? articles
                  .map(
                    (article) => `
                  <div class="law-article">
                    <h3>
                      ${escapeLawHTML(article.article_number)}
                      дугаар зүйл. ${escapeLawHTML(article.title)}
                    </h3>
                    <div class="law-article-content">
                      ${escapeLawHTML(article.content).replace(/\n/g, "<br>")}
                    </div>
                  </div>
                `,
                  )
                  .join("")
              : "<p>Энэ бүлэгт нийтлэгдсэн зүйл одоогоор алга.</p>"
          }
        </div>
      `;

      content.appendChild(section);
    }

    // Эхний бүлгийг автоматаар харуулах
    const firstButton = nav.querySelector(".law-chapter-btn");

    if (firstButton) {
      showLawChapter(0, firstButton);
    }

    // Хуулийн гарчиг шинэчлэх
    const heroTitle = document.querySelector(".law-hero h1");
    const heroDescription = document.querySelector(".law-hero p");

    if (heroTitle) heroTitle.textContent = law.title;
    if (heroDescription && law.description) {
      heroDescription.textContent = law.description;
    }
  } catch (error) {
    console.error("Law page loading error:", error);

    nav.innerHTML = "<p>Бүлгүүдийг ачаалж чадсангүй.</p>";
    content.innerHTML = `
      <p>Хуулийн мэдээлэл ачаалахад алдаа гарлаа.</p>
      <p>${escapeLawHTML(error.message)}</p>
    `;
  }
}

// Хуудас нээгдэхэд ажиллуулах
document.addEventListener("DOMContentLoaded", () => {
  loadLawPage();
});
