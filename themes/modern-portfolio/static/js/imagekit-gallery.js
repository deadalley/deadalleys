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
    this.filteredImages = [];
    this.filterTags = config.filterTags || [];
    this.selectedTag = null;
    this.initializeCarousel();
  }

  renderGallery(imageFiles, clearFirst = true) {
    if (!this.galleryGrid) return;

    if (clearFirst) {
      this.galleryGrid.innerHTML = "";
      this.imageFiles = [];
    }

    this.imageFiles = this.imageFiles.concat(imageFiles);
    this.createGalleryItems(imageFiles);
  }

  renderFilterChips() {
    const chipsContainer = document.getElementById("filter-chips-container");
    if (!chipsContainer) return;

    chipsContainer.innerHTML = "";

    // Always create "All" chip
    const allChip = document.createElement("button");
    allChip.className = "filter-chip active";
    allChip.textContent = "All";
    allChip.dataset.tag = "all";
    allChip.addEventListener("click", () => {
      this.selectedTag = null;
      this.filteredImages = [...this.allImages];
      this.displayedCount = 0;
      this.imageFiles = [];
      this.galleryGrid.innerHTML = "";
      this.currentImageIndex = 0;
      this.updateChipStates();
      this.loadMore();
    });
    chipsContainer.appendChild(allChip);

    // Render filter tags if specified
    if (this.filterTags && this.filterTags.length > 0) {
      this.filterTags.forEach((tag) => {
        const chip = document.createElement("button");
        chip.className = "filter-chip";
        chip.textContent = tag;
        chip.dataset.tag = tag;

        chip.addEventListener("click", () => {
          this.filterByTag(tag);
        });

        chipsContainer.appendChild(chip);
      });
    }
  }

  updateChipStates() {
    document.querySelectorAll(".filter-chip").forEach((chip) => {
      const tagValue = chip.dataset.tag;
      if (tagValue === "all") {
        chip.classList.toggle("active", this.selectedTag === null);
      } else {
        chip.classList.toggle("active", this.selectedTag === tagValue);
      }
    });
  }

  filterByTag(tag) {
    // Toggle selection
    if (this.selectedTag === tag) {
      this.selectedTag = null;
      this.filteredImages = [...this.allImages];
    } else {
      this.selectedTag = tag;
      this.filteredImages = this.allImages.filter(
        (image) => image.tags && image.tags.includes(tag),
      );
    }

    // Reload gallery with filtered images
    this.displayedCount = 0;
    this.imageFiles = [];
    this.galleryGrid.innerHTML = "";
    this.currentImageIndex = 0;
    this.updateChipStates();
    this.loadMore();
  }

  async loadImages() {
    await super.loadImages();
    this.renderFilterChips();
  }

  loadMore() {
    console.log("loadmore");
    const endIndex = this.displayedCount + this.imagesPerLoad;
    const newImages = this.filteredImages.slice(this.displayedCount, endIndex);

    if (newImages.length > 0) {
      this.renderGallery(newImages, false); // false = append, don't clear
      this.displayedCount = endIndex;
    }

    this.updateLoadMoreButton();
  }

  updateLoadMoreButton() {
    const loadMoreBtn = document.getElementById("load-more-btn");
    if (!loadMoreBtn) return;

    // Use filteredImages for load-more button logic
    if (this.displayedCount >= this.filteredImages.length) {
      loadMoreBtn.style.display = "none";
    } else {
      loadMoreBtn.style.display = "inline-block";
      loadMoreBtn.onclick = () => this.loadMore();
    }
  }

  createGalleryItems(imageFiles) {
    const startIndex = this.imageFiles.length - imageFiles.length;
    imageFiles.forEach((file, index) => {
      const galleryItem = this.createGalleryItem(file, index);
      this.galleryGrid.appendChild(galleryItem);
    });
  }

  createGalleryItem(file, batchIndex) {
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
    const delayClass = delayClasses[batchIndex % delayClasses.length];

    galleryItem.className = `gallery-item slide-in-bottom ${delayClass}`;
    galleryItem.style.cursor = "pointer";

    // Store file reference for carousel mapping
    galleryItem.dataset.fileId = file.fileId;

    // Add click handler for carousel
    galleryItem.addEventListener("click", () => {
      // Find the index of this file in filteredImages
      const carouselIndex = this.filteredImages.findIndex(
        (img) => img.fileId === file.fileId,
      );
      if (carouselIndex !== -1) {
        this.openCarousel(carouselIndex);
      }
    });

    const img = document.createElement("img");
    img.src = this.applyTransform(file.url, this.thumbnailTransform);
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
    window.openCarousel = (index) => this.openCarousel(index);
    window.closeCarousel = () => this.closeCarousel();
    window.nextImage = () => this.nextImage();
    window.prevImage = () => this.prevImage();

    document.addEventListener("keydown", (e) => {
      const carousel = document.getElementById("image-carousel");
      if (carousel && carousel.style.display === "flex") {
        if (e.key === "Escape") this.closeCarousel();
        if (e.key === "ArrowLeft") this.prevImage();
        if (e.key === "ArrowRight") this.nextImage();
      }
    });
  }

  openCarousel(index) {
    if (!this.filteredImages || this.filteredImages.length === 0) return;

    this.currentImageIndex = index;
    const carousel = document.getElementById("image-carousel");
    const carouselImage = document.getElementById("carousel-image");
    const carouselCounter = document.getElementById("carousel-counter");
    const loadingSpinner = document.getElementById("carousel-loading");

    if (!carousel || !carouselImage || !carouselCounter) return;

    const currentFile = this.filteredImages[this.currentImageIndex];

    if (loadingSpinner) loadingSpinner.classList.add("active");
    carouselImage.style.opacity = "0";

    carouselImage.onload = () => {
      if (loadingSpinner) loadingSpinner.classList.remove("active");
      carouselImage.style.opacity = "1";
    };

    carouselImage.src = this.applyTransform(
      currentFile.url,
      this.fullTransform,
    );
    carouselImage.alt = this.generateAltText(currentFile.name);
    carouselCounter.textContent = `${this.currentImageIndex + 1} / ${
      this.filteredImages.length
    }`;

    carousel.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  closeCarousel() {
    const carousel = document.getElementById("image-carousel");
    if (carousel) {
      carousel.style.display = "none";
      document.body.style.overflow = "auto";
    }
  }

  nextImage() {
    if (!this.filteredImages || this.filteredImages.length === 0) return;

    this.currentImageIndex =
      (this.currentImageIndex + 1) % this.filteredImages.length;
    this.updateCarouselImage();
  }

  prevImage() {
    if (!this.filteredImages || this.filteredImages.length === 0) return;

    this.currentImageIndex =
      this.currentImageIndex === 0
        ? this.filteredImages.length - 1
        : this.currentImageIndex - 1;
    this.updateCarouselImage();
  }

  updateCarouselImage() {
    const carouselImage = document.getElementById("carousel-image");
    const carouselCounter = document.getElementById("carousel-counter");
    const loadingSpinner = document.getElementById("carousel-loading");

    if (!carouselImage || !carouselCounter) return;

    const currentFile = this.filteredImages[this.currentImageIndex];
    if (!currentFile) return;

    if (loadingSpinner) loadingSpinner.classList.add("active");
    carouselImage.style.opacity = "0";

    carouselImage.onload = () => {
      if (loadingSpinner) loadingSpinner.classList.remove("active");
      carouselImage.style.opacity = "1";
    };

    carouselImage.src = this.applyTransform(
      currentFile.url,
      this.fullTransform,
    );
    carouselImage.alt = this.generateAltText(currentFile.name);
    carouselCounter.textContent = `${this.currentImageIndex + 1} / ${
      this.filteredImages.length
    }`;
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
