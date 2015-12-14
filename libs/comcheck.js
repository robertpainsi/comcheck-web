(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * comcheck.js
 */
comcheck = require('comcheck');

},{"comcheck":18}],2:[function(require,module,exports){
/**
 * enumeration-indentation-check.js
 */
var utils = require('../utils');

var check = (config) => {
    return {
        visitBodyLine: (reporter, line) => {
            if (!line.isEnumeration || line.text.startsWith(line.enumeration)) return;

            var text = line.text;
            if (!text.match(new RegExp(`^\\s{${line.enumeration.length}}[^ \\s]`))) {
                var prefix = text.substr(0, text.search(/[^\s]/));
                reporter.report(`Line isn't indented correctly`, {
                    text: prefix,
                    row: line.row,
                    column: (prefix) ? 1 : 0
                });
            }
        }
    }
};

check.id = 'core/enumeration-indentation-check';
module.exports = check;

},{"../utils":22}],3:[function(require,module,exports){
/**
 * header-delimiter-check.js
 */
var utils = require('../utils');

var check = (config) => {
    return {
        visitHeader: (reporter, header) => {
            ['.', ',', ':', '!', '?'].some((delimiter) => {
                if (header.trimmedText.endsWith(delimiter)) {
                    reporter.report(`Remove delimiter at the end of the header`, {
                        text: delimiter,
                        row: header.row,
                        column: header.text.lastIndexOf(delimiter) + 1
                    });
                    return true;
                }
            })
        }
    };
};
check.id = 'core/header-delimiter-check';
module.exports = check;

},{"../utils":22}],4:[function(require,module,exports){
/**
 * imperative-check.js
 */
var utils = require('../utils');

var IGNORE_WORDS = [];
var WORD_ENDINGS = ['s', 'ed'];
var NON_IMPERATIVE_WORDS = [];

var check = (config) => {
    return {
        visitHeader: (reporter, header) => {
            var firstWord = utils.getFirstWord(header.title);
            var lowerCaseFirstWord = firstWord.toLowerCase();
            if (utils.isWord(firstWord) && !IGNORE_WORDS.includes(lowerCaseFirstWord)) {
                if (NON_IMPERATIVE_WORDS.includes(lowerCaseFirstWord)) {
                    reporter.report(`Use imperative form`, {
                        text: firstWord,
                        row: header.row,
                        column: header.text.indexOf(header.title)
                    });
                } else {
                    WORD_ENDINGS.some((ending) => {
                        if (firstWord.toLowerCase().endsWith(ending)) {
                            reporter.report(`Use imperative form`, {
                                text: ending,
                                row: header.row,
                                column: header.text.indexOf(header.title) + firstWord.length - ending.length + 1
                            });
                            return true;
                        }
                    });
                }
            }
        }
    };
};
check.id = 'core/imperative-check';
module.exports = check;

},{"../utils":22}],5:[function(require,module,exports){
/**
 * improve-message-check.js
 */
var utils = require('../utils');
var indicatorTester = require('../indicator-tester');

var rebaseTester = indicatorTester(['rebase']);
var improvementTester = indicatorTester(['thing']);

var check = (config) => {
    return {
        visitHeader: (reporter, header) => {
            var title = header.title;
            if (rebaseTester.test(title)) {
                reporter.report(`Remove rebasing commit`, {row: 1});
            }
            if (title.split(/\s+/).length < 2 || improvementTester.test(title)) {
                reporter.report(`Improve commit message header`, {row: 1});
            }
        }
    };
};
check.id = 'core/improve-message-check';
module.exports = check;

},{"../indicator-tester":19,"../utils":22}],6:[function(require,module,exports){
/**
 * line-length-check.js
 */
var utils = require('../utils');

var isSourceEnumeration = (text) => text.match(/^\[[0-9]+\]\s[^\s]+$/);

var check = (config) => {
    return {
        visitHeader: (reporter, header) => {
            var text = header.text;
            var exceedingText = text.substring(config.headerLength);
            if (exceedingText) {
                reporter.report(`Header exceeds ${config.headerLength} characters`, {
                    text: exceedingText,
                    row: header.row,
                    column: config.headerLength + 1
                });
            }
        },
        visitLine: (reporter, line) => {
            if (line.isHeader) return;

            var text = line.text;
            var exceedingText = text.substring(config.lineLength);
            if (exceedingText && !isSourceEnumeration(text) && text.match(/[^\s]\s+[^\s]/)) {
                reporter.report(`Line exceeds ${config.lineLength} characters`, {
                    text: exceedingText,
                    row: line.row,
                    column: config.lineLength + 1
                });
            }
        }
    };
};
check.id = 'core/line-length-check';
module.exports = check;

},{"../utils":22}],7:[function(require,module,exports){
/**
 * missing-body-check.js
 */
var utils = require('../utils');

var indicatorTester = require('../indicator-tester')([
    'fix', 'improve', 'refactor', 'problem',
    {include: 'feature', exclude: /enable|disable/i}
]);

var check = (config) => {
    return {
        visitHeader: (reporter, header) => {
            if (!header.message.body.length && indicatorTester.test(header.title)) {
                reporter.report(`Missing body`, {row: Number.POSITIVE_INFINITY});
            }
        }
    };
};
check.id = 'core/missing-body-check';
module.exports = check;

},{"../indicator-tester":19,"../utils":22}],8:[function(require,module,exports){
/**
 * separate-body-from-header-check.js
 */
var utils = require('../utils');

var check = (config) => {
    return {
        visitMessage: (reporter, message) => {
            if (message.lines.length > 1 && !utils.isEmpty(message.lines[1].trimmedText)) {
                reporter.report(`Separate body from header by an empty newline`, {row: 2});
            }
        }
    };
};
check.id = 'core/separate-body-from-header-check';
module.exports = check;

},{"../utils":22}],9:[function(require,module,exports){
/**
 * single-space-separator-check.js
 */
var utils = require('../utils');

var check = (config) => {
    return {
        visitLine: (reporter, line) => {
            var text = line.text;
            if (!utils.isEmpty(text)) {
                utils.forEachMatch(/[^\s](\s+)[^\s]/, text, function(match) {
                    var whitespaces = match[1];
                    if (whitespaces !== ' ') {
                        reporter.report(`Only use a single space character`, {
                            text: whitespaces,
                            row: line.row,
                            column: match.index + 2
                        });
                    }
                })
            }
        }
    };
};
check.id = 'core/single-space-separator-check';
module.exports = check;

},{"../utils":22}],10:[function(require,module,exports){
/**
 * ticket-prefix-check.js
 */
var utils = require('../utils');

var check = (config) => {
    var pattern = (config.ticket && config.ticket.pattern) ? config.ticket.pattern : null;
    return {
        visitHeader: (reporter, header) => {
            if (!pattern) return;
            var text = header.text;
            var firstWord = utils.getFirstWord(text);
            if (!utils.isWord(firstWord) && !text.match(config.ticket.pattern)) {
                var prefix = text.split(/\s+/)[0];
                reporter.report(`Wrong ticket prefix`, {
                    text: prefix,
                    row: 1,
                    column: 1
                });
            }
        }
    };
};
check.id = 'core/ticket-prefix-check';
module.exports = check;

},{"../utils":22}],11:[function(require,module,exports){
/**
 * unnecessary-newline-check.js
 */
var utils = require('../utils');

var check = (config) => {
    return {
        visitLine: (reporter, line) => {
            if (!line.previousLine) return;

            if (utils.isEmpty(line.text) && utils.isEmpty(line.previousLine.text)) {
                reporter.report(`Remove unnecessary newline`, {row: line.row});
            }
        }
    };
};
check.id = 'core/unnecessary-newline-check';
module.exports = check;

},{"../utils":22}],12:[function(require,module,exports){
/**
 * unnecessary-whitespace-check.js
 */
var utils = require('../utils');

var check = (config) => {
    return {
        visitLine: function(reporter, line) {
            if (!line.text) return;

            var text = line.text;
            if (!line.trimmedText) {
                reporter.report(`Empty line contains whitespaces`, {
                    text,
                    row: line.row,
                    column: 1
                });
            } else {
                if (!line.isEnumeration) {
                    utils.forEachMatch(/^\s+/, text, (match) => {
                        reporter.report(`Line starts with whitespaces`, {
                            text: match[0],
                            row: line.row,
                            column: match.index + 1
                        });
                    });
                }
                utils.forEachMatch(/\s+$/, text, (match) => {
                    reporter.report(`Line ends with whitespaces`, {
                        text: match[0],
                        row: line.row,
                        column: match.index + 1
                    });
                });
            }
        }
    };
};
check.id = 'core/unnecessary-whitespace-check';
module.exports = check;

},{"../utils":22}],13:[function(require,module,exports){
/**
 * upper-case-at-beginning-check.js
 */
var utils = require('../utils');

var check = (config) => {
    return {
        visitHeader: (reporter, header) => {
            var title = header.title;
            if (utils.startsWithLowerCase(title) && utils.isWord(utils.getFirstWord(title))) {
                reporter.report(`Start header title with upper case`, {
                    text: title[0],
                    row: header.row,
                    column: header.text.indexOf(title) + 1
                });
            }
        },
        visitBodyLine: (reporter, line) => {
            var trimmedText = line.trimmedText;
            if (trimmedText
                && (line.row === 2 || !line.previousLine.trimmedText)
                && utils.startsWithLowerCase(trimmedText)
                && utils.isWord(utils.getFirstWord(trimmedText))) {
                reporter.report(`Start paragraph with upper case`, {
                    text: trimmedText[0],
                    row: line.row,
                    column: line.text.indexOf(trimmedText) + 1
                });
            }
        }
    };
};
check.id = 'core/upper-case-at-beginning-check';
module.exports = check;

},{"../utils":22}],14:[function(require,module,exports){
/**
 * default-config.js
 */

// TODO:
// All checks: Ignore/Adjust functionality
// Line length check: Hard coded resource enumeration

var createDefaultConfig = () => {
    return {
        headerLength: 50,
        lineLength: 72,
        commentChar: '#',
        enumeration: ['* ', '- ', /[0-9]+\. /, /\[[0-9]+\] /]
    };
};

module.exports = {
    create: (config) => {
        return Object.assign(createDefaultConfig(), config);
    }
};

},{}],15:[function(require,module,exports){
/**
 * checks.js
 */
var checks = new Map();
// TODO: Require all checks in checks folder automatically. How to work with browserify?
var tempChecks = [
    require('./checks/enumeration-indentation-check'),
    require('./checks/header-delimiter-check'),
    require('./checks/imperative-check'),
    require('./checks/line-length-check'),
    require('./checks/missing-body-check'),
    require('./checks/separate-body-from-header-check'),
    require('./checks/single-space-separator-check'),
    require('./checks/ticket-prefix-check'),
    require('./checks/unnecessary-newline-check'),
    require('./checks/unnecessary-whitespace-check'),
    require('./checks/upper-case-at-beginning-check'),
    require('./checks/improve-message-check')
];

tempChecks.forEach((check) => {
    checks.set(check.id, check);
});

module.exports = {
    ALL: 'core/*',
    get: (check) => checks.get(check),
    getAll: () => Array.from(checks.values())
};

},{"./checks/enumeration-indentation-check":2,"./checks/header-delimiter-check":3,"./checks/imperative-check":4,"./checks/improve-message-check":5,"./checks/line-length-check":6,"./checks/missing-body-check":7,"./checks/separate-body-from-header-check":8,"./checks/single-space-separator-check":9,"./checks/ticket-prefix-check":10,"./checks/unnecessary-newline-check":11,"./checks/unnecessary-whitespace-check":12,"./checks/upper-case-at-beginning-check":13}],16:[function(require,module,exports){
/**
 * formatter.js
 */
var utils = require('./utils');

module.exports = (config) => {
    var isComment = (line) => line.startsWith(config.commentChar);
    var isEnumeration = (line) =>  getEnumerationIndentation(line) !== '';
    var getEnumerationIndentation = (line) => {
        var enumerationIndentation = '';
        utils.someStartsWith(config.enumeration, line, (match) => {
            enumerationIndentation = ' '.repeat(match[0].length);
        });
        return enumerationIndentation;
    };

    var splitLine = (line) => {
        var prefix = '';
        var maxLineLength = config.lineLength;
        var indentation = getEnumerationIndentation(line);
        var split = [];

        while (line.length > maxLineLength) {
            var lastSpaceIndex = line.substr(0, maxLineLength + 1).lastIndexOf(' ');
            var firstSpaceIndex = line.indexOf(' ');

            if (lastSpaceIndex === -1) {
                if (firstSpaceIndex === -1) {
                    break;
                }
                lastSpaceIndex = firstSpaceIndex;
            }
            split.push(prefix + line.substring(0, lastSpaceIndex));
            line = line.substring(lastSpaceIndex + 1);

            if (indentation) {
                maxLineLength -= indentation.length;
                prefix = indentation;
                indentation = '';
            }
        }
        split.push(prefix + line);
        return split;
    };
    return {
        format: (commitMessage, ignore) => {
            if (!commitMessage || (utils.isString(commitMessage) && utils.isGeneratedMessage(commitMessage))) return commitMessage;
            if (!Array.isArray(commitMessage)) commitMessage = commitMessage.split('\n');
            if (!ignore) ignore = [];

            var previousLine = '';
            var preparedLines = [];
            var preparedIgnore = [];
            commitMessage.forEach((line, index) => {
                var row = index + 1;
                if (ignore.includes(row)) {
                    preparedLines.push(line);
                    preparedIgnore.push(row);
                    return;
                }

                var trimmed = line.trim();
                if (!trimmed || !previousLine || row === 2 || isComment(trimmed) || isEnumeration(trimmed) || ignore.includes(row - 1)) {
                    preparedLines.push(trimmed);
                } else {
                    preparedLines[preparedLines.length - 1] += ' ' + trimmed;
                }
                previousLine = trimmed;
            });

            var formattedLines = [];
            var formattedIgnores = [];
            preparedLines.forEach((line, index) => {
                var row = index + 1;
                if (preparedIgnore.includes(row)) {
                    formattedLines.push(line);
                    formattedIgnores.push(formattedLines.length);
                } else if (!line || isComment(line) || row === 1) {
                    formattedLines.push(line);
                } else {
                    if (row === 2 && line) {
                        formattedLines.push('');
                    }
                    splitLine(line).forEach((splitLine) => {
                        formattedLines.push(splitLine);
                    });
                }
            });

            ignore.splice(0, ignore.length);
            utils.pushAll(ignore, formattedIgnores);
            return formattedLines.join('\n');
        }
    }
};

},{"./utils":22}],17:[function(require,module,exports){
/**
 * forward-reporter.js
 */

module.exports = (reporters) => {
    var listeners = [];
    var forwarder = {
        report: function(message, info) {
            if (!info.length) {
                info.length = (info.text) ? info.text.length : 0;
            }
            if (!info.column) {
                info.column = 0;
            }

            listeners.forEach((listener) => {
                if (listener.report) {
                    listener.report(message, info);
                }
            });
        },
        exception: function(e) {
            listeners.forEach((listener) => {
                if (listener.exception) {
                    listener.exception(e);
                }
            });
        },
        register: function(reporters) {
            if (!Array.isArray(reporters)) reporters = [reporters];
            reporters.forEach((reporter) => {
                listeners.push(reporter);
            })
        }
    };

    forwarder.register(reporters);
    return forwarder;
};

},{}],18:[function(require,module,exports){
/**
 * index.js
 */
require('./polyfill');
var utils = require('./utils');
var forwardReporter = require('./forward-reporter');
var coreChecks = require('./core-checks');

module.exports = (config) => {
    config = require('./config').create(config);
    var checks = new Set();
    var formatter = require('./formatter')(config);
    var parser = require('./parser')(config);
    return {
        register: function(check) {
            // TODO: Handle iterables
            if (utils.isString(check)) {
                if (check === coreChecks.ALL) {
                    coreChecks.getAll().forEach((check) => checks.add(check(config)));
                } else {
                    checks.add((coreChecks.get(check))(config));
                }
            } else if (utils.isFunction(check)) {
                checks.add(check(config));
            } else {
                checks.add(check);
            }
        },
        check: function(commitMessage, reporter) {
            if (!reporter) throw new Error('Undefined reporter');
            reporter = forwardReporter(reporter);
            if (Array.isArray(commitMessage)) commitMessage = commitMessage.join('\n');
            if (!commitMessage || utils.isGeneratedMessage(commitMessage)) return;
            if (!checks.size) this.register(coreChecks.ALL);

            var parsed = parser.parse(commitMessage);
            var message = parsed.message;
            var lines = parsed.lines;
            checks.forEach((check) => {
                try {
                    if (check.visitMessage) check.visitMessage(reporter, message);
                    if (check.visitHeader) check.visitHeader(reporter, message.header);
                    if (check.visitBody) check.visitBody(reporter, message.body);
                    lines.forEach((line, index) => {
                        if (check.visitLine) check.visitLine(reporter, line);
                        if (index > 1) {
                            if (check.visitBodyLine) check.visitBodyLine(reporter, line);
                        }
                    });
                } catch (e) {
                    reporter.exception(e);
                }
            });
        },
        format: function(commitMessage, ignore) {
            return formatter.format(commitMessage, ignore, config);
        }
    };
};

},{"./config":14,"./core-checks":15,"./formatter":16,"./forward-reporter":17,"./parser":20,"./polyfill":21,"./utils":22}],19:[function(require,module,exports){
/**
 * indicator-tester.js
 */
var utils = require('./utils');
var toRegex = (o) => (o instanceof RegExp) ? o : new RegExp(o.toString(), 'i');
var toIndicator = (o) => {
    if (utils.isString(o)) {
        o = {include: o};
    }
    if (utils.isString(o.include)) {
        o.include = toRegex(o.include, 'i');
    }
    if (utils.isString(o.exclude)) {
        o.exclude = toRegex(o.exclude, 'i');
    }
    return o;
};

module.exports = (indicators) => {
    var mappedIndicators = indicators.map(toIndicator);
    return {
        test: (text) => {
            var result = false;
            mappedIndicators.some((indicator) => {
                var include = indicator.include;
                var exclude = indicator.exclude;
                if (include && include.test(text) && (!exclude || !exclude.test(text))) {
                    result = true;
                    return true;
                }
            });
            return result;
        }
    }
};

},{"./utils":22}],20:[function(require,module,exports){
/**
 * parser.js
 */
var utils = require('./utils');

module.exports = (config) => {
    var getLines = (commitMessage, message) => {
        var isEnumeration = false;
        var enumeration = '';
        var previousLine = undefined;
        return commitMessage.split('\n').map((line, index, lines) => {
                if (isEnumeration && utils.isEmpty(line)) {
                    isEnumeration = false;
                    enumeration = '';
                } else {
                    utils.someStartsWith(config.enumeration, line, (match) => {
                        isEnumeration = true;
                        enumeration = match[0];
                    });
                }

                var result = {
                    lineIndex: index,
                    lineNumber: index + 1,
                    row: index + 1,
                    isFirstLine: index === 0,
                    isHeader: index === 0,
                    isLastLine: index === lines.length - 1,
                    text: line,
                    trimmedText: line.trim(),
                    message,
                    commitMessage,
                    isEnumeration,
                    enumeration,
                    previousLine
                };

                if (index === 0) {
                    var title = result.trimmedText;
                    if (config.ticket && title.search(config.ticket.pattern) === 0) {
                        title = title.replace(config.ticket.pattern, '');
                    } else if (config.threshold) {
                        config.threshold.some((pattern) => {
                            if (title.match(pattern)) {
                                title.replace(pattern, '');
                                return true;
                            }
                        })
                    }
                    result.title = title.trim();
                }

                if (previousLine) {
                    previousLine.nextLine = result;
                }
                previousLine = result;
                return result;
            }
        );
    };

    var getBody = (lines) => {
        var firstBodyLine = lines.findIndex((line, index) => index > 0 && !utils.isEmpty(line.text));
        return (firstBodyLine === -1) ? [] : lines.slice(firstBodyLine);
    };
    return {
        parse: function(commitMessage) {
            var message = {};
            var lines = getLines(commitMessage, message);

            message.text = commitMessage;
            message.header = lines[0];
            message.body = getBody(lines);
            message.lines = lines;

            message.lines.forEach((line) => {
                if (!line.isEnumeration) return;
            });

            return {message, lines};
        }
    }
};

},{"./utils":22}],21:[function(require,module,exports){
/**
 * polyfill.js
 */

if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement /*, fromIndex*/) {
        'use strict';
        var O = Object(this);
        var len = parseInt(O.length) || 0;
        if (len === 0) {
            return false;
        }
        var n = parseInt(arguments[1]) || 0;
        var k;
        if (n >= 0) {
            k = n;
        } else {
            k = len + n;
            if (k < 0) {
                k = 0;
            }
        }
        var currentElement;
        while (k < len) {
            currentElement = O[k];
            if (searchElement === currentElement ||
                (searchElement !== searchElement && currentElement !== currentElement)) {
                return true;
            }
            k++;
        }
        return false;
    };
}

},{}],22:[function(require,module,exports){
/**
 * utils.js
 */
var BREAK = Symbol('break');

var utils = {
    isEmpty: (text) => text.trim().length === 0,
    isFunction: (o) => typeof o === 'function',
    isRegExp: (o) => o instanceof RegExp,
    isString: (o) => typeof o === 'string' || o instanceof String,
    isWord: (word) => word.match(/^[A-Za-z][a-z]*$/),
    pushAll: (a1, a2) =>  a1.push.apply(a1, a2),
    toArray: (o) => {
        if (o === undefined) {
            return [];
        } else if (Symbol.iterator in o) {
            return Array.from(o);
        } else {
            return [o];
        }
    },
    startsWithLowerCase: (word) => word.match(/^[a-z]/),
    getFirstWord: (line) => line.trim().split(/\s+/)[0],
    getFlags: (regex) => (regex.ignoreCase ? 'i' : '') + (regex.multiline ? 'm' : '') + (regex.global ? 'g' : ''),
    forEachMatch: (against, text, callback) => {
        if (!against || !text || !callback) return;
        against = utils.toArray(against);

        var match;
        for (var a of against) {
            var source;
            var flags = 'g';
            if (utils.isString(a)) {
                source = a.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            } else if (utils.isRegExp(a)) {
                source = a.source;
                flags += utils.getFlags(a);
            } else {
                throw new Error('Cannot create a RegExp from a non-string or non-regexp');
            }
            var regexp = new RegExp(source, flags);
            while ((match = regexp.exec(text)) !== null) {
                if (callback) {
                    if (callback(match) === BREAK) {
                        return;
                    }
                }
            }
        }
    },
    someStartsWith: (against, text, callback) => {
        var startsWith = false;
        utils.forEachStartsWith(against, text, function() {
            if (callback) {
                callback.apply(callback, arguments);
            }
            startsWith = true;
            return BREAK;
        });
        return startsWith;
    },
    forEachStartsWith: (against, text, callback) => {
        if (!against || !text || !callback) return;
        against = utils.toArray(against).map((a) => {
            var source;
            var flags = '';
            if (utils.isString(a)) {
                source = a.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            } else if (utils.isRegExp(a)) {
                source = a.source;
                flags = utils.getFlags(a);
            } else {
                throw new Error('Cannot create a RegExp from a non-string or non-regexp');
            }
            return new RegExp('^' + source, flags);
        });
        utils.forEachMatch(against, text, callback);
    },
    isGeneratedMessage: (commitMessage) => {
        return commitMessage.match(/^Merge pull request #[0-9]+/) || commitMessage.match(/^Revert /)
    }
};
module.exports = utils;

},{}]},{},[1])