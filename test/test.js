import 'steal-mocha';
import chai from 'chai';
import fixture from 'can-fixture';
import {options} from 'shuttle-can-api';
import Api from 'shuttle-can-api';

var assert = chai.assert;

fixture({
    'GET http://endpoint/users': function(){

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

    it('should be able to return a list of users', function(){
        var api = new Api({ endpoint: 'users' });

        return api.list()
            .then(function(response){
                assert.equal(response.length, 3);
            })
    });
});