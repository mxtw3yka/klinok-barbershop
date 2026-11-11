const topButton = document.querySelector("#back-to-top");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (topButton) {
  const updateTopButton = () =>
    topButton.classList.toggle("is-visible", window.scrollY > 360);
  window.addEventListener("scroll", updateTopButton, { passive: true });
  updateTopButton();
  topButton.addEventListener("click", () =>
    window.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "instant" : "smooth",
    }),
  );
}

const year = document.querySelector("#year");
if (year) year.textContent = String(new Date().getFullYear());

const themeTarget = document.querySelector(".site-header .navbar-collapse");
if (themeTarget) {
  const themeButton = document.createElement("button");
  themeButton.type = "button";
  themeButton.className = "theme-toggle";
  themeButton.innerHTML =
    '<svg class="theme-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></svg><svg class="theme-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"/></svg><span class="theme-toggle-text"></span>';
  const bookingLink = themeTarget.querySelector(".header-book, .nav-book");
  themeTarget.insertBefore(themeButton, bookingLink);

  const syncTheme = () => {
    const light = document.documentElement.dataset.theme === "light";
    const label = light ? "Включить тёмную тему" : "Включить светлую тему";
    themeButton.setAttribute("aria-label", label);
    themeButton.setAttribute("title", label);
    themeButton.setAttribute("aria-pressed", String(light));
    themeButton.querySelector(".theme-toggle-text").textContent = label;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", light ? "#e9eceb" : "#142438");
  };
  if (!document.documentElement.dataset.theme) document.documentElement.dataset.theme = "dark";
  syncTheme();
  themeButton.addEventListener("click", () => {
    const nextTheme =
      document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    try {
      localStorage.setItem("klinok-theme", nextTheme);
    } catch {
      // The current page still changes theme when browser storage is unavailable.
    }
    if (location.protocol === "file:") {
      const url = new URL(location.href);
      url.searchParams.set("theme", nextTheme);
      history.replaceState(null, "", url);
    }
    syncTheme();
  });
}

// File-opened pages can have separate storage origins. Carry the choice in local links.
if (location.protocol === "file:") {
  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[href]");
    const href = link?.getAttribute("href");
    if (!href || !/^(?:index|catalog|product|masters|order)\.html(?:[?#]|$)/.test(href)) return;
    const url = new URL(href, location.href);
    url.searchParams.set("theme", document.documentElement.dataset.theme);
    link.href = url.href;
  }, true);
}

for (const button of document.querySelectorAll(
  "[data-service], [data-barber]",
)) {
  button.addEventListener("click", () => {
    const params = new URLSearchParams();
    if (button.dataset.service) params.set("service", button.dataset.service);
    if (button.dataset.barber) params.set("barber", button.dataset.barber);
    if (location.protocol === "file:") params.set("theme", document.documentElement.dataset.theme);
    window.location.href = `order.html?${params}`;
  });
}

const filterButtons = [...document.querySelectorAll("[data-filter]")];
const filterCards = [...document.querySelectorAll("[data-category]")];
for (const button of filterButtons) {
  button.addEventListener("click", () => {
    const category = button.dataset.filter;
    for (const option of filterButtons) {
      const active = option === button;
      option.setAttribute("aria-pressed", String(active));
      option.classList.toggle("is-active", active);
    }
    for (const card of filterCards)
      card.hidden =
        category !== "all" &&
        !card.dataset.category.split(" ").includes(category);
  });
}

const gallery = document.querySelector("#gallery-dialog");
const images = [...document.querySelectorAll(".work-tile[data-image]")];
if (gallery && images.length) {
  const picture = gallery.querySelector("img");
  const caption = gallery.querySelector("#gallery-caption");
  let current = 0;
  const showImage = (index) => {
    current = (index + images.length) % images.length;
    const tile = images[current];
    picture.src = tile.dataset.image;
    picture.alt = tile.querySelector("img")?.alt || "";
    caption.textContent = tile.dataset.caption || "";
  };
  images.forEach((tile, index) =>
    tile.addEventListener("click", () => {
      showImage(index);
      gallery.showModal();
    }),
  );
  gallery
    .querySelector(".gallery-close")
    .addEventListener("click", () => gallery.close());
  gallery
    .querySelector(".gallery-prev")
    .addEventListener("click", () => showImage(current - 1));
  gallery
    .querySelector(".gallery-next")
    .addEventListener("click", () => showImage(current + 1));
  gallery.addEventListener("click", (event) => {
    if (event.target === gallery) gallery.close();
  });
  gallery.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") showImage(current + 1);
    if (event.key === "ArrowLeft") showImage(current - 1);
  });
}

const form = document.querySelector("#booking-form");
if (form) {
  const date = form.elements.namedItem("date");
  const time = form.elements.namedItem("time");
  const service = form.elements.namedItem("service");
  const barber = form.elements.namedItem("barber");
  const status = document.querySelector("#form-status");
  const today = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };
  const refreshTimes = () => {
    const now = new Date();
    for (const option of time.options) {
      if (!option.value) continue;
      const [hours, minutes] = option.value.split(":").map(Number);
      option.disabled =
        date.value === today() &&
        hours * 60 + minutes <= now.getHours() * 60 + now.getMinutes();
    }
    if (time.selectedOptions[0]?.disabled) time.value = "";
  };
  date.min = today();
  date.addEventListener("change", refreshTimes);
  refreshTimes();
  const params = new URLSearchParams(window.location.search);
  if (
    [...service.options].some(
      (option) => option.value === params.get("service"),
    )
  )
    service.value = params.get("service");
  if (
    [...barber.options].some((option) => option.value === params.get("barber"))
  )
    barber.value = params.get("barber");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    status.textContent = "";
    if (!form.reportValidity()) return;
    status.textContent =
      "Форма демонстрационная. Чтобы записаться, позвоните +7 (495) 120-22-00.";
  });
}
