/* eslint-env node */
const gulp = require("gulp"),
	concat = require("gulp-concat"),
	cache = require("gulp-cached"),
	less = require("gulp-less"),
	uglify = require("gulp-uglify"),
	sourcemaps = require('gulp-sourcemaps'),
	gulpIf = require('gulp-if'),
	source = require("vinyl-source-stream"),
	buffer = require('vinyl-buffer'),
	browserify = require("browserify"),
	watchify = require("watchify"),
	babelify = require("babelify"),
	errorify = require("errorify"),
	browserSync = require("browser-sync").create(),
	yargs = require("yargs"),
	del = require("del");

const src_dir = "./src",
	build_dir = "./build",
	production = yargs.argv.production;

const browserifyInstance = browserify({
		entries: [`main.js`],
		cache: {},
		packageCache: {},
		debug: true,
		basedir: `${src_dir}/js`,
	})
	.transform(babelify.configure({ // transpile es6+ code
		presets: ["@babel/preset-env"],
		sourceMaps: true,
	}));

function staticFiles() {
	return gulp.src(`${src_dir}/static/**/*`)
		.pipe(cache("static")) // do not copy file if it hasn't changed
		.pipe(gulp.dest(build_dir))
		.on("end", browserSync.reload);
}

function styles() {
	return gulp.src(`${src_dir}/css/**/*.less`)
		.pipe(sourcemaps.init())
		.pipe(less())
		.pipe(concat("bundle.css"))
		.pipe(sourcemaps.write("./", { sourceRoot: "source://css" }))
		.pipe(gulp.dest(`${build_dir}/css`))
		.pipe(browserSync.stream());
}

function scripts() {
	return browserifyInstance
		.bundle()
		.pipe(source("bundle.js"))
		.pipe(buffer())
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(gulpIf(production, uglify({ output: { comments: "some" } })))
		.pipe(sourcemaps.write('./', { sourceRoot: "source://js" }))
		.pipe(gulp.dest(`${build_dir}/js`))
		.on("end", browserSync.reload);
}

function clean() {
	return del(`${build_dir}/**/*`);
}

async function watch() {
	await clean();
	await build();

	browserSync.init({
		server: {
			baseDir: build_dir,
		},
		browser: [],
	});

	watchify(browserifyInstance)
		.plugin(errorify);

	gulp.watch(`${src_dir}/static`, staticFiles);
	gulp.watch(`${src_dir}/js`, scripts);
	gulp.watch(`${src_dir}/css`, styles);
}

const build = gulp.parallel(staticFiles, styles, scripts);

module.exports = { build, watch, clean };
