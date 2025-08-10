// Modern Portfolio Theme JavaScript
document.addEventListener("DOMContentLoaded", function () {
  // Initialize glassmorphic header scroll effect
  initializeGlassmorphicHeader();

  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener("click", function () {
      mobileMenu.classList.toggle("hidden");
      const icon = mobileMenuToggle.querySelector("i");
      if (mobileMenu.classList.contains("hidden")) {
        icon.classList.remove("fa-times");
        icon.classList.add("fa-bars");
      } else {
        icon.classList.remove("fa-bars");
        icon.classList.add("fa-times");
      }
    });
  }
});

// Glassmorphic header scroll effect
function initializeGlassmorphicHeader() {
  const header = document.querySelector(".glassmorphic-header");

  if (!header) return;

  let scrollTimeout;

  function updateHeaderOnScroll() {
    const scrollY = window.scrollY;

    if (scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }

  // Throttled scroll event for better performance
  function handleScroll() {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    scrollTimeout = setTimeout(updateHeaderOnScroll, 10);
  }

  window.addEventListener("scroll", handleScroll, { passive: true });

  // Initial check
  updateHeaderOnScroll();
}

function scrollToNextSection() {
  const heroSection = document.querySelector(".hero-section-extended");
  const nextSection = heroSection ? heroSection.nextElementSibling : null;

  if (nextSection) {
    nextSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  } else {
    // Fallback: scroll down by viewport height
    window.scrollBy({
      top: window.innerHeight,
      behavior: "smooth",
    });
  }
}
