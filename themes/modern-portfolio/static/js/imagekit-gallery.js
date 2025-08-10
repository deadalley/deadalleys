/**
 * ImageKit Gallery Loader
 * Dynamically loads images from ImageKit.io API and creates a responsive gallery
 */

class ImageKitGallery {
  constructor(config) {
    this.folder = config.folder;
    this.baseURL = config.baseURL;
    this.thumbnailTransform = config.thumbnailTransform;
    this.fullTransform = config.fullTransform;
    this.apiKey = config.apiKey;
    this.galleryGrid = document.querySelector(".gallery-grid");
    this.loadingMessage = document.getElementById("loading-message");
  }

  async loadImages() {
    if (!this.folder || !this.galleryGrid) return;

    try {
      const apiUrl = `https://api.imagekit.io/v1/files?path=${encodeURIComponent(
        this.folder
      )}&includeFolder=false`;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Basic ${btoa(this.apiKey + ":")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const files = await response.json();

      // Filter only image files
      const imageFiles = this.filterImageFiles(files);

      if (imageFiles.length === 0) {
        this.showNoImagesMessage();
        return;
      }

      // Remove loading message
      if (this.loadingMessage) {
        this.loadingMessage.remove();
      }

      // Create gallery items
      this.createGalleryItems(imageFiles);
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
        imageExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    );
  }

  createGalleryItems(imageFiles) {
    imageFiles.forEach((file, index) => {
      const galleryItem = this.createGalleryItem(file, index);
      this.galleryGrid.appendChild(galleryItem);
    });
  }

  createGalleryItem(file, index) {
    const galleryItem = document.createElement("a");
    galleryItem.href = file.url + this.fullTransform;
    galleryItem.target = "_blank";
    galleryItem.className = "gallery-item";
    galleryItem.style.opacity = "0";
    galleryItem.style.transform = "translateY(20px)";
    galleryItem.style.transition = "opacity 0.3s ease, transform 0.3s ease";

    const img = document.createElement("img");
    img.src = file.url + this.thumbnailTransform;
    img.alt = this.generateAltText(file.name);
    img.loading = "lazy";

    // Handle image load success
    img.onload = () => {
      setTimeout(() => {
        galleryItem.style.opacity = "1";
        galleryItem.style.transform = "translateY(0)";
      }, index * 100); // Stagger the animations
    };

    // Handle image load error (skip broken images)
    img.onerror = () => {
      galleryItem.remove();
    };

    galleryItem.appendChild(img);
    return galleryItem;
  }

  generateAltText(filename) {
    return filename
      .replace(/\.[^/.]+$/, "") // Remove extension
      .replace(/[-_]/g, " ") // Replace hyphens and underscores with spaces
      .trim();
  }

  showNoImagesMessage() {
    if (this.loadingMessage) {
      this.loadingMessage.innerHTML =
        '<p class="text-white">No images found in the Photography folder.</p>';
    }
  }

  showErrorMessage(message) {
    if (this.loadingMessage) {
      this.loadingMessage.innerHTML = `<p class="text-red-400">Failed to load gallery images: ${message}</p>`;
    }
  }
}

// Initialize gallery when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Check if we're on a gallery page
  const galleryGrid = document.querySelector(".gallery-grid");
  if (!galleryGrid) return;

  // Get configuration from HTML data attributes or global variables
  const config = {
    folder: window.galleryConfig?.folder || "",
    baseURL: window.galleryConfig?.baseURL || "",
    thumbnailTransform: window.galleryConfig?.thumbnailTransform || "",
    fullTransform: window.galleryConfig?.fullTransform || "",
    apiKey: window.galleryConfig?.apiKey || "",
  };

  if (config.folder && config.apiKey) {
    const gallery = new ImageKitGallery(config);
    gallery.loadImages();
  }
});
