var request = require('supertest');
var expect = require('expect');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');
const {todos, populateTodos} = require('./seed/seed');
const {users, populateUsers} = require('./seed/seed');


beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {
    it('should create a new todo', (done) => {
        var text = 'Testing todo text';

       request(app)
        .post('/todos')
        .send({text})
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .expect((res) => {
            expect(res.body.text).toBe(text);
        })
        .end((err, res) => {
            if (err) return done(err)

            Todo.find({text}).then((todos) => {
                expect(todos.length).toBe(1);
                expect(todos[0].text).toBe(text);
                done()
            }).catch((err) => done(err));
        });
    });

    it('should not create todo with invalid body data', (done) => {
        request(app)
            .post('/todos')
            .set('x-auth', users[0].tokens[0].token)
            .send({})
            .expect(400)
            .end((err, res) => {
                if (err) return done(err)

                Todo.find().then((todos) => {
                    expect(todos.length).toBe(2);
                    done();
                }).catch((err) => done(err));
            })
    });
});

describe('GET /todos', () => {
    it('should get all todos', (done) => {
        request(app)
            .get('/todos')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todos.length).toBe(1);
            })
            .end(done);
    })
});

describe('GET /todos/:id', () => {
    it('should return todo doc', (done) => {
        request(app)
            .get(`/todos/${todos[0]._id.toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(todos[0].text)
            })
            .end(done)
    });

    it('should return a 404 if todo not found', (done) => {
        request(app)
            .get(`/todos/${(new ObjectID).toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done)
    });

    it('should return 404 for non-object ids', (done) => {
        request(app)
            .get('/todos/123abc')
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done)
    });

    it('should return not return a todo doc created by other user', (done) => {
        request(app)
            .get(`/todos/${todos[1]._id.toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });
});

describe('DELETE /todos/:id', () => {
    it('should remove todo', (done) => {
        request(app)
            .delete(`/todos/${todos[0]._id.toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(todos[0].text)
            })
            .end((err, res) => {
                if (err) return done(err)

                Todo.find().then((todos) => {
                    expect(todos.length).toBe(1);
                    done();
                }).catch((err) => done(err));
            })
    });

    it('should not remove todo owned by other user', (done) => {
        request(app)
            .delete(`/todos/${todos[0]._id.toHexString()}`)
            .set('x-auth', users[1].tokens[0].token)
            .expect(404)
            .end((err, res) => {
                if (err) return done(err)

                Todo.find().then((todos) => {
                    expect(todos.length).toBe(2);
                    done();
                }).catch((err) => done(err));
            })
    });

    it('should return a 404 if todo not found', (done) => {
        request(app)
            .get(`/todos/${(new ObjectID).toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end((err, res) => {
                if (err) return done(err)

                Todo.find().then((todos) => {
                    expect(todos.length).toBe(2);
                    done();
                }).catch((err) => done(err));
            })
    })

    it('should return 404 for non-object ids', (done) => {
        request(app)
            .get('/todos/123abc')
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end((err, res) => {
                if (err) return done(err)

                Todo.find().then((todos) => {
                    expect(todos.length).toBe(2);
                    done();
                }).catch((err) => done(err));
            })
    });
});

describe('POST /todos/:id', () => {
    it('should update the todo', (done) => {
        var text = 'update test'
        var completed = true

        request(app)
            .patch(`/todos/${todos[0]._id.toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .send({text, completed})
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(text)
                expect(res.body.todo.completed).toBe(completed)

            })
            .end(done)
    });

    it('should clear completedAt when todo is not completed', (done) => {
        var text = 'update test 2'
        var completed = false

        request(app)
            .patch(`/todos/${todos[1]._id.toHexString()}`)
            .set('x-auth', users[1].tokens[0].token)
            .send({text, completed})
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(text);
                expect(res.body.todo.completed).toBe(completed);
                expect(res.body.todo.completedAt).toNotExist;
            })
            .end(done);
    });

    it('should not clear completedAt for todo of other user', (done) => {
        var text = 'update test 2'
        var completed = false

        request(app)
            .patch(`/todos/${todos[1]._id.toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .send({text, completed})
            .expect(400)
            .end(done);
    });
});

describe('GET /users/me', () => {
    it('should return user if authenticated', (done) => {
        request(app)
            .get('/users/me')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body._id).toBe(users[0]._id.toHexString());
                expect(res.body.email).toBe(users[0].email);

            })
            .end(done);
    });

    it('shoudld return a 401 if not authenticated', (done) => {
        request(app)
            .get('/users/me')
            .expect(401)
            .end(done);
    });
});

describe('POST /users', () => {
    it('should create a user', (done) => {
        var email = 'example@example.com';
        var password = 'password111';

        request(app)
            .post('/users')
            .send({email, password})
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toExist;
                expect(res.body._id).toExist;
                expect(res.body.email).toBe(email);
            })
            .end((err) => {
                if (err) {
                    return done(err);
                }

                User.findOne({email}).then((user) => {
                    expect(user.email).toExist;
                    expect(user.email).not.toBe(password);
                    done();
                }, (err) => {
                    done(err);
                });

            });
    });

    it('should return validation erros if request invalid', (done) => {
        var email = 'blah';
        var password = 12344;

        request(app)
            .post('/users')
            .send({email, password})
            .expect(400)
            .end(done);
    });

    it('should not create user if email in use', (done) => {
        var email = users[0].email
        var password = users[0].password
        request(app)
            .post('/users')
            .send({email, password})
            .expect(400)
            .end(done);
    });
});


describe('POST /users/login', () => {
    it('should login user and return auth token', (done) => {
        request(app)
            .post('/users/login')
            .send({
                email: users[1].email,
                password: users[1].password
            })
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toExist;
            })
            .end((err, res) => {
                if(err) {
                    return done(err)
                }

                User.findById(users[1]._id).then((user) => {
                    expect(user.tokens[1]).toHaveProperty('access', 'auth');
                    expect(user.tokens[1]).toHaveProperty('token', res.headers['x-auth']);
                    done();
                }).catch((err) => done(err));
            });
    });

    it('should reject invalid login', () => {
        request(app)
            .post('/users/login')
            .send({
                email: users[1].email,
                password: users[1].password
            })
            .expect(400)
            .expect((res) => {
                expect(res.headers['x-auth']).toNotExist;
            })
            .end((err, res) => {
                if(err) {
                    return done(err)
                }

                User.findById(users[1]._id).then((user) => {
                    expect(user.tokens.length).toBe(0);
                    done();
                }).catch((err) => done(err));
            });
    });
});


describe('DELETE /users/me/token', () => {
    it('should remove auth token on logout', (done) => {
        request(app)
            .delete('/users/me/token')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .end((err, res) => {
                if(err) {
                    return done(err)
                }

                User.findById(users[1]._id).then((user) => {
                    expect(user.tokens.length).toBe(1);
                    done();
                }).catch((err) => done(err));
            });
    });
});