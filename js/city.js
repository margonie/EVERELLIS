// Scroll animation
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  },
  {
    threshold: 0.15,
  },
);

document
  .querySelectorAll(
    ".about-grid, .stat, .timeline-item, .place-card, .gallery-grid img",
  )
  .forEach((element) => {
    element.style.opacity = "0";
    element.style.transform = "translateY(30px)";
    element.style.transition = "all 0.8s ease";

    observer.observe(element);
  });

const style = document.createElement("style");

style.innerHTML = `
.show {
    opacity: 1 !important;
    transform: translateY(0) !important;
}
`;

document.head.appendChild(style);
