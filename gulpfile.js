/* eslint-env node */
const gulp = require("gulp"),
	concat = require("gulp-concat"),
	cache = require("gulp-cached"),
	less = require("gulp-less"),
	uglify = require("gulp-uglify"),
	htmlmin = require("gulp-htmlmin"),
	inlineSource = require("gulp-inline-source"),
	nunjucks = require("gulp-nunjucks"),
	sourcemaps = require('gulp-sourcemaps'),
	source = require("vinyl-source-stream"),
	buffer = require('vinyl-buffer'),
	browserify = require("browserify"),
	watchify = require("watchify"),
	babelify = require("babelify"),
	errorify = require("errorify"),
	browserSync = require("browser-sync").create(),
	del = require("del");

const src_dir = "./src",
	build_dir = "./build";

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
		.pipe(uglify({ output: { comments: "some" } }))
		.pipe(sourcemaps.write('./', { sourceRoot: "source://js" }))
		.pipe(gulp.dest(`${build_dir}/js`))
		.on("end", browserSync.reload);
}

function templates() {
	return gulp.src(`${src_dir}/templates/**/[^_]*.njk`)
		.pipe(nunjucks.compile({}))
		.pipe(gulp.dest(build_dir))
		.on("end", browserSync.reload);
}

function inline() {
	return gulp.src(`${build_dir}/*.html`)
		.pipe(inlineSource({
			rootpath: build_dir,
			attribute: false,
		}))
		.pipe(htmlmin({
			collapseWhitespace: true,
			removeComments: false,
		}))
		.pipe(gulp.dest(`${build_dir}/inlined/`));
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

	gulp.watch(`${src_dir}/static`, gulp.series(staticFiles, inline));
	gulp.watch(`${src_dir}/js`, gulp.series(scripts, inline));
	gulp.watch(`${src_dir}/css`, gulp.series(styles, inline));
	gulp.watch(`${src_dir}/templates`, gulp.series(templates, inline));
}

const build = gulp.series(gulp.parallel(staticFiles, styles, scripts, templates), inline);

module.exports = { build, watch, clean };
