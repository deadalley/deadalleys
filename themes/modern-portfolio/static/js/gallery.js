/**
 * Gallery
 * ImageKit Gallery with filtering and carousel functionality
 */

class Gallery {
  constructor(config) {
    this.folder = config.folder;
    this.tags = config.tags;
    this.filterTags = config.filterTags || [];
    this.baseURL = config.baseURL;
    this.thumbnailTransform = config.thumbnailTransform;
    this.fullTransform = config.fullTransform;
    this.apiKey = config.apiKey;

    this.loadingMessage = document.getElementById("loading-message");
    this.galleryGrid = document.querySelector(".gallery-grid");

    this.allImages = [];
    this.filteredImages = [];
    this.imageFiles = [];
    this.displayedCount = 0;
    this.imagesPerLoad = 25;
    this.currentImageIndex = 0;
    this.selectedTag = null;

    this.initializeCarousel();
  }

  async loadImages() {
    try {
      let apiUrl;

      if (this.folder) {
        if (this.tags && this.tags.length > 0) {
          const tagsQuery = this.tags.map((tag) => `"${tag}"`).join(", ");
          const searchQuery = `path:"/${this.folder}/" AND tags IN [${tagsQuery}]`;
          apiUrl = `https://api.imagekit.io/v1/files?searchQuery=${encodeURIComponent(
            searchQuery,
          )}&fileType=image`;
        } else {
          apiUrl = `https://api.imagekit.io/v1/files?path=${encodeURIComponent(
            this.folder,
          )}&includeFolder=false&fileType=image`;
        }
      } else if (this.tags && this.tags.length > 0) {
        const tagsQuery = this.tags.join(",");
        apiUrl = `https://api.imagekit.io/v1/files?tags=${encodeURIComponent(
          tagsQuery,
        )}&includeFolder=false&fileType=image`;
      } else {
        return;
      }

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Basic ${btoa(this.apiKey + ":")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const files = await response.json();
      const imageFiles = this.filterImageFiles(files);

      if (imageFiles.length === 0) {
        this.showNoImagesMessage();
        return;
      }

      imageFiles.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });

      this.allImages = imageFiles;
      this.filteredImages = [...imageFiles];
      this.hideLoadingMessage();
      this.renderFilterChips();
      this.loadMore();
    } catch (error) {
      console.error("Error loading gallery images:", error);
      this.showErrorMessage(error.message);
    }
  }

  filterImageFiles(files) {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    return files.filter(
      (file) =>
        file.fileType === "image" &&
        imageExtensions.some((ext) => file.name.toLowerCase().endsWith(ext)),
    );
  }

  renderFilterChips() {
    const chipsContainer = document.getElementById("filter-chips-container");
    if (!chipsContainer) return;

    chipsContainer.innerHTML = "";

    const allChip = document.createElement("button");
    allChip.className = "filter-chip active";
    allChip.textContent = "All";
    allChip.dataset.tag = "all";
    allChip.addEventListener("click", () => {
      this.selectedTag = null;
      this.filteredImages = [...this.allImages];
      this.resetGallery();
    });
    chipsContainer.appendChild(allChip);

    if (this.filterTags && this.filterTags.length > 0) {
      this.filterTags.forEach((tag) => {
        const chip = document.createElement("button");
        chip.className = "filter-chip";
        chip.textContent = tag;
        chip.dataset.tag = tag;
        chip.addEventListener("click", () => this.filterByTag(tag));
        chipsContainer.appendChild(chip);
      });
    }
  }

  filterByTag(tag) {
    if (this.selectedTag === tag) {
      this.selectedTag = null;
      this.filteredImages = [...this.allImages];
    } else {
      this.selectedTag = tag;
      this.filteredImages = this.allImages.filter(
        (image) => image.tags && image.tags.includes(tag),
      );
    }
    this.resetGallery();
  }

  resetGallery() {
    this.displayedCount = 0;
    this.imageFiles = [];
    this.galleryGrid.innerHTML = "";
    this.currentImageIndex = 0;
    this.updateChipStates();
    this.loadMore();
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

  loadMore() {
    if (this.filteredImages.length === 0) return;

    const endIndex = this.displayedCount + this.imagesPerLoad;
    const newImages = this.filteredImages.slice(this.displayedCount, endIndex);

    if (newImages.length > 0) {
      this.renderGallery(newImages);
      this.displayedCount = endIndex;
    }

    this.updateLoadMoreButton();
  }

  renderGallery(imageFiles) {
    if (!this.galleryGrid) return;
    this.imageFiles = this.imageFiles.concat(imageFiles);
    imageFiles.forEach((file, index) => {
      const batchIndex =
        (this.imageFiles.length - imageFiles.length + index) % 6;
      this.galleryGrid.appendChild(this.createGalleryItem(file, batchIndex));
    });
  }

  createGalleryItem(file, batchIndex) {
    const delayClasses = [
      "slide-in-delay-1",
      "slide-in-delay-2",
      "slide-in-delay-3",
      "slide-in-delay-4",
      "slide-in-delay-5",
      "slide-in-delay-6",
    ];

    const galleryItem = document.createElement("div");
    galleryItem.className = `gallery-item slide-in-bottom ${delayClasses[batchIndex]}`;
    galleryItem.style.cursor = "pointer";
    galleryItem.dataset.fileId = file.fileId;

    galleryItem.addEventListener("click", () => {
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
    img.onload = () => img.classList.add("loaded");
    img.onerror = () => galleryItem.remove();

    galleryItem.appendChild(img);
    return galleryItem;
  }

  updateLoadMoreButton() {
    const loadMoreBtn = document.getElementById("load-more-btn");
    if (!loadMoreBtn) return;

    if (this.displayedCount >= this.filteredImages.length) {
      loadMoreBtn.style.display = "none";
    } else {
      loadMoreBtn.style.display = "inline-block";
      loadMoreBtn.onclick = () => this.loadMore();
    }
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

  generateAltText(filename) {
    return filename
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]/g, " ")
      .trim();
  }

  applyTransform(url, transform) {
    if (url.includes("?")) {
      const params = transform.startsWith("?")
        ? transform.substring(1)
        : transform;
      return url + "&" + params;
    }
    return url + transform;
  }

  hideLoadingMessage() {
    if (this.loadingMessage) {
      this.loadingMessage.style.display = "none";
    }
  }

  showNoImagesMessage() {
    if (this.loadingMessage) {
      this.loadingMessage.innerHTML =
        '<p class="text-white">No images found.</p>';
    }
  }

  showErrorMessage(message) {
    if (this.loadingMessage) {
      this.loadingMessage.innerHTML = `<p class="text-red-400">Failed to load images: ${message}</p>`;
    }
  }
}

/**
 * Configuration Helper
 */
class GalleryConfig {
  static get() {
    const localConfig = window.galleryConfig || {};
    return {
      folder: localConfig.folder || "",
      tags: localConfig.tags || [],
      filterTags: localConfig.filterTags || [],
      baseURL: localConfig.baseURL || "",
      thumbnailTransform: localConfig.thumbnailTransform || "",
      fullTransform: localConfig.fullTransform || "",
      apiKey: localConfig.apiKey || "",
    };
  }

  static validate(config) {
    if (!config.apiKey) {
      console.warn("ImageKit API key not configured.");
      const loadingMessage = document.getElementById("loading-message");
      if (loadingMessage) {
        loadingMessage.innerHTML =
          '<p class="text-yellow-400">⚠️ ImageKit API key not configured.</p>';
      }
      return false;
    }
    return true;
  }
}

// Initialize gallery when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  const galleryGrid = document.querySelector(".gallery-grid");
  if (!galleryGrid) return;

  const config = GalleryConfig.get();
  if (GalleryConfig.validate(config)) {
    const gallery = new Gallery(config);
    gallery.loadImages();
  }
});
