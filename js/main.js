// Highlight active nav link based on current page
(function () {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const links = document.querySelectorAll(".site-nav a");

  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    const linkPath = href.replace(/\/$/, "") || "/";
    const isHome = linkPath === "/" || linkPath === "/index.html";
    const isCurrentHome = path === "/" || path.endsWith("/index.html");

    if (
      (isHome && isCurrentHome) ||
      (!isHome && path.endsWith(linkPath))
    ) {
      link.classList.add("active");
    }
  });
})();