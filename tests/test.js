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
            {name: 'cg-bind'},
            {name: 'cg-repeat'}
        ],

        testShowHide: true
    };

    $('#test').cbind(obj);
})();