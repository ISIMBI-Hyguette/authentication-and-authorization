const Joi = require('joi');

const userSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

function validateData(data) {
  return userSchema.validate(data);
}

module.exports = {
    validateData,
   };