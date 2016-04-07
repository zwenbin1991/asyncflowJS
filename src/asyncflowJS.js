/**
 * @name asyncflowJS.js
 * @description 异步流程控制，解决callback hell
 * @author zengwenbin
 * @email zwenbin1991@163.com
 * @date 2016-4-7
 */

;(function (root, factory) {
    root.asyncflowJS = factory(root);
})(this, function (root) {
    'use strict';

    var hasOwnProperty = Object.prototype.hasOwnProperty;

    function extend (object, extendObject) {
        if (!extendObject) {
            extendObject = object;
            object = this;
        }

        for (var propery in extendObject) {
            object[propery] = extendObject[propery];
        }

        return object;
    }

    function generalEventOption (object, action, extra) {

    }

    function Asyncflow () {
        if (!(this instanceof Asyncflow)) {
            return new Asyncflow();
        }
    }

    extend(Asyncflow, {
        create: function () {

        }
    });

    extend(Asyncflow.prototype, {

        on: function (name, callback, context) {
            if (!generalEventOption(this, 'on'))
        },

        once: function () {

        },

        off: function () {

        },

        emit: function () {

        }
    });

    return Asyncflow;
});

