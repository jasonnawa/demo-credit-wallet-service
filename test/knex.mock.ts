export function getMockKnex() {
  const queryBuilder = {
    insert: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    first: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    raw:jest.fn().mockReturnThis() 
  };

  const knex = jest.fn(() => queryBuilder); // simulates calling knex('users')
  Object.assign(knex, queryBuilder);        // support knex.insert() style too
  return knex;
}
