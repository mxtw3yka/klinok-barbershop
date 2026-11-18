(() => {
  const input = document.querySelector("#site-search-input");
  const form = document.querySelector("#site-search-form");
  const count = document.querySelector("#search-count");
  const empty = document.querySelector("#search-empty");
  const normalize = (text) => text.toLocaleLowerCase("ru").replaceAll("ё", "е");
  const groups = [...document.querySelectorAll(".search-group")].map((section) => ({
    section,
    count: section.querySelector(".search-group-count"),
    results: [...section.querySelectorAll(".search-result")].map((element) => ({
      element,
      text: normalize(`${element.textContent} ${element.dataset.search || ""}`),
    })),
  }));

  const resultWord = (number) => {
    if (number % 100 >= 11 && number % 100 <= 14) return "результатов";
    if (number % 10 === 1) return "результат";
    if (number % 10 >= 2 && number % 10 <= 4) return "результата";
    return "результатов";
  };

  const filter = () => {
    const terms = normalize(input.value.trim()).split(/\s+/).filter(Boolean);
    let total = 0;

    for (const group of groups) {
      let visible = 0;
      for (const result of group.results) {
        const matches = terms.every((term) => result.text.includes(term));
        result.element.hidden = !matches;
        if (matches) visible++;
      }
      group.section.hidden = visible === 0;
      group.count.textContent = visible;
      total += visible;
    }

    count.textContent = `Найдено ${total} ${resultWord(total)}`;
    empty.hidden = total !== 0;
  };

  input.value = new URLSearchParams(window.location.search).get("q") || "";
  form.addEventListener("submit", (event) => event.preventDefault());
  input.addEventListener("input", filter);
  filter();
})();
