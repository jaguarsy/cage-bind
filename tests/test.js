/**
 * Created by johnnycage on 16/2/22.
 */
(function () {
    'use strict';

    var obj = {
        user: {
            firstName: 'Johnny',
            lastName: 'Cage'
        },
        name: 'cage-bind',
        list: [
            {name: 'cg-bind', sublist: ['c', 'g', '-', 'b', 'i', 'n', 'd']},
            {name: 'cg-repeat'},
            {name: 'cg-show'},
            {name: 'cg-hide'},
            {name: 'cg-value'}
        ],

        testShowHide: true
    };

    $('#test').cbind(obj);

    var obj2 = {
        user: {
            firstName: 'Johnny2',
            lastName: 'Cage2'
        },
        name: 'cage-bind2',
        list: [
            {name: 'cg-bind2'},
            {name: 'cg-repeat2'},
            {name: 'cg-show2'},
            {name: 'cg-hide2'},
            {name: 'cg-value2'}
        ],

        testShowHide: true
    };

    $('#test').cbind(obj2);
})();