/**
 * ImageKit Gallery Loader
 * Dynamically loads images from ImageKit.io API and creates a responsive gallery with carousel
 */

class ImageKitGallery extends BaseGallery {
  constructor(config) {
    super(config);
    this.galleryGrid = document.querySelector(".gallery-grid");
    this.currentImageIndex = 0;
    this.imageFiles = [];
    this.initializeCarousel();
  }

  renderGallery(imageFiles) {
    if (!this.galleryGrid) return;
    this.imageFiles = imageFiles;
    this.createGalleryItems(imageFiles);
  }

  hideLoadingMessage() {
    super.hideLoadingMessage();
  }

  createGalleryItems(imageFiles) {
    imageFiles.forEach((file, index) => {
      const galleryItem = this.createGalleryItem(file, index);
      this.galleryGrid.appendChild(galleryItem);
    });
  }

  createGalleryItem(file, index) {
    const galleryItem = document.createElement("div");

    // Add slide-in animation classes
    const delayClasses = [
      "slide-in-delay-1",
      "slide-in-delay-2",
      "slide-in-delay-3",
      "slide-in-delay-4",
      "slide-in-delay-5",
      "slide-in-delay-6",
    ];
    const delayClass = delayClasses[index % delayClasses.length];

    galleryItem.className = `gallery-item slide-in-bottom ${delayClass}`;
    galleryItem.style.cursor = "pointer";

    // Add click handler for carousel
    galleryItem.addEventListener("click", () => {
      this.openCarousel(index);
    });

    const img = document.createElement("img");
    img.src = file.url + this.thumbnailTransform;
    img.alt = this.generateAltText(file.name);
    img.loading = "lazy";

    // Handle image load success
    img.onload = () => {
      img.classList.add("loaded");
    };

    // Handle image load error (skip broken images)
    img.onerror = () => {
      galleryItem.remove();
    };

    galleryItem.appendChild(img);
    return galleryItem;
  }

  initializeCarousel() {
    // Add global carousel functions to window object
    window.openCarousel = (index) => this.openCarousel(index);
    window.closeCarousel = () => this.closeCarousel();
    window.nextImage = () => this.nextImage();
    window.prevImage = () => this.prevImage();

    // Add keyboard event listener
    document.addEventListener("keydown", (e) => {
      const carousel = document.getElementById("image-carousel");
      if (carousel && carousel.style.display === "flex") {
        switch (e.key) {
          case "Escape":
            this.closeCarousel();
            break;
          case "ArrowLeft":
            this.prevImage();
            break;
          case "ArrowRight":
            this.nextImage();
            break;
        }
      }
    });
  }

  openCarousel(index) {
    if (!this.imageFiles || this.imageFiles.length === 0) return;

    this.currentImageIndex = index;
    const carousel = document.getElementById("image-carousel");
    const carouselImage = document.getElementById("carousel-image");
    const carouselCounter = document.getElementById("carousel-counter");

    if (carousel && carouselImage && carouselCounter) {
      const currentFile = this.imageFiles[this.currentImageIndex];
      carouselImage.src = currentFile.url + this.fullTransform;
      carouselImage.alt = this.generateAltText(currentFile.name);

      carouselCounter.textContent = `${this.currentImageIndex + 1} / ${
        this.imageFiles.length
      }`;

      carousel.style.display = "flex";
      document.body.style.overflow = "hidden";
    }
  }

  closeCarousel() {
    const carousel = document.getElementById("image-carousel");
    if (carousel) {
      carousel.style.display = "none";
      document.body.style.overflow = "auto";
    }
  }

  nextImage() {
    if (!this.imageFiles || this.imageFiles.length === 0) return;

    this.currentImageIndex =
      (this.currentImageIndex + 1) % this.imageFiles.length;
    this.updateCarouselImage();
  }

  prevImage() {
    if (!this.imageFiles || this.imageFiles.length === 0) return;

    this.currentImageIndex =
      this.currentImageIndex === 0
        ? this.imageFiles.length - 1
        : this.currentImageIndex - 1;
    this.updateCarouselImage();
  }

  updateCarouselImage() {
    const carouselImage = document.getElementById("carousel-image");
    const carouselCounter = document.getElementById("carousel-counter");

    if (
      carouselImage &&
      carouselCounter &&
      this.imageFiles[this.currentImageIndex]
    ) {
      const currentFile = this.imageFiles[this.currentImageIndex];
      carouselImage.src = currentFile.url + this.fullTransform;
      carouselImage.alt = this.generateAltText(currentFile.name);
      carouselCounter.textContent = `${this.currentImageIndex + 1} / ${
        this.imageFiles.length
      }`;
    }
  }

  showNoImagesMessage() {
    if (this.loadingMessage) {
      this.loadingMessage.innerHTML =
        '<p class="text-white">No images found in the Photography folder.</p>';
    }
  }
}

// Initialize gallery when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Check if we're on a gallery page
  const galleryGrid = document.querySelector(".gallery-grid");
  if (!galleryGrid) return;

  const config = GalleryConfig.get();

  if (GalleryConfig.validate(config)) {
    const gallery = new ImageKitGallery(config);
    gallery.loadImages();
  }
});
