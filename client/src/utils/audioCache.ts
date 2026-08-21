export const audioCache = {
  CACHE_NAME: 'quran-audio-cache-v1',

  async isSurahCached(server: string, surahNumber: number, verseCount: number): Promise<boolean> {
    try {
      const cache = await caches.open(this.CACHE_NAME);
      const sNum = surahNumber.toString().padStart(3, '0');
      // If we have the first and last, we likely have the whole Surah.
      const firstUrl = `${server}/${sNum}001.mp3`;
      const lastUrl = `${server}/${sNum}${verseCount.toString().padStart(3, '0')}.mp3`;
      
      const res1 = await cache.match(firstUrl);
      const res2 = await cache.match(lastUrl);
      
      return !!(res1 && res2);
    } catch {
      return false;
    }
  },

  async downloadSurah(server: string, surahNumber: number, verseCount: number, onProgress: (loaded: number, total: number) => void): Promise<void> {
    const cache = await caches.open(this.CACHE_NAME);
    const sNum = surahNumber.toString().padStart(3, '0');
    
    // Concurrency limit for downloading (e.g. 5 at a time)
    let loaded = 0;
    const urls = Array.from({ length: verseCount }, (_, i) => {
      const vNum = (i + 1).toString().padStart(3, '0');
      return `${server}/${sNum}${vNum}.mp3`;
    });

    // Batch download to avoid blocking the network entirely
    const batchSize = 5;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      await Promise.all(batch.map(async (url) => {
        const exists = await cache.match(url);
        if (!exists) {
          try {
            const response = await fetch(url, { mode: 'cors' });
            if (response.ok) {
              await cache.put(url, response);
            }
          } catch (err) {
            console.error("Failed to download", url, err);
          }
        }
        loaded++;
        onProgress(loaded, verseCount);
      }));
    }
  },

  async deleteSurah(server: string, surahNumber: number, verseCount: number): Promise<void> {
    try {
      const cache = await caches.open(this.CACHE_NAME);
      const sNum = surahNumber.toString().padStart(3, '0');
      for (let i = 1; i <= verseCount; i++) {
        const vNum = i.toString().padStart(3, '0');
        await cache.delete(`${server}/${sNum}${vNum}.mp3`);
      }
    } catch {}
  },

  async getAudioUrl(url: string): Promise<string> {
    try {
      if (!('caches' in window)) return url;
      const cache = await caches.open(this.CACHE_NAME);
      const response = await cache.match(url);
      if (response) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (e) {
      console.error(e);
    }
    return url; // fallback to network
  }
};
