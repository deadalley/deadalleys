/**
 * Slide-in Animation Controller
 * Handles slide-in animations for album cards and featured albums
 */

class SlideAnimationController {
  constructor() {
    this.animatedElements = [];
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        this.setupAnimations()
      );
    } else {
      this.setupAnimations();
    }
  }

  setupAnimations() {
    // Get all elements that need animation
    this.observeAnimationElements();

    // Also trigger immediate animations for elements already in view
    this.triggerInitialAnimations();

    // Set up mutation observer for dynamically added content
    this.setupMutationObserver();
  }

  observeAnimationElements() {
    const slideElements = document.querySelectorAll(
      ".slide-in-left, .slide-in-right, .slide-in-bottom"
    );

    if (slideElements.length === 0) return;

    // Create intersection observer for viewport-based animations
    if (!this.observer) {
      this.observer = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        {
          threshold: 0.1,
          rootMargin: "50px 0px -50px 0px",
        }
      );
    }

    // Observe all slide elements
    slideElements.forEach((element) => {
      if (!element.hasAttribute("data-observed")) {
        this.observer.observe(element);
        element.setAttribute("data-observed", "true");
      }
    });
  }

  setupMutationObserver() {
    // Watch for dynamically added gallery items
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node or its children have slide classes
            const slideElements =
              node.matches &&
              node.matches(".slide-in-left, .slide-in-right, .slide-in-bottom")
                ? [node]
                : node.querySelectorAll
                ? node.querySelectorAll(
                    ".slide-in-left, .slide-in-right, .slide-in-bottom"
                  )
                : [];

            if (slideElements.length > 0) {
              // Small delay to ensure DOM is ready
              setTimeout(() => {
                this.observeAnimationElements();
                this.triggerInitialAnimations();
              }, 100);
            }
          }
        });
      });
    });

    // Start observing
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  handleIntersection(entries) {
    entries.forEach((entry) => {
      if (
        entry.isIntersecting &&
        !this.animatedElements.includes(entry.target)
      ) {
        this.triggerAnimation(entry.target);
      }
    });
  }

  triggerAnimation(element) {
    // Add to animated elements to prevent re-animation
    this.animatedElements.push(element);

    // Check if this is a gallery item with an image that needs to load first
    const img = element.querySelector("img");
    if (img && !img.classList.contains("loaded")) {
      // Wait for image to load before animating
      if (img.complete && img.naturalHeight !== 0) {
        // Image is already loaded
        img.classList.add("loaded");
        this.startAnimation(element);
      } else {
        // Wait for image to load
        img.onload = () => {
          img.classList.add("loaded");
          this.startAnimation(element);
        };
      }
    } else {
      // No image or image already loaded, animate immediately
      this.startAnimation(element);
    }
  }

  startAnimation(element) {
    // Force reflow to ensure the animation starts
    element.offsetHeight;

    // Add animation class
    if (!element.classList.contains("animate")) {
      element.classList.add("animate");
    }
  }

  triggerInitialAnimations() {
    // Trigger animations for elements already in viewport
    const slideElements = document.querySelectorAll(
      ".slide-in-left, .slide-in-right, .slide-in-bottom"
    );

    slideElements.forEach((element) => {
      if (!this.animatedElements.includes(element)) {
        const rect = element.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight && rect.bottom > 0;

        if (isInView) {
          // Add small delay for staggered effect
          const delayMatch = element.className.match(/slide-in-delay-(\d+)/);
          const baseDelay = delayMatch ? parseInt(delayMatch[1]) * 100 : 100;

          setTimeout(() => {
            this.triggerAnimation(element);
          }, baseDelay);
        }
      }
    });
  }
}

// Initialize animation controller when script loads
const slideAnimationController = new SlideAnimationController();

// Export for potential external use
window.SlideAnimationController = SlideAnimationController;
