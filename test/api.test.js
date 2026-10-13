process.env.JWT_SECRET_KEY_USER = 'test-user-secret';
process.env.JWT_SECRET_KEY_ADMIN = 'test-admin-secret';
process.env.AUTH_RATE_LIMIT = '1000'; // the real default (30 / 15 min) would block the test run

const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const request = require('supertest');

// Replace db.js with the in-memory fake BEFORE the app is loaded
const fakeDb = require('./helpers/fakeDb');
const dbPath = require.resolve(path.join(__dirname, '..', 'db.js'));
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: fakeDb };
const app = require('../app');

const bearer = (token) => ({ Authorization: `Bearer ${token}` });
const person = (email) => ({ email, password: 'correct-horse-9', FirstName: 'Test', LastName: 'Person' });

async function signUpAndIn(role, email) {
    await request(app).post(`/api/${role}/signup`).send(person(email)).expect(201);
    const res = await request(app).post(`/api/${role}/signin`).send({ email, password: 'correct-horse-9' }).expect(200);
    return res.body.token;
}

beforeEach(() => Object.values(fakeDb).forEach((model) => model.reset()));

test('health check answers 200', async () => {
    await request(app).get('/health').expect(200, { ok: true });
});

test('unknown routes answer 404 JSON and bad JSON answers 400', async () => {
    await request(app).get('/nope').expect(404);
    await request(app).post('/api/user/signup').set('Content-Type', 'application/json').send('{bad').expect(400);
});

test('signup validates input and rejects duplicates', async () => {
    await request(app).post('/api/user/signup').send({ ...person('a@b.com'), password: 'short' }).expect(400);
    await request(app).post('/api/user/signup').send({ email: 'not-an-email' }).expect(400);
    await request(app).post('/api/user/signup').send(person('a@b.com')).expect(201);
    await request(app).post('/api/user/signup').send(person('A@B.com')).expect(409); // email is case-insensitive
});

test('REGRESSION: signin rejects a wrong password (bcrypt.compare must be awaited)', async () => {
    await request(app).post('/api/user/signup').send(person('u@x.com')).expect(201);
    await request(app).post('/api/user/signin').send({ email: 'u@x.com', password: 'totally-wrong-pass' }).expect(401);
    await request(app).post('/api/user/signin').send({ email: 'nobody@x.com', password: 'whatever-pass' }).expect(401);

    await request(app).post('/api/admin/signup').send(person('boss@x.com')).expect(201);
    await request(app).post('/api/admin/signin').send({ email: 'boss@x.com', password: 'totally-wrong-pass' }).expect(401);
});

test('signin returns a JWT that expires', async () => {
    const token = await signUpAndIn('user', 'u@x.com');
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY_USER);
    assert.ok(payload.exp > payload.iat, 'token should carry an expiry');
});

test('REGRESSION: protected user routes work with a valid token and reject missing/foreign tokens', async () => {
    const userToken = await signUpAndIn('user', 'u@x.com');
    const adminToken = await signUpAndIn('admin', 'boss@x.com');

    await request(app).get('/api/user/courses').expect(401); // no token
    await request(app).get('/api/user/courses').set('token', 'garbage').expect(401);
    await request(app).get('/api/user/courses').set(bearer(adminToken)).expect(401); // admin token is not a user token
    await request(app).get('/api/admin/courses/all').set(bearer(userToken)).expect(401); // and the reverse

    const ok = await request(app).get('/api/user/courses').set(bearer(userToken)).expect(200);
    assert.deepEqual(ok.body.courses, []);
    await request(app).get('/api/user/courses').set('token', userToken).expect(200); // legacy header still works
});

test('REGRESSION: purchase flow creates a purchase once and lists it', async () => {
    const userToken = await signUpAndIn('user', 'u@x.com');
    const adminToken = await signUpAndIn('admin', 'boss@x.com');

    const created = await request(app).post('/api/admin/create-course').set(bearer(adminToken))
        .send({ title: 'Node 101', price: 499, thumbnailUrl: 'https://example.com/a.png' }).expect(201);
    const courseId = created.body.courseId;

    await request(app).post('/api/user/purchase-course').set(bearer(userToken)).send({ courseId: 'zzz' }).expect(400);
    await request(app).post('/api/user/purchase-course').set(bearer(userToken)).send({ courseId: 'a'.repeat(24) }).expect(404);

    await request(app).post('/api/user/purchase-course').set(bearer(userToken)).send({ courseId }).expect(201);
    await request(app).post('/api/user/purchase-course').set(bearer(userToken)).send({ courseId }).expect(409);

    const mine = await request(app).get('/api/user/courses').set(bearer(userToken)).expect(200);
    assert.equal(mine.body.courses.length, 1);
    assert.equal(mine.body.courses[0].title, 'Node 101');
});

test('create-course validates input; public catalogue lists courses', async () => {
    const adminToken = await signUpAndIn('admin', 'boss@x.com');
    await request(app).post('/api/admin/create-course').set(bearer(adminToken)).send({ title: '', price: -5 }).expect(400);
    await request(app).post('/api/admin/create-course').set(bearer(adminToken)).send({ title: 'A', price: 10 }).expect(201);
    const catalogue = await request(app).get('/api/course/courses/all').expect(200);
    assert.equal(catalogue.body.allCourses.length, 1);
});

test('REGRESSION: update-course changes only the targeted course and only for its creator', async () => {
    const adminA = await signUpAndIn('admin', 'a@x.com');
    const adminB = await signUpAndIn('admin', 'b@x.com');

    const first = await request(app).post('/api/admin/create-course').set(bearer(adminA)).send({ title: 'First', price: 100 });
    const second = await request(app).post('/api/admin/create-course').set(bearer(adminA)).send({ title: 'Second', price: 200 });

    await request(app).post('/api/admin/update-course').set(bearer(adminA)).send({ courseId: second.body.courseId }).expect(400);
    await request(app).post('/api/admin/update-course').set(bearer(adminB))
        .send({ courseId: second.body.courseId, price: 1 }).expect(404); // not the creator

    const res = await request(app).post('/api/admin/update-course').set(bearer(adminA))
        .send({ courseId: second.body.courseId, price: 250 }).expect(200);
    assert.equal(res.body.course.price, 250);
    assert.equal(res.body.course.title, 'Second'); // untouched field kept

    const list = await request(app).get('/api/admin/courses/all').set(bearer(adminA)).expect(200);
    const byTitle = Object.fromEntries(list.body.allcourses.map((c) => [c.title, c.price]));
    assert.deepEqual(byTitle, { First: 100, Second: 250 }); // the other course was not modified
    assert.ok(first.body.courseId);
});

test('delete-course only works for the creator and removes related purchases', async () => {
    const userToken = await signUpAndIn('user', 'u@x.com');
    const adminA = await signUpAndIn('admin', 'a@x.com');
    const adminB = await signUpAndIn('admin', 'b@x.com');

    const { body } = await request(app).post('/api/admin/create-course').set(bearer(adminA)).send({ title: 'X', price: 1 });
    await request(app).post('/api/user/purchase-course').set(bearer(userToken)).send({ courseId: body.courseId }).expect(201);

    await request(app).delete('/api/admin/Delete-course').set(bearer(adminB)).send({ courseId: body.courseId }).expect(404);
    await request(app).delete('/api/admin/Delete-course').set(bearer(adminA)).send({ courseId: body.courseId }).expect(200);

    const mine = await request(app).get('/api/user/courses').set(bearer(userToken)).expect(200);
    assert.deepEqual(mine.body.courses, []);
});
