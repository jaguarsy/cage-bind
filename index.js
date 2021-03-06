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

    var _insertBefore = function (newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode);
    };

    var _remove = function (node) {
        node.parentNode.removeChild(node);
    };

    var _guid = function () {
        return Date.now();
    };

    //text must be only one element
    var _createElementByText = function (text) {
        var tmp = document.createElement('div');
        tmp.innerHTML = text;
        return tmp.childNodes[0];
    };

    ///////////////////////////////////////////
    //region //Lexer, copy from angular.js - parse.js//

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

    //endregion/
    ///////////////////////////////////////////

    var _lexer = new Lexer();

    var _eval = function (expression, context) {
        var tokens = _lexer.lex(expression);
        var contextStr = 'context.';

        var result = _map(tokens, function (item, index) {
            if (context &&
                item.identifier &&
                (index === 0 ||
                tokens[index - 1].operator ||
                tokens[index - 1].text === '[' )) {
                return contextStr + item.text;
            }
            return item.text;
        });

        try {
            return eval(result.join(''));
        } catch (e) {
            console.warn(e);
            return null;
        }
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

    var _insertComment = function (target, attr) {
        var comment = document.createComment(target.outerHTML);
        if (attr) {
            for (var key in attr) {
                if (attr.hasOwnProperty(key)) {
                    comment[key] = attr[key];
                }
            }
        }
        _insertBefore(comment, target);
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
        },
        'cg-value': function (attr, context) {
            this.value = _eval(attr, context);
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

    var _checkRepeatElement = function (element) {
        var isRepeat = function (item) {
            return item.name === 'cg-repeat';
        };

        return _find(element.attributes, isRepeat);
    };

    //cg-repeat
    var _repeat = function (element, attr, context) {
        var arr = attr.split(/\s+/);

        if (!~arr.indexOf('in') || arr.length !== 3) {
            throw 'invalid cg-repeat expression, it must be "xx in xxx"';
        }

        var name = arr[0],
            list = _eval(arr[2], context);

        var _bindInRepeat = function (ele, subContext) {
            if (_replaceTextNode(ele, subContext)) {
                return;
            }

            _replaceAttributes(ele, subContext);

            _map(ele.childNodes, function (item) {
                if (item.isRepeat) {
                    return;
                }

                var repeat = _checkRepeatElement(item);

                if (repeat) {
                    _repeat(item, repeat.value, subContext);
                } else {
                    _replaceAttributes(item, subContext);
                    _bindInRepeat(item, subContext);
                }
            });
        };

        var prevElement = element,
            cloneElement,
            guid = _guid();

        _map(list, function (item, index) {
            var subContext = {
                $index: index
            };

            cloneElement = element.cloneNode(true);
            cloneElement.isRepeat = true;
            cloneElement.guid = guid;
            cloneElement.style.display = '';
            _insertAfter(cloneElement, prevElement);
            _insertComment(cloneElement, {isRepeat: true, guid: guid});
            prevElement = cloneElement;
            subContext[name] = item;

            _bindInRepeat(cloneElement, subContext);
        });

        if (!list || !list.length) {
            _insertComment(element, {isRepeat: true, guid: guid});
        }

        _remove(element);
    };

    var _resetRepeat = function (comment) {
        if (comment.constructor !== Comment || !comment.isRepeat) {
            _map(comment.childNodes, function (item) {
                _resetRepeat(item);
            });
            return;
        }

        var newRepeatElement = _createElementByText(comment.textContent),
            originGuid = comment.guid;

        _insertBefore(newRepeatElement, comment);

        var next = newRepeatElement.nextSibling;

        while (next && next.guid && next.guid === originGuid) {
            if (next.nextSibling &&
                next.nextSibling.guid &&
                next.nextSibling.guid === originGuid) {
                _remove(next.nextSibling);
            }
            _remove(next);
            next = newRepeatElement.nextSibling;
        }

        //while (next && next.constructor === Comment && next.isRepeat) {
        //    if (next.nextSibling.outerHTML === next.outerHTML) {
        //        _remove(next.nextSibling); //remove node after this comment when they are exactly the same
        //    }
        //
        //    var tmp = next; //save this comment
        //    next = next.nextSibling; //set next to the nextSibling
        //    _remove(tmp); //remove comment
        //    tmp = null;
        //}
    };

    var _bindOject = function (element, context) {
        if (!element || _replaceTextNode(element, context)) {
            return;
        }

        var repeat = _checkRepeatElement(element);

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
            //reset the cg-repeat node maybe bind before
            _resetRepeat(item);

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

    //hide [cg-show] and [cg-repeat] element when cage-bind loaded
    $('[cg-show], [cg-repeat]').css('display', 'none');

})(window.jQuery || window.$);