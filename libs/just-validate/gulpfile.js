const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass');
const prefix = require('gulp-autoprefixer');
const cssnano = require('gulp-cssnano');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const rename = require('gulp-rename');

const ASSETS_PATH = 'src';
const PROD_PATH = 'dist';

gulp.task('sass', () => gulp
  .src(`${ASSETS_PATH}/scss/**/*.scss`)
  .pipe(sass())
  .pipe(gulp.dest(`${ASSETS_PATH}/css/`))
  .pipe(browserSync.stream()));

gulp.task('compressCSS', () => gulp
  .src([
    `${ASSETS_PATH}/css/**/*.css`,
    `!${ASSETS_PATH}/css/**/*.min.css`,
  ])
  .pipe(
    prefix({
      browsers: ['last 10 versions'],
    }),
  )
  .pipe(gulp.dest(`${PROD_PATH}/css/`))
  .pipe(cssnano({ autoprefixer: false, zindex: false }))
  .pipe(
    rename({
      suffix: '.min',
    }),
  )
  .pipe(gulp.dest(`${PROD_PATH}/css/`)));

gulp.task('compressJS', () => gulp
  .src([`${PROD_PATH}/js/*.js`, `!${PROD_PATH}/js/*.min.js`])
  .pipe(uglify())
  .pipe(
    rename({
      suffix: '.min',
    }),
  )
  .pipe(gulp.dest(`${PROD_PATH}/js`)));

gulp.task('buildJS', () => gulp
  .src(['src/js/polyfills.js', 'src/js/app.js'])
  .pipe(concat('just-validate.js'))
  .pipe(babel())
  .pipe(gulp.dest(`${PROD_PATH}/js`)));

gulp.task('watch', () => {
  gulp.watch(`${ASSETS_PATH}/css/**`, () => {
    browserSync.stream();
  });
  gulp.watch([`${ASSETS_PATH}/scss/**/*.scss`], gulp.series('sass'));
  gulp.watch([`${ASSETS_PATH}/**/*.js`, `${ASSETS_PATH}*.html`], () => {
    browserSync.reload;
  });
});

gulp.task('browserSync', () => browserSync.init({
  notify: false,
  server: {
    baseDir: `./${ASSETS_PATH}/`,
  },
}));

gulp.task('browserSync:prod', () => browserSync.init({
  server: {
    baseDir: `./${PROD_PATH}/`,
  },
}));

gulp.task('default', gulp.parallel('browserSync', 'watch'));

gulp.task('prod', gulp.parallel('browserSync:prod'));

// ------------ BEGIN: PRODUCTION TASKS ---------------

gulp.task('build', gulp.series('compressCSS', 'buildJS', 'compressJS'));
// ------------ END:   PRODUCTION TASKS ---------------
