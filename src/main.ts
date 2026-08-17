import { startHill } from "./hill/scene";

const root = document.querySelector("#app");
if (!(root instanceof HTMLElement)) throw new Error("#app missing");
startHill(root);
