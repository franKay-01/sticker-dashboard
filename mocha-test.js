var assert = require('assert');
var loggingMachine = require('./test');

describe('loggingMachine', function() {
    describe('log In', function() {
        it('logs into account', function () {
            var result = loggingMachine.login("dev@psyphertxt.com", "WonDerful1");
            assert.equal(result, "dev@psyphertxt.com");
        });
    });
});