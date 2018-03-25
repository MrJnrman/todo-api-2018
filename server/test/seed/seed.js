const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');


const {Todo} = require('../../models/todo');
const {User} = require('../../models/user');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();

const users = [{
    _id: userOneId,
    email: 'jamel@gmail.com',
    password: 'password123',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id: userOneId, access: 'auth'}, process.env.JWT_SECRET).toString(),
    }]
}, {
    _id: userTwoId,
    email: 'ashley@gmail.com',
    password: 'password234',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id: userTwoId, access: 'auth'}, process.env.JWT_SECRET).toString(),
    }]
}];

const todos = [{
    _id: new ObjectID(),
    text: 'Get lunch',
    _creator: userOneId
},{
    _id: new ObjectID(),
    text: 'Brush teeth',
    completed: true,
    completedAt: 777,
    _creator: userTwoId
}];

const populateTodos = (done) => {
    Todo.remove({}).then(() => {
        return Todo.insertMany(todos);
    }).then(() => done());
};

const populateUsers = (done) => {
    User.remove({}).then(() => {
        var userOne = new User(users[0]).save();
        var userTwo = new User(users[1]).save();

        return Promise.all([userOne, userTwo]);
    }).then(() => done());
};

module.exports = {todos, populateTodos, users, populateUsers};