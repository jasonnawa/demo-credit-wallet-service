exports.up = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.integer('remote_user_id').notNullable().unique();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.dropColumn('remote_user_id');
  });
};
