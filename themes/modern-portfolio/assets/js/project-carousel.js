/**
 * Development page: screenshot carousels on the project cards, and a details
 * modal (native <dialog>) with a larger carousel for each project.
 */
(function () {
  // Swiper's keyboard control listens on the whole page, so only the open
  // modal's carousel uses it; otherwise every card would move at once.
  function makeSwiper(el, { initialSlide = 0, keyboard = false } = {}) {
    return new Swiper(el, {
      loop: true,
      initialSlide,
      speed: 400,
      grabCursor: true,
      keyboard: { enabled: keyboard },
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
  }

  function openModal(card) {
    const opener = card.querySelector(".project-card-open");
    const modal = document.getElementById(opener.getAttribute("aria-controls"));
    if (!modal || modal.open) return;

    const cardSwiper = card.querySelector(".project-carousel.swiper")?.swiper;
    const startAt = cardSwiper ? cardSwiper.realIndex : 0;

    modal.showModal();
    document.documentElement.classList.add("project-modal-open");

    // Swiper measures its container, so the modal carousel starts once visible.
    const el = modal.querySelector(".project-carousel.swiper");
    if (el) {
      if (el.swiper) {
        el.swiper.keyboard.enable();
        el.swiper.slideToLoop(startAt, 0);
      } else makeSwiper(el, { initialSlide: startAt, keyboard: true });
    }
    modal.querySelector(".project-modal-inner").scrollTop = 0;
    modal.querySelector(".project-modal-close").focus();
  }

  function setUpModal(modal) {
    modal.querySelectorAll("[data-close]").forEach((b) =>
      b.addEventListener("click", () => modal.close()),
    );
    // A click on the backdrop lands on the <dialog> itself.
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.close();
    });
    modal.addEventListener("close", () => {
      document.documentElement.classList.remove("project-modal-open");
      modal.querySelector(".project-carousel.swiper")?.swiper?.keyboard.disable();
      const opener = document.querySelector(`[aria-controls="${modal.id}"]`);
      if (opener) opener.focus({ preventScroll: true });
    });
  }

  function init() {
    if (typeof Swiper !== "undefined") {
      document
        .querySelectorAll(".project-card .project-carousel.swiper")
        .forEach((el) => makeSwiper(el));
    }

    document.querySelectorAll(".project-modal").forEach(setUpModal);

    document.querySelectorAll(".project-card").forEach((card) => {
      card
        .querySelector(".project-card-open")
        .addEventListener("click", () => openModal(card));

      // Dragging the card carousel shouldn't also open the modal.
      const carousel = card.querySelector(".project-carousel");
      let downX = null;
      carousel.addEventListener("pointerdown", (e) => (downX = e.clientX));
      carousel.addEventListener("click", (e) => {
        const dragged = downX !== null && Math.abs(e.clientX - downX) > 6;
        downX = null;
        if (dragged || e.target.closest(".project-carousel-nav, .swiper-pagination-bullet")) return;
        openModal(card);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
