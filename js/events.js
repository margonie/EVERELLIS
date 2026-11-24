// =====================================
// EVERELLIS PUBLIC EVENTS - SUPABASE
// =====================================

function eventSafeText(value) {
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

function safeEventImage(value) {
  try {
    const url = new URL(value);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return eventSafeText(url.href);
    }
  } catch {}

  return "";
}

async function renderPublicEvents() {
  const container = document.getElementById("publicEventList");

  if (!container) return;

  container.innerHTML = "<p>Мэдээлэл ачаалж байна...</p>";

  try {
    const { data: events, error } = await supabaseClient
      .from("events")
      .select("*")
      .eq("is_published", true)
      .order("event_date", { ascending: true });

    if (error) throw error;

    if (!events || events.length === 0) {
      container.innerHTML = `
        <div class="event-empty" style="grid-column:1/-1">
          <h2>♛</h2>
          <h3>ОДООГООР ЭВЕНТ БАЙХГҮЙ</h3>
          <p>Удахгүй болох арга хэмжээнүүдийн мэдээлэл энд нийтлэгдэнэ.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = events
      .map((event) => {
        const image = safeEventImage(event.image_url);

        const eventDate = event.event_date
          ? new Date(event.event_date).toLocaleString("mn-MN")
          : "Тодорхойгүй";

        return `
        <article class="event-card">

          ${
            image
              ? `
                <img
                  src="${image}"
                  alt="${eventSafeText(event.title)}"
                >
              `
              : ""
          }

          <div class="event-card-content">

            <span class="event-category">
              ${eventSafeText(event.category)}
            </span>

            <h2>${eventSafeText(event.title)}</h2>

            <div class="event-meta">
              ♛ ${eventSafeText(event.location)}
            </div>

            <div class="event-meta">
              ◷ ${eventSafeText(eventDate)}
            </div>

            <p>${eventSafeText(event.description)}</p>

          </div>
        </article>
      `;
      })
      .join("");
  } catch (error) {
    console.error("Events loading error:", error);

    container.innerHTML = `
      <div class="event-empty" style="grid-column:1/-1">
        <h3>МЭДЭЭЛЭЛ АЧААЛЖ ЧАДСАНГҮЙ</h3>
        <p>Холболтоо шалгаад дахин оролдоно уу.</p>
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", renderPublicEvents);
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
