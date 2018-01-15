var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');

//sass
gulp.task('sass', function () {
    gulp.src('assets/scss/*.scss')
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(concat('main.min.css'))
        .pipe(gulp.dest('assets/'));

    gutil.log('SCSS compiled and minified!');
});

//js
gulp.task('js', function () {
    gulp.src('assets/js/*.js')
        .pipe(uglify().on('error', function(e){
            console.log(e);
         }))
        .pipe(concat('main.min.js'))
        .pipe(gulp.dest('assets/'));

    gutil.log('JS minified!');
});

gulp.task('watch', function(){
    gulp.watch('assets/scss/*.scss', ['sass']);
    gulp.watch('assets/js/*.js', ['js']);
});

// Default task
gulp.task('default', function () {
    gulp.start('sass');
    gulp.start('js');
    gulp.start('watch');
});