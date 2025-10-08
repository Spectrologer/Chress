// Centralized logger module to handle all logging operations
const logger = {
  log: (...args) => console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
  info: (...args) => console.info(...args),
  debug: (...args) => console.debug(...args),
  table: (...data) => console.table(...data),
  trace: (...args) => console.trace(...args),
  help: () => {
  }
};

export default logger;
