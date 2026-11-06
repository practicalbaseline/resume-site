const root = document.querySelector("#app");
if (!(root instanceof HTMLElement)) throw new Error("#app missing");

root.innerHTML = `
  <main class="soon">
    <p>Website coming soon</p>
  </main>
`;
