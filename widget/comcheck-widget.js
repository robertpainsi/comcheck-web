/**
 * comcheck-widget.js
 */

var comcheckWidget = function() {
    var TEMPLATE = `
<div class="commit">
<div style="
    background: #fff;
    background: linear-gradient(180deg, #ddd, #ddd);
    background-position: 50%;
    background-repeat: repeat-y;
    background-size: 1px auto;
    margin-right: 0.5em;">
<span class="octicon octicon-git-commit" style="
    color: #ccc;
    background-color: #fff;
    padding-top: -5px;
    transform: translate(1px, -1px);"></span><br>
</div>
<div class="well">
    <div class="flex">
        <div class="commit-details">
            <a class="committer-avatar" href="{{committerUrl}}">
                <img width="36" height="36" src="{{avatar}}">
            </a>
            <a class="committer-name" href="{{committerUrl}}">{{committer}}</a>
            <span>&nbsp;committed on {{date}}</span>
        </div>
        <a class="report-bug octicon octicon-bug" href="{{bugReportUrl}}" target="_blank" data-toggle="tooltip" data-placement="left" title="Report a bug"></a>
    </div>

    <ul class="nav nav-tabs">
        <li class="active">
            <a class="write-tab" href="#write-{{tab_id}}" data-toggle="tab">
                <span class="commit-tab-text">Write</span>
            </a>
        </li>
        <li class="">
            <a class="preview-tab" href="#preview-{{tab_id}}" data-toggle="tab">
                <span class="commit-tab-text">Preview</span>
                <span class="badge badge-preview-fixed" data-container="body" data-toggle="tooltip" data-placement="bottom" title="Auto-format fixes"></span>
                <span class="badge badge-preview-errors" data-container="body" data-toggle="tooltip" data-placement="bottom" title="Errors"></span>
            </a>
        </li>
    </ul>
    <div class="tab-content-background">
        <div class="tab-content">
            <div id="write-{{tab_id}}" class="tab-pane fade in active">
                <div class="write-tab-content tab-content">
                    <div class="commit-message line-numbers"></div>
                    <textarea class="form-control commit-message commit-message-textarea" rows="3" cols="74"></textarea>
                </div>
            </div>
            <div id="preview-{{tab_id}}" class="tab-pane fade commit-message">
                <div class="preview-tab-content tab-content">
                    <div class="commit-message line-numbers"></div>
                    <pre class="commit-message commit-message-preview"></pre>
                </div>
                <div class="checkbox auto-format">
                    <label><input type="checkbox" checked> Auto-format</label>
                    <a href="#" class="btn btn-primary copy" data-container="body" data-original-title="Copied to clipboard!">Copy</a>
                </div>
            </div>
        </div>
    </div>
</div>
</div>`;

    var point = function() {
        var points = new Map();

        var isPositiveInteger = (x) => Number.isInteger(x) && x > 0;
        var inText = (x, y) => isPositiveInteger(x) && isPositiveInteger(y);

        return (x, y) => {
            var key = `${x}/${y}`;
            var point = points.get(key);
            if (!point) {
                point = {
                    x: x,
                    y: y,
                    inText: inText(x, y),
                    isNearby: function(p) {
                        return this.y === p.y && Math.abs(this.x - p.x) <= 1;
                    }
                };
                points.set(key, point);
            }
            return point;
        };
    }();

    var comparePoints = (a, b) => {
        if (a.y !== b.y) {
            return a.y - b.y;
        } else {
            return a.x - b.x;
        }
    };

    var range = function(from, to) {
        if (!to) to = from;
        var length = function() {
            return Math.abs(this.to.x - this.from.x) + 1;
        };
        return {from, to, length};
    };

    var utils = {
        equalsSet: (s1, s2) => {
            if (s1.size !== s2.size) return false;

            for (var e of s1) {
                if (!s2.has(e)) return false;
            }
            return true;
        },
        randomHash: () => {
            var chars = '0123456789abcdef';
            var hash = '';
            for (var i = 0; i < 32; i++) {
                hash += chars[Math.floor(Math.random() * chars.length)];
            }
            return hash;
        },
        toRegex: (string, flags) => new RegExp(string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), flags),
        copyToClipboard: (text) => {
            var textArea = document.createElement("textarea");
            textArea.style.position = 'fixed';
            textArea.style.top = 0;
            textArea.style.left = 0;
            textArea.style.width = '2em';
            textArea.style.height = '2em';
            textArea.style.padding = 0;
            textArea.style.border = 'none';
            textArea.style.outline = 'none';
            textArea.style.boxShadow = 'none';
            textArea.style.background = 'transparent';
            textArea.value = text;
            document.body.appendChild(textArea);

            textArea.select();
            var success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        }
    };

    var changeTooltipText = ($e, text) => {
        $e.tooltip('hide').attr('data-original-title', text);
    };

    var addMessage = function(cells, location, message) {
        var messages = cells.get(location);
        if (!messages) {
            messages = new Set();
            cells.set(location, messages);
        }
        messages.add(message);
    };

    var getErrorClass = (errorsCount) => {
        var errorClass = 'comcheck ';
        switch (errorsCount) {
            case 1:
                return errorClass + 'error count1';
            case 2:
                return errorClass + 'error count2';
            case 3:
                return errorClass + 'error count3';
            default:
                return errorClass + 'error';
        }
    };

    var replaceInTemplate = (template, data) => {
        Object.keys(data).forEach((key) => {
            template = template.replace(utils.toRegex('{{' + key + '}}', 'g'), data[key]);
        });

        // TODO:
        var match = template.match(/{{[^}]+}}/g);
        if (match) {
            console.log('Missing data for template', match);
        }

        return template;
    };

    var toCommitDate = (() => {
        var now = new Date();
        return (date) => {
            var result = date.toLocaleString('en', {month: "long"}) + ' ' + date.getDate();
            if (now.getFullYear() !== date.getFullYear()) {
                result += ', ' + date.getFullYear();
            }
            return result;
        }
    })();

    var tab_id = 1;

    function ComcheckWidget($e, comcheck, message, config) {
        config = config || {};
        var content = replaceInTemplate(TEMPLATE, Object.assign({
            committer: 'You',
            avatar: 'data:image/png;base64,' + new Identicon(utils.randomHash(), 36).toString(),
            committerUrl: '#',
            bugReportUrl: 'https://github.com/robertpainsi/comcheck'
        }, config, {
            tab_id: tab_id++,
            date: toCommitDate(new Date(config.date || new Date()))
        }));

        var $widget = $(content);
        this.comcheck = comcheck;

        if (!config.url) {
            $widget.find('.github-username, .github-avatar').click((e) => {
                $(this).tooltip('hide');
                e.preventDefault()
            });
            $widget.find('.github-username')
                .append('&nbsp;<span class="octicon octicon-question"></span>')
                .attr('data-toggle', 'tooltip')
                .attr('data-placement', 'bottom')
                .attr('title', 'Unrecognized author. If this is you, make sure your git email is associated with your account.');
        }

        this.$widget = $widget;
        this.$reportBug = $widget.find('.report-bug');
        this.$commitMessageTextarea = $widget.find('.commit-message-textarea');
        this.$commitMessagePreview = $widget.find('.commit-message-preview');

        this.$badgeFixed = $widget.find('.badge-preview-fixed');
        this.$badgeErrors = $widget.find('.badge-preview-errors');

        this.$previewTab = $widget.find('.preview-tab');
        this.$previewTabText = this.$previewTab.find('.commit-tab-text');
        this.$previewTab.on('shown.bs.tab', () => {
            this.update(true);
        });
        this.$copy = $widget.find('.copy');
        this.$copy.tooltip({
            placement: 'bottom',
            trigger: 'manual',
            template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner large success-tooltip"></div></div>'
        });
        this.$autoFormat = $widget.find('.auto-format input[type="checkbox"]');
        this.$autoFormat.click(() => {
            this.update(true);
        });

        var copyTimeout;
        this.$copy.click((e) => {
            e.preventDefault();
            clearTimeout(copyTimeout);
            var content = this.$commitMessagePreview.text();
            if (utils.copyToClipboard(content)) {
                this.$copy.tooltip('show');
                copyTimeout = setTimeout(() => {
                    this.$copy.tooltip('hide');
                }, 1200);
            } else {
                window.prompt("Copy to clipboard:", content);
            }
        });

        $widget.find('[data-toggle="tooltip"]').tooltip();
        this.$commitMessageTextarea.val(message);

        this.$writeLineNumbers = this.$widget.find('.write-tab-content').find('.line-numbers');
        this.$previewLineNumbers = this.$widget.find('.preview-tab-content').find('.line-numbers');

        var $writeLineNumbers = this.$writeLineNumbers;
        var first = true;
        var self = this;
        var t;
        autosize(this.$commitMessageTextarea)
            .keydown(function() {
                clearTimeout(t);
                var cursorStart = this.selectionStart;
                var oldMessage = this.value;
                setTimeout(() => {
                    var cursorEnd = this.selectionStart;
                    var message = this.value;
                    if (!first && oldMessage === message) return;
                    first = false;

                    var skipLines = [];
                    $writeLineNumbers.find('.line-number[data-skip="true"]').each(function() {
                        skipLines.push(parseInt($(this).attr('data-line')));
                    });

                    var startLine = oldMessage.substring(0, cursorStart).split('\n').length;
                    var endLine = message.substring(0, cursorEnd).split('\n').length;
                    var offset = message.split('\n').length - oldMessage.split('\n').length;
                    if (startLine < endLine) {
                        skipLines = skipLines.map((line) => (line >= endLine) ? line + offset : line);
                        if (skipLines.includes(startLine)) {
                            for (var line = startLine + 1; line <= endLine; line++) {
                                skipLines.push(line);
                            }
                        }
                    } else {
                        skipLines = skipLines.map((line) => (line > endLine) ? line + offset : line);
                    }

                    var content = '';
                    message.split('\n').forEach((line, index) => {
                        var lineNr = index + 1;
                        var skip = skipLines.includes(lineNr) ? 'true' : '';
                        content += `<a class="line-number" data-line="${lineNr}" data-skip="${skip}">${lineNr}`;
                        if (line.length > 72) {
                            var exceedingLines = Math.floor((line.length - 1) / 72) + 1;
                            content += '<br>'.repeat(exceedingLines);
                        }
                        content += '</a>';
                    });
                    $writeLineNumbers.html(content)
                        .find('.line-number').click(function() {
                        var $this = $(this);
                        $this.attr('data-skip', $this.attr('data-skip') ? '' : 'true');
                        self.update(false);
                    });
                    t = setTimeout(() => {
                        self.update(false);
                    }, 1000);
                }, 0);
            });
        setTimeout(() => {
            autosize.update(this.$commitMessageTextarea);
        }, 0);

        var e = jQuery.Event("keydown");
        e.which = 39;
        this.$commitMessageTextarea.trigger(e);

        this.update(false);
        $e.html($widget);
    }

    ComcheckWidget.prototype.update = function(updatePreview) {
        var skipLines = this.getSkippedLines(this.$writeLineNumbers);
        var message = this.getCommitMessage();
        var violations = this.getViolations(message, skipLines, true);
        if (this.isAutoformat()) {
            var violationsBeforeFormat = violations.length;
            var messageBeforeFormat = message;
            message = this.autoformat(message, skipLines);
            violations = this.getViolations(message, skipLines);
            if (violationsBeforeFormat > violations.length) {
                this.$badgeFixed.text(violationsBeforeFormat - violations.length).show();
            } else {
                this.$badgeFixed.hide();
            }

            if (messageBeforeFormat !== message) {
                this.$previewTabText.addClass('changes').tooltip({
                    container: 'body',
                    placement: 'bottom',
                    title: 'Modified by auto-formatter'
                });
            } else {
                this.$previewTabText.removeClass('changes').tooltip('disable');
            }
        } else {
            this.$previewTabText.removeClass('changes').tooltip('disable');
            this.$badgeFixed.hide();
        }

        if (violations.length) {
            this.$badgeErrors.text(violations.length).show();
        } else {
            this.$badgeErrors.hide();
        }

        if (updatePreview) {
            this.updatePreview(message, violations, skipLines);
        }
    };

    ComcheckWidget.prototype.updatePreview = function(message, violations, skipLines) {
        var violationEntries = this.getViolationEntries(violations);
        var lines = message.split('\n');

        var content = '';
        lines.forEach((line, index) => {
                var lineNr = index + 1;
                content += `<a class="line-number" data-line="${lineNr}">${lineNr}`;
                if (line.length > 72) {
                    var exceedingLines = Math.floor((line.length - 1) / 72) + 1;
                    content += '<br>'.repeat(exceedingLines);
                }
                content += '</a>';
            }
        )
        ;
        this.$previewLineNumbers.html(content);

        violationEntries.reverse().forEach((cellMessage) => {
            var range = cellMessage.range;
            if (range) {
                var messages = range.messages;
                var lineIndex = range.from.y - 1;
                var line = lines[lineIndex];

                var errorClass = getErrorClass(messages.size);
                lines[lineIndex] = line.substr(0, range.from.x - 1)
                    + `<span class="${errorClass}" data-toggle="tooltip" data-placement="bottom" data-html="true" data-original-title="${Array.from(messages).join('<br>')}">`
                    + line.slice(range.from.x - 1, range.to.x)
                    + '</span>'
                    + line.substr(range.to.x);
            } else {
                var messages = cellMessage.messages;
                var location = cellMessage.location;
                var $e;
                if (location.y === Infinity) {
                    $e = $(`<a class="line-number octicon octicon-no-newline" data-line="${Infinity}"></a>`);
                    this.$previewLineNumbers.append($e);
                } else {
                    $e = this.$previewLineNumbers.find(`.line-number[data-line="${location.y}"]`);
                }
                $e.addClass(getErrorClass(messages.size));
                $e.attr('data-toggle', 'tooltip');
                $e.attr('data-placement', 'bottom');
                $e.attr('data-html', 'true');
                $e.attr('data-original-title', Array.from(messages).join('<br>'));
            }
        });

        lines = lines.map((line, index, lines) => {
            var result;
            var skipClass = (skipLines.includes(index + 1)) ? 'skip' : '';
            if (index === 0) {
                result = '<span class="comcheck commit-message-header commit-message-line ' + skipClass + '">' + line + '</span>';
            } else {
                result = '<span class="comcheck commit-message-body-line commit-message-line ' + skipClass + '">' + line + '</span>';
            }

            if (index < lines.length - 1) {
                result += '\n';
            }
            return result;
        });
        this.$commitMessagePreview.html(lines);
        this.$widget.find('.preview-tab-content').find('[data-toggle="tooltip"]').tooltip();
    }
    ;

    ComcheckWidget.prototype.getCommitMessage = function() {
        return this.$commitMessageTextarea.val();
    };

    ComcheckWidget.prototype.getSkippedLines = function($lines) {
        var skipLines = [];
        $lines.find('.line-number[data-skip="true"]').each(function() {
            skipLines.push(parseInt($(this).attr('data-line')));
        });
        return skipLines;
    };

    ComcheckWidget.prototype.isAutoformat = function() {
        return this.$autoFormat.is(':checked');
    };

    ComcheckWidget.prototype.autoformat = function(message, skipLines) {
        return this.comcheck.format(message, skipLines);
    };

    ComcheckWidget.prototype.getViolations = function(message, skipLines, resetErrors) {
        var violations = [];
        if (resetErrors) {
            this.hideBug();
        }
        this.comcheck.check(message, {
            report: (message, info) => {
                if (skipLines.includes(info.row)) return;
                violations.push({
                    message: message,
                    info: info
                });
            },
            exception: (e) => {
                this.showBug();
            }
        });
        return violations;
    };

    ComcheckWidget.prototype.getViolationEntries = function(violations) {
        var cells = new Map();
        violations.forEach((violation) => {
            var info = violation.info;
            var message = violation.message;
            var location = point(info.column, info.row);

            if (location.inText) {
                for (var index = 0; index < info.length; index++) {
                    addMessage(cells, point(location.x + index, location.y), message);
                }
            } else {
                addMessage(cells, location, message);
            }
        });
        return this.concatCells(cells);
    };

    ComcheckWidget.prototype.concatCells = function(cells) {
        var rowMessages = [];
        var cellMessages = [];

        var previousEntry = null;
        var currentRange = null;
        Array.from(cells)
            .map((entry) => ({location: entry[0], messages: entry[1]}))
            .sort((a, b) => comparePoints(a.location, b.location))
            .forEach((entry) => {
                var location = entry.location;
                var messages = entry.messages;
                if (location.inText) {
                    if (currentRange && previousEntry
                        && location.isNearby(previousEntry.location)
                        && utils.equalsSet(messages, previousEntry.messages)) {
                        currentRange.to = location;
                    } else {
                        currentRange = range(location);
                        currentRange.messages = messages;
                        cellMessages.push({
                            range: currentRange,
                            messages: messages
                        });
                    }

                    previousEntry = entry;
                } else {
                    rowMessages.push(entry);
                    previousEntry = null;
                    currentRange = null;
                }
            });
        return rowMessages.concat(cellMessages);
    };

    ComcheckWidget.prototype.showBug = function() {
        this.$reportBug.addClass('blink-error');
        changeTooltipText(this.$reportBug, 'Internal Error. Please report a bug');
    };

    ComcheckWidget.prototype.hideBug = function() {
        this.$reportBug.removeClass('blink-error');
        changeTooltipText(this.$reportBug, 'Report a bug');
    };

    return function() {
        return ComcheckWidget.apply(Object.create(ComcheckWidget.prototype), arguments);
    }
}();
