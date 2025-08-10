// Simple lazy loading implementation
document.addEventListener("DOMContentLoaded", function () {
  // Check if IntersectionObserver is supported
  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute("data-src");

          if (src) {
            img.src = src;
            img.classList.remove("lazyload");
            img.classList.add("lazyloaded");
            img.removeAttribute("data-src");
          }

          observer.unobserve(img);
        }
      });
    });

    // Observe all images with lazyload class
    document.querySelectorAll("img.lazyload").forEach((img) => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback for older browsers
    document.querySelectorAll("img.lazyload").forEach((img) => {
      const src = img.getAttribute("data-src");
      if (src) {
        img.src = src;
        img.classList.remove("lazyload");
        img.classList.add("lazyloaded");
        img.removeAttribute("data-src");
      }
    });
  }
});
