/**
 * Base Gallery Class
 * Shared functionality for ImageKit gallery implementations
 */

class BaseGallery {
  constructor(config) {
    this.folder = config.folder;
    this.tags = config.tags;
    this.baseURL = config.baseURL;
    this.thumbnailTransform = config.thumbnailTransform;
    this.fullTransform = config.fullTransform;
    this.apiKey = config.apiKey;
    this.loadingMessage = document.getElementById("loading-message");
    this.images = [];
  }

  async loadImages() {
    console.log("brother");
    try {
      let apiUrl;

      if (this.folder) {
        if (this.tags && this.tags.length > 0) {
          // Use searchQuery to combine folder path and tags
          const tagsQuery = this.tags.map((tag) => `"${tag}"`).join(", ");
          const searchQuery = `path:"/${this.folder}/" AND tags IN [${tagsQuery}]`;
          apiUrl = `https://api.imagekit.io/v1/files?searchQuery=${encodeURIComponent(
            searchQuery
          )}&fileType=image`;
        } else {
          // Fallback to folder only
          apiUrl = `https://api.imagekit.io/v1/files?path=${encodeURIComponent(
            this.folder
          )}&includeFolder=false&fileType=image`;
        }
      } else if (this.tags && this.tags.length > 0) {
        // Fallback to tags only
        const tagsQuery = this.tags.join(",");
        apiUrl = `https://api.imagekit.io/v1/files?tags=${encodeURIComponent(
          tagsQuery
        )}&includeFolder=false&fileType=image`;
      } else {
        return;
      }

      console.log("Fetching images from API:", apiUrl);
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

      this.images = imageFiles;
      this.hideLoadingMessage();
      this.renderGallery(imageFiles);
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

  generateAltText(filename) {
    return filename
      .replace(/\.[^/.]+$/, "") // Remove extension
      .replace(/[-_]/g, " ") // Replace hyphens and underscores with spaces
      .trim();
  }

  hideLoadingMessage() {
    if (this.loadingMessage) {
      this.loadingMessage.style.display = "none";
    }
  }

  showNoImagesMessage() {
    if (this.loadingMessage) {
      this.loadingMessage.innerHTML =
        '<p class="text-white">No images found in this album.</p>';
    }
  }

  showErrorMessage(message) {
    if (this.loadingMessage) {
      this.loadingMessage.innerHTML = `<p class="text-red-400">Failed to load album images: ${message}</p>`;
    }
  }

  // Abstract method - must be implemented by subclasses
  renderGallery(imageFiles) {
    throw new Error("renderGallery method must be implemented by subclass");
  }
}

/**
 * Configuration Helper
 * Centralizes gallery configuration logic
 */
class GalleryConfig {
  static get() {
    const globalConfig = window.imagekitConfig || {};
    const localConfig = window.galleryConfig || {};

    return {
      folder: localConfig.folder || "",
      tags: localConfig.tags || [],
      baseURL: globalConfig.baseURL || localConfig.baseURL || "",
      thumbnailTransform:
        globalConfig.thumbnailTransform || localConfig.thumbnailTransform || "",
      fullTransform:
        globalConfig.fullTransform || localConfig.fullTransform || "",
      apiKey: globalConfig.apiKey || localConfig.apiKey || "",
    };
  }

  static validate(config) {
    if (!config.apiKey) {
      console.warn(
        "ImageKit API key not configured. Images will not load. Please check PHOTOGRAPHY_SETUP.md for configuration instructions."
      );
      const loadingMessage = document.getElementById("loading-message");
      if (loadingMessage) {
        loadingMessage.innerHTML =
          '<p class="text-yellow-400">⚠️ ImageKit API key not configured. Please check the setup documentation.</p>';
      }
      return false;
    }

    return true;
  }
}
