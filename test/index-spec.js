let assert = require('assert');
let loggingMachine = require('../tester');

describe('loggingMachine', function() {
    describe('log In', function() {
        it('logs into account', function () {
            let result = loggingMachine.login("dev@psyphertxt.com", "WonDerful1");
            assert.equal(result, "dev@psyphertxt.com");

           //  loggingMachine.login("dev@psyphertxt.com", "WonDerful1").then(function (result) {
           //     assert.equal(result, "dev@psyphertxt.com");
           // })
        });
    });
});