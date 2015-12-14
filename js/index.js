/**
 * index.js
 */

var myComCheck = comcheck({
    headerLength: 69,
    ticket: {
        pattern: /^[A-Z]+-[1-9][0-9]* /,
        threshold: [
            /^[A-Za-z]+-[0-9]+\s+/
        ]
    }
});
var $commitsContainer = $('.commits-container');

var $commitField = $('.commit-field');
comcheckWidget($commitField, myComCheck);

var getRepository = (repository) => {
    var match = repository.match(/([^\/]+\/[^\/]+)\/?\s*$/);
    if (match) {
        return match[1];
    }
};

var verifyHash = (repository, type, value) => {
    if (!repository) {
        showError('Invalid Repository', 'Use https://github.com/Catrobat/Catroid or Catrobat/Catroid');
        return false;
    }

    if (type === 'pull-request') {
        if (!value.match(/^[1-9][0-9]+$/)) {
            showError('Invalid Repository', 'Use https://github.com/Catrobat/Catroid or Catrobat/Catroid');
            return false;
        }
    } else if (type === 'commit') {
        if (!value.match(/^[0-9A-Fa-f]{5,40}$/)) {
            showError('Invalid SHA', '');
            return false;
        }
    } else if (type === 'branch') {
        if (!value) {
            showError('Invalid SHA', '');
            return false;
        }
    } else {
        showError('Invalid Type', 'Select a valid type');
        return false;
    }
    return true;
};

var setHash = (repository, type, value) => {
    repository = getRepository(repository);
    if (verifyHash(repository, type, value)) {
        location.hash = repository + '/' + type + '/' + value;
    }
};

var parseHash = (hash) => {
    if (hash[0] === '#') {
        hash = hash.substring(1);
    }
    var match = hash.match(/^([^\/]+\/[^\/]+)\/(pull-request|branch|commit)\/(.+)$/);
    if (match) {
        var repository = match[1];
        var type = match[2];
        var value = match[3];
        if (verifyHash(repository, type, value)) {
            return {repository, type, value}
        }
    }
};

$('#check-button').click((e) => {
    e.preventDefault();
    setHash(
        $('#repository').val().trim() || 'Catrobat/Catroid',
        $('#select').val().trim() || 'branch',
        $('#various').val().trim() || 'develop');
});

var showError = (title, message) => {
    $commitsContainer.html(`
<div class="bs-component">
    <div class="alert alert-dismissible alert-danger">
        <span><strong>${title}!</strong><br>${message}</span>
  </div>
</div>`);
};

$(window).on('hashchange', () => {
    var parsedHash = parseHash(location.hash);
    if (!parsedHash) {
        return;
    }

    var repository = parsedHash.repository;
    var type = parsedHash.type;
    var value = parsedHash.value;

    $('#repository').val(parsedHash.repository);
    $('#select').val(parsedHash.type);
    $('#various').val(parsedHash.value);

    var url = 'https://api.github.com/repos/' + repository + '/';
    if (type === 'pull-request') {
        url += 'pulls/' + value + '/commits';
    } else {
        url += 'commits?sha=' + value;
    }
    $.getJSON(url, (commits) => {
        $commitsContainer.empty();
        commits.forEach((commitData) => {
            var commit = commitData.commit;
            var committer = commitData.committer || {
                    login: commit.committer.name
                };
            var $e = $('<div style="margin: auto"></div>');
            comcheckWidget($e, myComCheck, commit.message, {
                avatar: committer.avatar_url,
                committer: committer.login,
                url: committer.html_url,
                date: new Date(commit.committer.date)
            });
            $commitsContainer.append($e);
        });
        $commitsContainer.find('.preview-tab').trigger("click");

        var errors = 0;
        $commitsContainer.find('.badge-preview-errors, .badge-preview-fixed').each(function() {
            var value = parseInt($(this).text());
            if (Number.isInteger(value)) {
                errors += value;
            }
        });

        var formattedCommitMessages = $commitsContainer.find('.commit-tab-text.changes').length;
        if (formattedCommitMessages) {
            $commitsContainer.prepend(`
<div class="bs-component">
    <div class="alert alert-warning">
        <h4>Warning!</h4>
        <span><strong>${formattedCommitMessages}</strong> commit${(formattedCommitMessages > 1) ? 's have' : ' has'} been auto-formatted.</span>
    </div>
<div>`);
        }

        if ($commitsContainer.find('.report-bug.blink-error').length) {
            $commitsContainer.prepend(`
<div class="bs-component">
    <div class="alert alert-danger">
        <h4>Internal Error!</h4>
        <span>During processing the commit message${(commits.length) ? 's' : ''}, <strong>exceptions</strong> have been thrown.<br>
        Please inspect the message${(commits.length) ? 's' : ''} by hand and <a class="alert-link" href="https://github.com/robertpainsi/comcheck">report a bug!</a></span>
    </div>
<div>`);
        }

        if (errors) {
            $commitsContainer.prepend(`
<div class="bs-component">
    <div class="alert alert-danger">
        <h4 style="margin-bottom: 0; text-align: center">Found <strong>${errors} violation${(errors) ? 's' : ''}</strong>!</h4>
    </div>
<div>`);
        } else {
            $commitsContainer.prepend(`
<div class="bs-component">
    <div class="alert alert-success">
        <h4 style="margin-bottom: 0; text-align: center">Well formatted!</h4>
    </div>
<div>`);
        }
    }).fail((response) => {
        showError(response.responseJSON.message, url);
    });
}).trigger('hashchange');
