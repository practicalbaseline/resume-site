import { HILL_MARKS, marksHtml } from "./hill/marks";

const root = document.querySelector("#app");
if (!(root instanceof HTMLElement)) throw new Error("#app missing");

root.innerHTML = `
  <div class="hill-stage">
    <div class="desert-view"></div>
    ${marksHtml(HILL_MARKS)}
  </div>
`;

const view = root.querySelector(".desert-view");
if (view instanceof HTMLElement) {
  void import("./desert/walk").then(({ startDesert }) => {
    startDesert(view);
  });
}
