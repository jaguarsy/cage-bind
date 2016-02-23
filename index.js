/**
 * Created by johnnycage on 16/2/22.
 */

(function ($) {
    'use strict';
    if ($ && $.prototype.constructor !== jQuery) {
        console.error('The \'$\' is redundant.');
    }

    //base functions

    var _map = function (list, callback) {
        var result = [];

        if (!list) {
            return result;
        }

        if (!list.length) {
            list = [].concat(list);
        }

        for (var i = 0; i < list.length; i++) {
            var item = list[i];

            result.push(callback(item, i) || item);
        }

        return result;
    };

    var _find = function (list, callback) {
        if (!list) {
            return;
        }

        if (!list.length) {
            list = [].concat(list);
        }

        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            if (callback(item)) {
                return item;
            }
        }
    };

    var _contains = function (list, callback) {
        return !!_find(list, callback);
    };

    var _createMap = function () {
        return Object.create(null);
    };

    var _isDefined = function (value) {
        return typeof value !== 'undefined';
    };

    var _isString = function (value) {
        return typeof value === 'string';
    };

    var _lowercase = function (string) {
        return _isString(string) ? string.toLowerCase() : string;
    };

    var _insertAfter = function (newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    };

    ///////////////////////////////////
    //Lexer, copy from angular.js - parse.js

    var OPERATORS = _createMap();

    _map('+ - * / % === !== == != < > <= >= && || ! = |'.split(' '), function (operator) {
        OPERATORS[operator] = true;
    });

    var ESCAPE = {'n': '\n', 'f': '\f', 'r': '\r', 't': '\t', 'v': '\v', '\'': '\'', '"': '"'};

    var Lexer = function () {
    };

    Lexer.prototype = {
        constructor: Lexer,

        lex: function (text) {
            this.text = text;
            this.index = 0;
            this.tokens = [];

            while (this.index < this.text.length) {
                var ch = this.text.charAt(this.index);
                if (ch === '\'' || ch === '\'') {
                    this.readString(ch);
                } else if (this.isNumber(ch) || ch === '.' && this.isNumber(this.peek())) {
                    this.readNumber();
                } else if (this.isIdent(ch)) {
                    this.readIdent();
                } else if (this.is(ch, '(){}[].,;:?')) {
                    this.tokens.push({index: this.index, text: ch});
                    this.index++;
                } else if (this.isWhitespace(ch)) {
                    this.index++;
                } else {
                    var ch2 = ch + this.peek();
                    var ch3 = ch2 + this.peek(2);
                    var op1 = OPERATORS[ch];
                    var op2 = OPERATORS[ch2];
                    var op3 = OPERATORS[ch3];
                    if (op1 || op2 || op3) {
                        var token = op3 ? ch3 : (op2 ? ch2 : ch);
                        this.tokens.push({index: this.index, text: token, operator: true});
                        this.index += token.length;
                    } else {
                        this.throwError('Unexpected next character ', this.index, this.index + 1);
                    }
                }
            }
            return this.tokens;
        },

        is: function (ch, chars) {
            return chars.indexOf(ch) !== -1;
        },

        peek: function (i) {
            var num = i || 1;
            return (this.index + num < this.text.length) ? this.text.charAt(this.index + num) : false;
        },

        isNumber: function (ch) {
            return ('0' <= ch && ch <= '9') && typeof ch === 'string';
        },

        isWhitespace: function (ch) {
            // IE treats non-breaking space as \u00A0
            return (ch === ' ' || ch === '\r' || ch === '\t' ||
            ch === '\n' || ch === '\v' || ch === '\u00A0');
        },

        isIdent: function (ch) {
            return ('a' <= ch && ch <= 'z' ||
            'A' <= ch && ch <= 'Z' ||
            '_' === ch || ch === '$');
        },

        isExpOperator: function (ch) {
            return (ch === '-' || ch === '+' || this.isNumber(ch));
        },

        throwError: function (error, start, end) {
            end = end || this.index;
            var colStr = _isDefined(start) ?
                ('s ' + start + '-' + this.index + ' [' + this.text.substring(start, end) + ']') :
                (' ' + end);

            throw 'Lexer Error: ' + error + ' at column' + colStr + ' in expression [' + this.text + '].';
        },

        readNumber: function () {
            var number = '';
            var start = this.index;
            while (this.index < this.text.length) {
                var ch = _lowercase(this.text.charAt(this.index));
                if (ch == '.' || this.isNumber(ch)) {
                    number += ch;
                } else {
                    var peekCh = this.peek();
                    if (ch == 'e' && this.isExpOperator(peekCh)) {
                        number += ch;
                    } else if (this.isExpOperator(ch) &&
                        peekCh && this.isNumber(peekCh) &&
                        number.charAt(number.length - 1) == 'e') {
                        number += ch;
                    } else if (this.isExpOperator(ch) &&
                        (!peekCh || !this.isNumber(peekCh)) &&
                        number.charAt(number.length - 1) == 'e') {
                        this.throwError('Invalid exponent');
                    } else {
                        break;
                    }
                }
                this.index++;
            }
            this.tokens.push({
                index: start,
                text: number,
                constant: true,
                value: Number(number)
            });
        },

        readIdent: function () {
            var start = this.index;
            while (this.index < this.text.length) {
                var ch = this.text.charAt(this.index);
                if (!(this.isIdent(ch) || this.isNumber(ch))) {
                    break;
                }
                this.index++;
            }
            this.tokens.push({
                index: start,
                text: this.text.slice(start, this.index),
                identifier: true
            });
        },

        readString: function (quote) {
            var start = this.index;
            this.index++;
            var string = '';
            var rawString = quote;
            var escape = false;
            while (this.index < this.text.length) {
                var ch = this.text.charAt(this.index);
                rawString += ch;
                if (escape) {
                    if (ch === 'u') {
                        var hex = this.text.substring(this.index + 1, this.index + 5);
                        if (!hex.match(/[\da-f]{4}/i)) {
                            this.throwError('Invalid unicode escape [\\u' + hex + ']');
                        }
                        this.index += 4;
                        string += String.fromCharCode(parseInt(hex, 16));
                    } else {
                        var rep = ESCAPE[ch];
                        string = string + (rep || ch);
                    }
                    escape = false;
                } else if (ch === '\\') {
                    escape = true;
                } else if (ch === quote) {
                    this.index++;
                    this.tokens.push({
                        index: start,
                        text: rawString,
                        constant: true,
                        value: string
                    });
                    return;
                } else {
                    string += ch;
                }
                this.index++;
            }
            this.throwError('Unterminated quote', start);
        }
    };

    ///////////////////////////////////

    var _lexer = new Lexer();

    var _eval = function (expression, context) {
        var tokens = _lexer.lex(expression);
        var contextStr = 'context.';

        var result = _map(tokens, function (item, index) {
            if (context &&
                item.identifier &&
                (index === 0 || tokens[index - 1].operator )) {
                return contextStr + item.text;
            }
            return item.text;
        });

        return eval(result.join(''));
    };

    var LEFT = '{{';
    var RIGHT = '}}';

    var _getPlaceHolder = function (textContent) {
        var result = [];
        var process1 = textContent.split(LEFT);

        _map(process1, function (item) {
            if (~item.indexOf(RIGHT)) {
                result.push(item.split(RIGHT)[0]);
            }
        });

        return result;
    };

    //first param must be a textNode
    var _placeholderReplace = function (textNode, context) {
        var text = textNode.textContent;
        var placeHolders = _getPlaceHolder(text);

        _map(placeHolders, function (item) {
            var value = _eval(item, context);
            text = text.replace(LEFT + item + RIGHT, value);
        });

        textNode.textContent = text;
    };

    //no cg-repeat
    var _services = {
        'cg-bind': function (attr, context) {
            this.textContent = _eval(attr, context);
        },
        'cg-show': function (attr, context) {
            if (_eval(attr, context)) {
                this.style.display = '';
            }
        },
        'cg-hide': function (attr, context) {
            if (_eval(attr, context)) {
                this.style.display = 'none';
            }
        }
    };

    //map element's attributes, process by _services
    var _replaceAttributes = function (element, context) {
        _map(element.attributes, function (item) {
            if (_services.hasOwnProperty(item.name)) {
                _services[item.name].call(element, item.value, context);
            }
        });
    };

    //node is a TextNode means it has no childNodes,
    //bind object directly.
    var _replaceTextNode = function (element, context) {
        if (element.constructor === Text) {
            _placeholderReplace(element, context);
            return true;
        }

        return false;
    };

    //cg-repeat
    var _repeat = function (element, attr, context) {
        var arr = attr.split(/\s+/);

        if (!~arr.indexOf('in') || arr.length !== 3) {
            throw 'invalid cg-repeat expression, it must be "xx in xxx"';
        }

        var name = arr[0],
            subContext = {},
            list = _eval(arr[2], context);

        var _bindNoRepeatElement = function (ele, context) {
            if (!_replaceTextNode(ele, context)) {
                _replaceAttributes(ele, context);

                _map(ele.childNodes, function (item) {
                    _bindNoRepeatElement(item, context);
                });
            }
        };

        var prevElement = element,
            cloneElement;

        _map(list, function (item, index) {
            item.$index = index;

            cloneElement = element.cloneNode(true);
            cloneElement.isRepeat = true;
            _insertAfter(cloneElement, prevElement);
            prevElement = cloneElement;

            subContext[name] = item;

            _bindNoRepeatElement(cloneElement, subContext);

            delete item.$index;
        });

        element.parentNode.removeChild(element);
    };

    var _bindOject = function (element, context) {
        if (!element || _replaceTextNode(element, context)) {
            return;
        }

        var isRepeat = function (item) {
            return item.name === 'cg-repeat';
        };

        var repeat = _find(element.attributes, isRepeat);

        //has cg-repeat
        if (repeat) {
            _repeat(element, repeat.value, context);
        } else {
            _replaceAttributes(element, context);

            _map(element.childNodes, function (item) {
                if (!item.isRepeat) {
                    _bindOject(item, context);
                }
            });
        }
    };

    var _bind = function (source) {
        var self = this;

        _map(self, function (item) {
            _bindOject(item, source);
        });

        return self;
    };

    //polyfill jquery
    if ($) {
        $.fn.extend({
            cbind: _bind
        });
    } else {
        $ = window.CageBind = window.$ = (function () {
            function CageBind(els) {
                var self = this;
                self.length = els.length;

                _map(els, function (item, index) {
                    self[index] = item;
                });
            }

            CageBind.prototype.map = function (callback) {
                return _map(this, callback);
            };

            CageBind.prototype.forEach = function (callback) {
                this.map(callback);
                return this;
            };

            CageBind.prototype.addClass = function (classes) {
                var className = '';
                if (typeof classes !== 'string') {
                    for (var i = 0; i < classes.length; i++) {
                        className += ' ' + classes[i];
                    }
                } else {
                    className = ' ' + classes;
                }
                return this.forEach(function (el) {
                    el.className += className;
                });
            };

            CageBind.prototype.removeClass = function (clazz) {
                return this.forEach(function (el) {
                    var cs = el.className.split(' '), i;

                    while ((i = cs.indexOf(clazz)) > -1) {
                        cs = cs.slice(0, i).concat(cs.slice(++i));
                    }
                    el.className = cs.join(' ');
                });
            };

            CageBind.prototype.css = function (name, value) {
                return this.forEach(function (el) {
                    el.style[name] = value;
                });
            };

            CageBind.prototype.cbind = _bind;

            return function (selector) {
                var els;
                if (typeof selector === 'string') {
                    els = document.querySelectorAll(selector);
                } else if (selector.length) {
                    els = selector;
                } else {
                    els = [selector];
                }
                return new CageBind(els);
            };
        }());
    }

    //show [cg-cloak] element when cage-bind loaded
    $('[cg-cloak]').removeClass('cg-cloak');

    //hide [cg-show] element when cage-bind loaded
    $('[cg-show]').css('display', 'none');

})(window.jQuery || window.$);