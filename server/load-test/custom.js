const faker = require('faker');

module.exports.getChatData = (userContext, event, next) => {
  userContext.vars.name = faker.name.findName();
  userContext.vars.greeting = `Hello! I'm from ${faker.address.city()}`;
  next();
};