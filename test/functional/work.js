"use strict";
var test = require('tap').test;
var Gearman = require('./lib/loopback');

Gearman.Server.listen();

test('work', function (t) {
    t.plan(2);

    var gmw = Gearman.Client.connect({defaultEncoding: 'utf8'});
    gmw.registerWorker('upper',function (task) {
        task.then(function(payload) {
            task.end(payload.toUpperCase());
        });
    });
    var gmc = Gearman.Client.connect({defaultEncoding: 'utf8'});
    var message = 'test';
    gmc.submitJob('upper',message).on('created',function(task) {
        console.log('# created ',task.jobid);
    }).then(function (result) {
        t.pass('no errors');
        t.is(result,message.toUpperCase(),'we got uppercased');
    }).catch(function (err) {
        t.fail('no errors');
        process.stdout.write('# '+err);
        t.skip();
    }).finally(function () {
         gmw.forgetAllWorkers();
    })
    
});

test('error', function (t) {
    t.plan(2);

    var gmw = Gearman.Client.connect({defaultEncoding: 'utf8'});
    gmw.registerWorker('upper',function (task) {
        return task.then(function(payload) {
            throw payload;
        });
    });
    var gmc = Gearman.Client.connect({defaultEncoding: 'utf8'});
    var message = 'test';
    gmc.submitJob('upper',message).then(function (result) {
        t.fail('errors');
        t.skip();
    })
    .catch(function (err) {
        t.pass('errors');
        t.is(err.message,message,'got error message');
    })
    .finally(function () {
        gmw.forgetAllWorkers();
    })
    
});

test('work-multiple-serial', function (t) {
    t.plan(4);

    var gmw = Gearman.Client.connect({defaultEncoding: 'utf8'});
    gmw.registerWorker('upper',function (task) {
        task.then(function(payload) {
            task.end(payload.toUpperCase());
        });
    });
    var gmc = Gearman.Client.connect({defaultEncoding: 'utf8'});
    var message = 'test';
    gmc.submitJob('upper',message).then(function (result) {
        t.pass('no errors');
        t.is(result,message.toUpperCase(),'we got uppercased');
        gmc.submitJob('upper',message).then(function (result) {
            t.pass('no errors');
            t.is(result,message.toUpperCase(),'we got uppercased');
        })
        .catch(function (err) {
            t.fail('no errors');
            process.stdout.write('# '+err);
            t.skip();
        })
        .finally(function () {
             gmw.forgetAllWorkers();
        })
    })
    .catch(function (err) {
        t.fail('no errors');
        process.stdout.write('# '+err);
        t.skip();
    })

});
