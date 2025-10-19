export const logger = {
    log(...args) {
        // Always show general logs
        // eslint-disable-next-line no-console
        console.log(...args);
    },
    isDebug() {
        try {
            if (typeof window !== 'undefined' && window.DEBUG) return true;
        } catch (e) {}
        try {
            if (typeof process !== 'undefined' && process.env && process.env.DEBUG) return true;
        } catch (e) {}
        return false;
    },
    debug(...args) {
        if (this.isDebug()) {
            // eslint-disable-next-line no-console
            console.log(...args);
        }
    },
    info(...args) {
        // eslint-disable-next-line no-console
        console.info(...args);
    },
    warn(...args) {
        // eslint-disable-next-line no-console
        console.warn(...args);
    },
    error(...args) {
        // eslint-disable-next-line no-console
        console.error(...args);
    }
};
// Default export for convenience in existing code that imports default
export default logger;
