const {User} = require('./../models/user');
var authenticate = (req, res, next) => {
    var token = req.header('x-auth');

    User.findByToken(token).then((user) => {
        if (!User) {
            return Promise.reject('Not found');
        }

        req.user = user;
        req.token = token;
        next();
    }).catch((err) => {
        res.status(401).send({err})
    })
};

module.exports = {authenticate};