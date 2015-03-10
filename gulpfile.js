var gulp = require('gulp');
var zip = require('gulp-zip');
 
gulp.task('default', function () {
  return gulp.src([
    './**/*',
    '!nlstatic_image_resize.zip'])
      .pipe(zip('nlstatic_image_resize.zip'))
      .pipe(gulp.dest('.'));
});
