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
    var slice = Array.prototype.slice;

    var spaceExp = /\s+/;
    var GLOBAL_EVENT = '__global__';

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

    function each (sign) {
        sign = sign || 0;

        return function (array, callback) {
            array || (array = []);

            if (!sign) return (array).forEach(callback);

            for (var i = 0, length = array.length; i < length; i++) {
                if (callback(array[i], i, array) === false) return;
            }
        }
    }

    function unique (array) {
        var iteratee = each(1);
        var result = [];

        iteratee(array, function (value) {
            result.indexOf(value) < 0 && result.push(value);
        });

        return result;
    }

    /**
     * 对事件按照场景分别处理，转成单个事件名
     *
     * @param {Object} object 当前异步流程库实例
     * @param {String} action 实例方法
     * @param {String} eventName 事件名
     * @param {Array} extra
     * 说明：
     *      extra[1] {Function} 事件处理程序
     *      extra[2] {Object} 上下文对象
     */
    function generalEventTo (object, action, eventName, extra) {
        var isEventArray, args;

        // 直接通过数组形式或者空白字符形式传递多个事件名
        if ((isEventArray = (Object.getPrototypeOf(eventName) === Array)) || spaceExp.test(eventName)) {
            args = isEventArray ? eventName : eventName.split(spaceExp);

            each()(args, function (evtName) {
                object[action].apply(object, [evtName].concat(extra));
            });

            return false;
        }

        return true;
    }

    function assign (isOnce) {
        typeof isOnce !== 'undefined' || (isOnce = true);

        return function () {
            var args = slice.call(arguments, 0);
            var eventList = unique(args.slice(0, -2));
            var callback = args[args.length - 2];
            var iteratee = each();
            var count = 0;
            var result = {};

            // 运用aop技术，在调用真实的callback的时候，先记录绑定的事件的调用次数和每个事件触发的数据，用于判断绑定的事件是否都触发完
            var onCallback = (function (evtName) {
                this[isOnce ? 'once' : 'on'](evtName, function (data) {
                    (result[evtName] || (result[evtName] = {}))['data'] = data;
                    count++;
                });
            }).bind(this);

            // 定义global事件处理程序，判断当前集合事件是否执行完成
            var onGlobalCallback = (function (evtName) {
                var sortedResult = [], i, length;

                // 判断所有事件是否调用完成
                if (count < eventList.length) return;

                for (i = 0, length = eventList.length; i < length; i++) {
                    sortedResult.push(result[eventList[i]].data);
                }

                isOnce && this.offGlobalEvent(onGlobalCallback);
                callback.apply(null, sortedResult);
            }).bind(this);

            iteratee(eventList, function (evtName, index) {
                onCallback(evtName, index);
            });

            // 绑定global事件
            this.onGlobalEvent(onGlobalCallback);

            return this;
        };
    }

    function AsyncFlow () {
        if (!(this instanceof AsyncFlow)) {
            return new AsyncFlow();
        }
    }

    extend(AsyncFlow, {
        create: function () {

        }
    });

    extend(AsyncFlow.prototype, {

        /**
         * 事件绑定(可执行多次)
         *
         * @param {String|Array} eventName 单个或者多个事件名
         * @param {Function} callback 事件处理程序
         * @param {Object} context 上下文对象
         */
        on: function (eventName, callback, context) {
            if (!eventName || !callback || !generalEventTo(this, 'on', eventName, [callback, context])) return this;

            this.events || (this.events = {});
            (this.events[eventName] || (this.events[eventName] = [])).push({
                eventName: eventName,
                context: context || root
            });

            return this;
        },

        /**
         * 事件绑定(只执行一次)
         */
        once: function (eventName, callback, context) {
            if (!eventName || !callback || !generalEventTo(this, 'once', eventName, [callback, context])) return this;

            var onlyOnCallback = (function () {
                this.off(eventName, onlyOnCallback);
                callback.apply(this, arguments);
            }).bind(this);

            return this.on(eventName, onlyOnCallback, context);
        },

        /**
         * 删除事件绑定
         */
        off: function (eventName) {
            var eventList, callbacks, currentCallbacks, result;

            if (!this.events || !generalEventTo(this, 'off', eventName)) return this;

            eventList = eventName ? [eventName] : Object.keys(this.events);
            callbacks = slice.call(arguments, 1);

            each()(eventList, (function (evtName) {
                result = [];
                currentCallbacks = this.events[evtName];

                each()(currentCallbacks, function (callback) {
                    callbacks.indexOf(callback) < 0 && result.push(callback);
                });

                this.events[evtName] = result;
            }).bind(this));

            return this;
        },

        /**
         * 触发事件绑定
         */
        emit: function (eventName) {
            var args, currentCallbacks, sign, evtName;

            if (!this.events) return this;

            args = slice.call(arguments, 1);
            sign = 2;

            while (sign--) {
                evtName = sign ? eventName : GLOBAL_EVENT;
                currentCallbacks = this.events[evtName];

                each()(currentCallbacks, function (callback) {
                    callback.apply(evtName, (!sign ? [evtName] : []).concat(args));
                });
            }

            return this;
        },

        onGlobalEvent: function (callback) {
            this.on(GLOBAL_EVENT, callback);
        },

        offGlobalEvent: function (callback) {
            this.off(GLOBAL_EVENT, callback);
        },

        all: assign(true),

        tail: assign(false),

        after: function (eventName, length, callback) {
            var count = 0;
            var result = [];
            var onGlobalCallback = (function (evtName, data) {
                if (evtName === eventName) {
                    count++;

                    if (count <= length) {
                        result.push(data);
                        return;
                    }

                    callback.apply(null, [result]);
                }
            }).bind(this);

            this.onGlobalEvent(onGlobalCallback);
        }
    });

    return AsyncFlow;
});

