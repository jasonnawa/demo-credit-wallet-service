/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('transactions', (table) => {
    table.increments('id').primary();
    table.integer('wallet_id').unsigned().notNullable().references('id').inTable('wallets');
    table.enum('type', ['FUND', 'TRANSFER', 'WITHDRAW']).notNullable();
    table.enum('direction', ['CREDIT', 'DEBIT']).notNullable();
    table.decimal('amount', 12, 2).notNullable();
    table.enum('status', ['PENDING', 'SUCCESS', 'FAILED']).notNullable().defaultTo('PENDING');
    table.string('description').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTable('transactions');
};
