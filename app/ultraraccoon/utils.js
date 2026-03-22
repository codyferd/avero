const TextureUtils = {
    /**
     * Removes #000000 from a texture and replaces it with transparency.
     * @param {Phaser.Scene} scene
     * @param {string} key - The texture key to fix (e.g., 'run')
     */
    makeTransparent: (scene, key) => {
        const source = scene.textures.get(key).getSourceImage();
        const canvas = scene.textures.createCanvas(key + '_clean', source.width, source.height);
        const context = canvas.getContext();

        // Draw original image to the hidden canvas
        context.drawImage(source, 0, 0);

        // Get pixel data
        const imageData = context.getImageData(0, 0, source.width, source.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // If it's PURE BLACK (0,0,0), set Alpha to 0
            if (r === 0 && g === 0 && b === 0) {
                data[i + 3] = 0;
            }
            // If it's almost black but meant to be visible, ensure it's (1,1,1)
            else if (r < 2 && g < 2 && b < 2) {
                data[i] = 1;
                data[i+1] = 1;
                data[i+2] = 1;
            }
        }

        context.putImageData(imageData, 0, 0);
        canvas.refresh();
        return key + '_clean';
    }
};
