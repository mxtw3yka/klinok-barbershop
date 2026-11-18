(() => {
  const storageKey = "klinok-favorites";
  const services = [
    { token: "service-haircut", name: "Мужская стрижка", href: "catalog.html#service-haircut" },
    { token: "service-beard", name: "Оформление бороды", href: "catalog.html#service-beard" },
    { token: "service-combo", name: "Стрижка + борода", href: "catalog.html#service-combo" },
    { token: "service-shave", name: "Королевское бритьё", href: "catalog.html#service-shave" },
  ];
  const masters = [
    { token: "master-artem", name: "Артём", href: "masters.html#master-artem" },
    { token: "master-daniil", name: "Даниил", href: "masters.html#master-daniil" },
    { token: "master-maks", name: "Макс", href: "masters.html#master-maks" },
  ];
  const entries = [...services, ...masters];
  const byToken = new Map(entries.map((entry) => [entry.token, entry]));
  const isFile = location.protocol === "file:";
  const parseTokens = (tokens) => new Set(tokens.filter((token) => byToken.has(token)));
  let saved = new Set();
  let storageAvailable = false;
  let urlAvailable = false;
  let unavailableMessage = "";

  function showNotice(message) {
    const cabinetStatus = document.querySelector("#cabinet-status");
    if (cabinetStatus) {
      cabinetStatus.hidden = false;
      cabinetStatus.textContent = message;
      return;
    }
    const list = document.querySelector(".service-list") || document.querySelector(".master-card");
    if (!list) return;
    let notice = document.querySelector("#favorite-status");
    if (!notice) {
      notice = document.createElement("p");
      notice.id = "favorite-status";
      notice.className = "favorite-unavailable";
      notice.setAttribute("role", "status");
      list.parentElement.insertBefore(notice, list);
    }
    notice.textContent = message;
  }

  function orderedTokens(next) {
    return entries.filter((entry) => next.has(entry.token)).map((entry) => entry.token);
  }

  function syncFileUrl(next) {
    const url = new URL(location.href);
    const value = orderedTokens(next).join(",");
    if (url.searchParams.get("saved") !== value) {
      url.searchParams.set("saved", value);
      history.replaceState(history.state, "", url.href);
    }
    urlAvailable = true;
    // Existing links must reflect a toggle made after app.js has decorated them.
    const directory = location.pathname.slice(0, location.pathname.lastIndexOf("/") + 1);
    for (const anchor of document.querySelectorAll("a[href]")) {
      const destination = new URL(anchor.href, location.href);
      if (destination.protocol !== "file:" || !destination.pathname.startsWith(directory) ||
          destination.pathname.slice(directory.length).includes("/") || !destination.pathname.endsWith(".html")) continue;
      destination.searchParams.set("saved", value);
      anchor.href = destination.href;
    }
  }

  function setButtonState(button) {
    const entry = byToken.get(button.dataset.favoriteToken);
    const active = saved.has(entry.token);
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute("aria-label", `${active ? "Убрать из избранного" : "Добавить в избранное"}: ${entry.name}`);
    button.innerHTML = `<span aria-hidden="true">${active ? "♥" : "♡"}</span> ${active ? "Сохранено" : "В избранное"}`;
  }

  function renderList(kind, items) {
    const list = document.querySelector(`#cabinet-${kind}`);
    if (!list) return;
    const selected = items.filter((entry) => saved.has(entry.token));
    document.querySelector(`#cabinet-${kind}-count`).textContent = String(selected.length);
    document.querySelector(`#cabinet-${kind}-empty`).hidden = selected.length > 0;
    list.replaceChildren();
    for (const entry of selected) {
      const item = document.createElement("li");
      item.className = "cabinet-item";
      const link = document.createElement("a");
      link.className = "cabinet-item-link";
      link.href = entry.href;
      link.textContent = entry.name;
      const arrow = document.createElement("span");
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = " ↗";
      link.append(arrow);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "cabinet-remove";
      remove.dataset.removeFavorite = entry.token;
      remove.setAttribute("aria-label", `Убрать из избранного: ${entry.name}`);
      remove.textContent = "Убрать";
      item.append(link, remove);
      list.append(item);
    }
  }

  function render() {
    for (const button of document.querySelectorAll("[data-favorite-token]")) setButtonState(button);
    const total = document.querySelector("#cabinet-total");
    if (total) total.textContent = String(saved.size);
    renderList("services", services);
    renderList("masters", masters);
    if (isFile && urlAvailable) syncFileUrl(saved);
  }

  function changeFavorite(token) {
    if (unavailableMessage) return false;
    const next = new Set(saved);
    if (next.has(token)) next.delete(token);
    else next.add(token);
    if (isFile) {
      try {
        syncFileUrl(next);
      } catch {
        unavailableMessage = "Не удалось сохранить избранное в адресе страницы. Изменения недоступны: браузер ограничил хранение для файлов.";
        showNotice(unavailableMessage);
        return false;
      }
    }
    if (storageAvailable) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(orderedTokens(next)));
      } catch {
        storageAvailable = false;
        if (!isFile) {
          unavailableMessage = "Не удалось сохранить избранное в браузере. Проверьте разрешения или свободное место; изменения не применены.";
          showNotice(unavailableMessage);
          return false;
        }
        showNotice("Локальное хранилище недоступно. Подборка сохраняется только в адресе и внутренних ссылках этой вкладки; при прямом открытии другой страницы она не восстановится.");
      }
    }
    saved = next;
    render();
    return true;
  }

  function addButtons() {
    for (const card of document.querySelectorAll(".service-list .service-card")) {
      const link = card.querySelector('a[href*="service="]');
      if (!link) continue;
      const id = new URL(link.href, location.href).searchParams.get("service");
      const token = `service-${id}`;
      const actions = card.querySelector(".card-actions");
      if (!byToken.has(token) || !actions || actions.querySelector("[data-favorite-token]")) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "favorite-toggle";
      button.dataset.favoriteToken = token;
      actions.append(button);
    }
    for (const card of document.querySelectorAll(".master-card")) {
      const link = card.querySelector('a[href*="barber="]');
      if (!link) continue;
      const id = new URL(link.href, location.href).searchParams.get("barber");
      const token = `master-${id}`;
      const copy = card.querySelector(".master-copy");
      if (!byToken.has(token) || !copy || copy.querySelector("[data-favorite-token]")) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "favorite-toggle";
      button.dataset.favoriteToken = token;
      copy.append(button);
    }
  }

  function init() {
    try {
      const stored = localStorage.getItem(storageKey);
      storageAvailable = true;
      if (stored !== null) {
        try {
          const tokens = JSON.parse(stored);
          if (Array.isArray(tokens)) saved = parseTokens(tokens);
        } catch {
          // A malformed old value is not a storage-permission failure.
        }
      }
    } catch {
      storageAvailable = false;
    }
    const params = new URLSearchParams(location.search);
    if (isFile && params.has("saved")) {
      saved = parseTokens(params.get("saved").split(","));
      if (storageAvailable) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(orderedTokens(saved)));
        } catch {
          storageAvailable = false;
        }
      }
    }
    if (isFile) {
      try {
        syncFileUrl(saved);
      } catch {
        unavailableMessage = "Браузер не позволяет сохранять избранное в адресе файла. Изменения недоступны; попробуйте открыть сайт через локальный сервер.";
      }
      if (!storageAvailable && !unavailableMessage) {
        showNotice("Локальное хранилище недоступно. Подборка сохраняется только в адресе и внутренних ссылках этой вкладки; при прямом открытии другой страницы она не восстановится.");
      }
    } else if (!storageAvailable) {
      unavailableMessage = "Локальное хранилище недоступно. Избранное нельзя сохранить в этом браузере; проверьте разрешения или откройте сайт в другом браузере.";
    }
    addButtons();
    render();
    if (unavailableMessage) showNotice(unavailableMessage);
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-favorite-token], [data-remove-favorite]");
      if (!button) return;
      const token = button.dataset.favoriteToken || button.dataset.removeFavorite;
      if (!byToken.has(token) || !changeFavorite(token) || !button.dataset.removeFavorite) return;
      const kind = token.startsWith("service-") ? "services" : "masters";
      const nextButton = document.querySelector(`#cabinet-${kind} .cabinet-remove`);
      (nextButton || document.querySelector(`#cabinet-${kind}-title`)).focus();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
