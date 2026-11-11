const header = document.querySelector(".site-header");
const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
const form = document.querySelector(".form");
const result = document.querySelector(".result");
const year = document.querySelector("[data-year]");

if (year) year.textContent = String(new Date().getFullYear());

window.addEventListener("scroll", () => {
  header.classList.toggle("is-stuck", window.scrollY > 8);
}, { passive: true });

toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
});

nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const text = [
    "Заявка на доставку мебели",
    `Имя: ${data.get("name")}`,
    `Телефон: ${data.get("phone")}`,
    `Откуда: ${data.get("from")}`,
    `Куда: ${data.get("to")}`,
    `Что везти: ${data.get("cargo")}`,
    `Комментарий: ${data.get("comment") || "—"}`
  ].join("\n");

  const email = document.querySelector('meta[name="contact-email"]').content.trim();
  const mail = document.querySelector("[data-mail]");
  result.querySelector("pre").textContent = text;
  mail.href = `mailto:${email}?subject=${encodeURIComponent("Заявка на доставку мебели")}&body=${encodeURIComponent(text)}`;
  result.classList.add("is-visible");
  result.scrollIntoView({ block: "nearest" });
});

document.querySelectorAll(".video-card").forEach((card) => {
  const video = card.querySelector("video");
  const play = card.querySelector(".video-play");
  if (!video || !play) return;

  const start = () => {
    video.controls = true;
    card.classList.add("is-playing");
    const pending = video.play();
    if (pending) {
      pending.catch(() => {
        card.classList.remove("is-playing");
        video.controls = false;
      });
    }
  };

  play.addEventListener("click", start);
  video.addEventListener("play", () => card.classList.add("is-playing"));
});

document.querySelector("[data-copy]").addEventListener("click", async () => {
  const text = result.querySelector("pre").textContent;
  try {
    await navigator.clipboard.writeText(text);
    document.querySelector("[data-copy]").textContent = "Скопировано";
  } catch (_error) {
    document.querySelector("[data-copy]").textContent = "Скопируйте текст вручную";
  }
});
