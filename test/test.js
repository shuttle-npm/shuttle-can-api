import 'steal-mocha';
import chai from 'chai';
import fixture from 'can-fixture';
import {options} from 'shuttle-can-api';
import Api from 'shuttle-can-api';

var assert = chai.assert;

var users = [
    {
        id: 1,
        name: 'user-1'
    },
    {
        id: 2,
        name: 'user-2'
    },
    {
        id: 3,
        name: 'user-3'
    }
];

fixture({
    'GET /endpoint/users': function () {
        return users;
    },
    'GET /endpoint/users/{id}': function (request) {
        var id = parseInt(request.data.id);
        var result = users.filter(function (item) {
            return (item.id === id) ? item : undefined;
        });

        return result.length ? result[0] : undefined;
    },
    'POST /endpoint/users': function (request) {
        return request.data.message;
    }
});

describe('Api', function () {
    it('should not be able to instantiate without options.url', function () {
        assert.throws(() => new Api({endpoint: 'http://endpoint'}));
    });

    it('should be able to instantiate with valid options.url', function () {
        options.url = 'http://endpoint';

        assert.doesNotThrow(() => new Api({endpoint: 'test'}));
    });

    it('should be able to parse various endpoints request urls', function () {
        var api = new Api({endpoint: 'users'});

        assert.equal('http://endpoint/users', api.parseEndpoint('users').url)
        assert.equal('http://endpoint/users/abc', api.parseEndpoint('users/{id}', {id: 'abc'}).url)
        assert.equal('http://endpoint/users/xyz/abc', api.parseEndpoint('users/{action}/{id}', {
            id: 'abc',
            action: 'xyz'
        }).url)
    });

    it('should be able to return a list of users', function () {
        var api = new Api({endpoint: 'users'});

        return api.list()
            .then(function (response) {
                assert.equal(response.length, 3);
            })
    });

    it('should be able to get a single user', function () {
        var api = new Api({endpoint: 'users/{id}'});

        return api.item({id: 2})
            .then(function (response) {
                assert.equal(response.id, 2);
                assert.equal(response.name, 'user-2');
            })
    });

    it('should be able to post data', function () {
        var api = new Api({endpoint: 'users'});

        return api.post({message: 'success'})
            .then(function (response) {
                assert.equal('success', response);
            });
    });
});