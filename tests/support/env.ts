// Variables para pruebas: base de datos separada, nunca la de desarrollo.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://reputacion:reputacion@localhost:5432/reputacion_test?schema=public";
process.env.APP_URL = "https://reputacion.test";
process.env.APP_SECRET = "secreto-de-pruebas-0123456789";
process.env.RATE_LIMIT_FEEDBACK_PER_HOUR = "5";
