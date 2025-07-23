// src/database/knexfile.js
const path = require('path');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

/** @type {import('knex').Knex.Config} */
const knexConfig = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      port: +(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
    },
    seeds: {
      directory: path.resolve(__dirname, 'seeds'),
    },
  },
};

module.exports = knexConfig;
