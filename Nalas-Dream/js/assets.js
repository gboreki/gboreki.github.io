const Assets = {
    images: {},
    loaded: false,

    imageList: [
        { key: 'chihuahua', src: 'assets/images/chihuahua.png' },
        { key: 'bone-treat', src: 'assets/images/bone-treat.png' },
        { key: 'chew-toy', src: 'assets/images/chew-toy.png' },
        { key: 'ball', src: 'assets/images/ball.png' },
        { key: 'stuffed-animal', src: 'assets/images/stuffed-animal.png' },
        { key: 'rubber-ducky', src: 'assets/images/rubber-ducky.png' },
        { key: 'sock', src: 'assets/images/sock.png' },
        { key: 'enemy-projectile', src: 'assets/images/enemy-projectile.png' },
        { key: 'pillow', src: 'assets/images/pillow.png' }
    ],

    removeBackground(img) {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const threshold = 230;

        const corners = [
            { x: 0, y: 0 },
            { x: canvas.width - 1, y: 0 },
            { x: 0, y: canvas.height - 1 },
            { x: canvas.width - 1, y: canvas.height - 1 }
        ];

        let bgR = 0, bgG = 0, bgB = 0, count = 0;
        for (const c of corners) {
            const i = (c.y * canvas.width + c.x) * 4;
            bgR += data[i];
            bgG += data[i + 1];
            bgB += data[i + 2];
            count++;
        }
        bgR = Math.round(bgR / count);
        bgG = Math.round(bgG / count);
        bgB = Math.round(bgB / count);

        const isLightBg = bgR > threshold && bgG > threshold && bgB > threshold;
        if (!isLightBg) {
            return img;
        }

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const dist = Math.sqrt(
                (r - bgR) ** 2 +
                (g - bgG) ** 2 +
                (b - bgB) ** 2
            );

            if (dist < 45) {
                data[i + 3] = 0;
            } else if (dist < 80) {
                data[i + 3] = Math.round((dist - 45) / 35 * 255);
            }
        }

        ctx.putImageData(imageData, 0, 0);

        const newImg = new Image();
        newImg.src = canvas.toDataURL('image/png');
        return newImg;
    },

    load() {
        return new Promise((resolve) => {
            let loadedCount = 0;
            const total = this.imageList.length;

            this.imageList.forEach(item => {
                const img = new Image();
                img.onload = () => {
                    this.images[item.key] = this.removeBackground(img);
                    loadedCount++;
                    if (loadedCount === total) {
                        this.loaded = true;
                        resolve();
                    }
                };
                img.onerror = () => {
                    console.warn(`Failed to load: ${item.src}`);
                    loadedCount++;
                    if (loadedCount === total) {
                        this.loaded = true;
                        resolve();
                    }
                };
                img.src = item.src;
            });
        });
    },

    get(key) {
        return this.images[key];
    }
};
