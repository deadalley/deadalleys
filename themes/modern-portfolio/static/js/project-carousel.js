/**
 * Project screenshot carousels (Swiper) and a lightbox for viewing a
 * screenshot at full size.
 */
(function () {
  function initCarousels() {
    if (typeof Swiper === "undefined") return;

    document.querySelectorAll(".project-carousel.swiper").forEach((el) => {
      new Swiper(el, {
        loop: true,
        speed: 400,
        grabCursor: true,
        keyboard: { enabled: true, onlyInViewport: true },
        a11y: {
          enabled: true,
          prevSlideMessage: "Previous screenshot",
          nextSlideMessage: "Next screenshot",
        },
        navigation: {
          prevEl: el.querySelector(".project-carousel-prev"),
          nextEl: el.querySelector(".project-carousel-next"),
        },
        pagination: {
          el: el.querySelector(".project-carousel-pagination"),
          clickable: true,
        },
      });
    });
  }

  // Lightbox ---------------------------------------------------------------

  let lightbox = null;
  let items = [];
  let index = 0;
  let returnFocus = null;

  function buildLightbox() {
    lightbox = document.createElement("div");
    lightbox.className = "carousel-modal project-lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Screenshot viewer");
    lightbox.innerHTML = `
      <div class="carousel-overlay" data-close></div>
      <div class="carousel-container">
        <button type="button" class="carousel-close" data-close aria-label="Close">&times;</button>
        <button type="button" class="carousel-nav carousel-prev" aria-label="Previous screenshot">&#8249;</button>
        <button type="button" class="carousel-nav carousel-next" aria-label="Next screenshot">&#8250;</button>
        <div class="carousel-content">
          <img alt="" />
          <div class="carousel-info"><div class="carousel-counter"></div></div>
        </div>
      </div>`;
    document.body.appendChild(lightbox);

    lightbox.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
    lightbox.querySelector(".carousel-prev").addEventListener("click", () => show(index - 1));
    lightbox.querySelector(".carousel-next").addEventListener("click", () => show(index + 1));
    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(index - 1);
      else if (e.key === "ArrowRight") show(index + 1);
    });
  }

  function show(i) {
    index = (i + items.length) % items.length;
    const img = lightbox.querySelector("img");
    img.src = items[index].src;
    img.alt = items[index].alt;
    const multi = items.length > 1;
    lightbox.querySelector(".carousel-counter").textContent = multi ? `${index + 1} / ${items.length}` : "";
    lightbox.querySelectorAll(".carousel-nav").forEach((b) => (b.hidden = !multi));
  }

  function open(card, src) {
    if (!lightbox) buildLightbox();
    // One entry per screenshot, in order. Swiper's loop adds copies of the
    // first and last slides at either end, so skip those.
    items = [...card.querySelectorAll(".project-slide")]
      .filter((s) => !s.classList.contains("swiper-slide-duplicate"))
      .map((s) => {
        const b = s.querySelector(".project-slide-open");
        return { src: b.dataset.full, alt: b.querySelector("img").alt };
      });
    returnFocus = document.activeElement;
    show(Math.max(0, items.findIndex((it) => it.src === src)));
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
    lightbox.querySelector(".carousel-close").focus();
  }

  function close() {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
    if (returnFocus) returnFocus.focus();
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".project-slide-open");
    if (!btn) return;
    open(btn.closest(".project-card"), btn.dataset.full);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCarousels);
  } else {
    initCarousels();
  }
})();
