var gulp = require('gulp');
var rename = require('gulp-rename');
var browserify = require('gulp-browserify');

gulp.task('browserify', function() {
    gulp.src('global-comcheck.js')
        .pipe(browserify())
        .pipe(rename('comcheck.js'))
        .pipe(gulp.dest('libs'))
});

gulp.task('deploy', ['browserify']);

