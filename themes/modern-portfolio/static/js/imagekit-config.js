/**
 * ImageKit Configuration
 * Copy imagekit-config.template.js to this file and add your actual API key
 * This file should be ignored in your .gitignore to keep your API key secure
 */

// Uncomment and configure the following:

window.imagekitConfig = {
  baseURL: "https://ik.imagekit.io/deadalley31",
  apiKey: window.IMAGEKIT_API_KEY || "",
  thumbnailTransform: "?tr=w-400,h-400,c-at_max,q-80,f-auto",
  fullTransform: "?tr=w-1920,q-85,f-auto",
};
