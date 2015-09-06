'use strict';

var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var _ = require('lodash');

var jsReg = /<\s*script\s+.*src\s*=\s*["|']([^"']+)[^>]*><\s*\/\s*script\s*>/gim;
var cssReg = /<\s*link\s+.*href\s*=\s*["|']([^"']+)[^>]*>/gim;
var imgReg = /url\s*\(\s*['|"]?([^'")]+)['|"]?\s*\)/gim;
var base64Reg = /^data:image\/([^;]+);base64,/;

var isCss = function(str) {
    if (!str) return false;
    return /rel\s*=\s*["|']stylesheet["|']/.test(String(str));
};
var isHTTP = function(str) {
    if (!str) return false;
    return /^https?:/.test(String(str));
};
var isBase64 = function(str) {
    if (!str) return false;
    return base64Reg.test(str);
};

module.exports = function(config) {

    function getNewUrl(url, ext) {
        var paths = url.split('/');
        var filename = paths.pop();

        ext = ext || filename.split('.').pop();

        var prefix = option.root[ext] || '';
        prefix && (prefix[prefix.length - 1] === '/' || (prefix += '/'));

        paths.unshift(option.dir);

        var dir = path.resolve.apply(null, paths);

        try {
            var files = fs.readdirSync(dir);
            filename = filename.split('.');

            var newUrl = url;
            files.some(function(item) {
                item = item.split('.');
                if (filename[0] === item[0] && filename[filename.length - 1] === item[item.length - 1]) {
                    paths.shift();
                    newUrl = prefix + paths.join('/') + '/' + item.join('.');
                    return true;
                }
            });

            return newUrl;
        } catch (e) {
            return url;
        }
    }

    return through.obj(function(file, enc, fn) {

        if (file.isNull()) return fn(null, file);

        if (file.isStream()) return fn(new gutil.PluginError('gdulp-cdn-replace', 'Streaming is not supported'));

        // Buffer
        var contents = file.contents.toString();

        contents = contents.replace( /<img[^>]*(?:src|data\-src)=(?:"|')(\_\_CDN\_\_\/[^\s]*)(?:"|')[^>]*>/g, function( match , url){

            var trimUrl = _.trimLeft(url, "__CDN__/");

            var urlArr = trimUrl.split("?");

            var index = _.findIndex(config, function(c){
                return c.path == urlArr[0];
            });

            if ( index >= 0 && config[index]["url"] ){

                match = match.replace( url, config[index]["url"] );

            } else {

                match = match.replace("__CDN__", ".");
            }

            return match;
        });

        /*
        contents = contents.replace(jsReg, function(match, url) {
                isHTTP(url) || (match = match.replace(/src\s*=\s*["|']([^"'>]+)["|']/, 'src="' + getNewUrl(url, 'js') + '"'));
                return match;
            })
            .replace(cssReg, function(match, url) {
                isHTTP(url) || (isCss(match) && (match = match.replace(/href\s*=\s*["|']([^"']+)["|']/, 'href="' + getNewUrl(url, 'css') + '"')));
                return match;
            })
            .replace(imgReg, function(match, url) {
                isHTTP(url) || isBase64(url) || (match = match.replace(/url\s*\(\s*['|"]?([^'")]+)['|"]?\s*\)/, 'url("' + getNewUrl(url, 'css') + '")'));
                return match;
            });
        */

        file.contents = new Buffer(contents);

        this.push(file);

        fn(null);
    });
};
