/**
 * Simple Grid Gallery with Carousel
 * CSS Grid layout that maintains aspect ratios
 */

class GridGallery extends BaseGallery {
  constructor(config) {
    super(config);
    this.container = document.getElementById("masonry-gallery");
    this.currentIndex = 0;
  }

  renderGallery(imageFiles, clearFirst = true) {
    if (!this.container) return;

    if (clearFirst) {
      this.container.innerHTML = "";
    }

    this.createGridLayout(imageFiles, !clearFirst);
  }

  hideLoadingMessage() {
    super.hideLoadingMessage();
    if (this.container) {
      this.container.style.display = "grid";
    }
  }

  createGridLayout(imageFiles, append = false) {
    if (!append) {
      this.container.className = "grid-gallery";
    }

    const startIndex = append ? this.images.length : 0;
    imageFiles.forEach((file, index) => {
      const item = this.createGridItem(file, startIndex + index);
      this.container.appendChild(item);
    });

    if (append) {
      this.images = this.images.concat(imageFiles);
    } else {
      this.images = imageFiles;
    }
  }

  createGridItem(file, index) {
    const item = document.createElement("div");
    item.className = "grid-item";
    item.style.opacity = "0";
    item.style.transform = "translateY(20px)";
    item.style.transition = "opacity 0.3s ease, transform 0.3s ease";

    const img = document.createElement("img");
    img.src = this.applyTransform(file.url, this.thumbnailTransform);
    img.alt = this.generateAltText(file.name);
    img.loading = "lazy";

    // Handle image load success
    img.onload = () => {
      setTimeout(() => {
        item.style.opacity = "1";
        item.style.transform = "translateY(0)";
      }, index * 50);
    };

    // Add click handler for carousel
    item.addEventListener("click", () => {
      this.openCarousel(index);
    });

    item.appendChild(img);
    return item;
  }

  // Carousel functionality
  openCarousel(index) {
    this.currentIndex = index;
    const carousel = document.getElementById("image-carousel");

    carousel.style.display = "flex";
    document.body.style.overflow = "hidden";

    this.updateCarouselImage();
    this.addKeyboardNavigation();
  }

  updateCarouselImage() {
    const carouselImage = document.getElementById("carousel-image");
    const counter = document.getElementById("carousel-counter");
    const currentImage = this.allImages[this.currentIndex];

    carouselImage.src = this.applyTransform(
      currentImage.url,
      this.fullTransform
    );
    carouselImage.alt = this.generateAltText(currentImage.name);
    counter.textContent = `${this.currentIndex + 1} / ${this.allImages.length}`;
  }

  addKeyboardNavigation() {
    this.keyHandler = (e) => {
      switch (e.key) {
        case "ArrowLeft":
          this.prevImage();
          break;
        case "ArrowRight":
          this.nextImage();
          break;
        case "Escape":
          this.closeCarousel();
          break;
      }
    };

    document.addEventListener("keydown", this.keyHandler);
  }

  removeKeyboardNavigation() {
    if (this.keyHandler) {
      document.removeEventListener("keydown", this.keyHandler);
      this.keyHandler = null;
    }
  }

  prevImage() {
    this.currentIndex =
      (this.currentIndex - 1 + this.allImages.length) % this.allImages.length;
    this.updateCarouselImage();
  }

  nextImage() {
    this.currentIndex = (this.currentIndex + 1) % this.allImages.length;
    this.updateCarouselImage();
  }

  closeCarousel() {
    const carousel = document.getElementById("image-carousel");
    carousel.style.display = "none";
    document.body.style.overflow = "auto";
    this.removeKeyboardNavigation();
  }
}

// Global carousel functions for backwards compatibility
function closeCarousel() {
  if (window.gridGallery) {
    window.gridGallery.closeCarousel();
  }
}

function nextImage() {
  if (window.gridGallery) {
    window.gridGallery.nextImage();
  }
}

function prevImage() {
  if (window.gridGallery) {
    window.gridGallery.prevImage();
  }
}

// Initialize gallery when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("masonry-gallery");
  if (!container) return;

  const config = GalleryConfig.get();

  if (GalleryConfig.validate(config)) {
    window.gridGallery = new GridGallery(config);
    window.gridGallery.loadImages();
  }
});
