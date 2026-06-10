// Highlight active nav link based on current page section
(function () {
  const path = window.location.pathname;
  let section = "home";

  if (path.includes("/articles")) {
    section = "articles";
  } else if (path.includes("principles")) {
    section = "principles";
  } else if (path.includes("projects")) {
    section = "projects";
  }

  document.querySelectorAll(`.site-nav a[data-nav="${section}"]`).forEach((link) => {
    link.classList.add("active");
  });
})();