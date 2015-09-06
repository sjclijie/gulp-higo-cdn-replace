gulp-cdn-replace
================

## Install
```
npm install gulp-higo-cdn-replace --save-dev
```

## Example
### `gulpfile.js`
```js

var replace = require('gulp-higo-cdn-replace');
var config = require("./uploadedFile.json");

gulp.task('cdn', function() {
    gulp.src('./src/**/*')
        .pipe(replace(config))
        .pipe(gulp.dest('./dist'));
});
```
