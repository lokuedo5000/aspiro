class Aspiro {
  constructor(options = {}) {
    this.folder = options.folder || "/aspiro/phrases";
    this.ext = options.ext || ".json";
    this.phrases = [];
    this.fs = null;
  }

  async loadAllPhrases() {
    try {
      // Detect environment and load files accordingly
      const fileList = await this.getFileList();

      const loadedPhrases = await Promise.all(
        fileList.map(async (file) => {
          // Browser environment
          if (typeof fetch !== "undefined") {
            const response = await fetch(`${this.folder}/${file}`);
            if (!response.ok) {
              throw new Error(`Error loading ${file}: ${response.statusText}`);
            }
            return response.json();
          }

          // Node.js environment
          if (typeof require === "function") {
            this.fs = this.fs || require("fs").promises;
            const path = require("path");
            const filePath = path.join(this.folder, file);
            const content = await this.fs.readFile(filePath, "utf8");
            return JSON.parse(content);
          }

          throw new Error("Unsupported environment");
        })
      );

      this.phrases = loadedPhrases.flat();
      return this.phrases;
    } catch (error) {
      console.error("Error loading phrases:", error);
      throw error;
    }
  }

  random() {
    if (this.phrases.length === 0) {
      console.warn("No phrases loaded. Did you call loadAllPhrases()?");
      return null;
    }

    // Get used phrase indexes from localStorage
    const usedIndexes = this.getUsedIndexes();

    // Find available phrase indexes
    const availableIndexes = this.phrases
      .map((_, index) => index)
      .filter((index) => !usedIndexes.includes(index));

    // Reset if all phrases used
    if (availableIndexes.length === 0) {
      localStorage.removeItem(this.storageKey);
      return this.random();
    }

    // Select random available index
    const randomIndex =
      availableIndexes[Math.floor(Math.random() * availableIndexes.length)];

    // Save used index to localStorage
    this.markIndexAsUsed(randomIndex);

    return this.phrases[randomIndex];
  }

  getUsedIndexes() {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  markIndexAsUsed(index) {
    const usedIndexes = this.getUsedIndexes();
    if (!usedIndexes.includes(index)) {
      usedIndexes.push(index);
      localStorage.setItem(this.storageKey, JSON.stringify(usedIndexes));
    }
  }

  // Optional: Reset used phrases
  reset() {
    localStorage.removeItem(this.storageKey);
  }

  async getFileList() {
    // Browser: return predefined list
    if (typeof window !== "undefined") {
      return ["phrase.row.1.json", "phrase.row.2.json"];
    }

    // Node.js: read directory
    if (typeof require === "function") {
      this.fs = this.fs || require("fs").promises;
      const path = require("path");
      const files = await this.fs.readdir(this.folder);
      return files.filter((file) => file.endsWith(this.ext));
    }

    throw new Error("Unsupported environment");
  }
}

export default Aspiro;
