/**
 * Avero Mesh Utilities
 * Pure helper functions for formatting, validation, and file IO.
 */

const Utils = {
    /**
     * Validates and cleans Room IDs (Alphanumeric only)
     * @param {string} id
     * @returns {string}
     */
    cleanRoomId(id) {
        return id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    },

    /**
     * Formats a Unix timestamp into a readable 24h string
     * @param {number} ts
     * @returns {string}
     */
    formatTime(ts) {
        if (!ts) return '';
        return new Date(ts).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    },

    /**
     * Generates a random alphanumeric ID for messages
     * @returns {string}
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    },

    /**
     * Converts a File object to a Base64 string for Mesh transfer
     * @param {File} file
     * @returns {Promise<string>}
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    },

    /**
     * Filters and exports chat logs as a JSON file
     * Strips images to keep file sizes manageable.
     * @param {Array} messages
     * @param {string} roomId
     */
    exportJsonLogs(messages, roomId) {
        // Remove image data before stringifying
        const textOnly = messages.filter(m => !m.image && m.sender !== 'SYS');

        const dataStr = JSON.stringify(textOnly, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `avero_mesh_${roomId || 'export'}_${Date.now()}.json`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up memory
        setTimeout(() => URL.revokeObjectURL(url), 100);
    },

    /**
     * Simple system message generator
     * @param {string} text
     * @returns {Object}
     */
    createSysMsg(text) {
        return {
            sender: 'SYS',
            text: text,
            time: Date.now(),
            id: 'sys-' + Date.now()
        };
    }
};

// Export for non-ESM usage (standard script tag)
window.Utils = Utils;
