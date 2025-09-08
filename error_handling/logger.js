const { createLogger, format, transports } = require("winston")

const {LOG_VARS} = require("../config/logger_config.js");

// Logger de INFO (texto plano)
const infoLogger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.colorize(),
    format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: LOG_VARS.infoLogPath })
  ],
});

// ERROR LOGGER
// -------------------
const errorLogger = createLogger({
  level: "error",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }) // captura stack si es Error
  ),
  transports: [
    // Consola: legible
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp, stack, ...meta }) => {
          if (message instanceof Error) {
            return `[${timestamp}] ${level}: ${message.name} - ${message.message} ${JSON.stringify(meta)}\n${stack}`;
          }
          return `[${timestamp}] ${level}: ${message} ${JSON.stringify(meta)}`;
        })
      )
    }),

    // Archivo: JSON puro
    new transports.File({
      filename: LOG_VARS.errorLogPath,
      format: format.combine(format.json())
    })
  ]
});




module.exports = {infoLogger, errorLogger};