module.exports = function(grunt) {
	'use strict';
	
	var fs = require('fs');
	
	var packageJson = fs.readFileSync('package.json', 'utf8');
	var packageObj = JSON.parse(packageJson);
	var VERSION = packageObj.version;
	
	grunt.initConfig({
			
		// Variables to check
		
		JS_NAME: 'pml-cli',
		JS_TO_CONCAT: [
			'src/_concat/header.txt',
			'<%= JS_IN_TEMP %>'
		],
		MAIN_TS: 'src/ts/main/Main.ts',
		
		// Other variables
		
		JS_IN_TEMP: 'tmp/<%= JS_NAME %>.js', 
		KAPOCS_PATTERN: ['**'],
		
		// Targets
		
		clean: {
			compile: [
				'build',
				'tmp',
				'test/build',
				'test/tmp'
			],
			update: ['lib']
		},
		concat: {
			compile: {
				options: {
					process: function(contents, path) {
						return contents.replace(/___PACKAGE_VERSION___/g, VERSION);
					}
				},
				src: '<%= JS_TO_CONCAT %>',
				dest: 'build/<%= JS_NAME %>.js'
			}
		},
		copy: {
			compile: {
				files:[{
					expand: true,
					cwd: 'src/_dropin',
					dot: true,
					src: '<%= KAPOCS_PATTERN %>',
					dest: 'build'
				}, {
					expand: true,
					cwd: 'tmp/_dropin',
					dot: true,
					src: '<%= KAPOCS_PATTERN %>',
					dest: 'build'
				}]
			},
			update: {
				files: [{
					expand: true,
					cwd: 'bower_components/illa/src',
					dot: true,
					src: '**',
					dest: 'lib'
				}, {
					expand: true,
					cwd: 'bower_components/node-d-ts/src',
					dot: true,
					src: '**',
					dest: 'lib'
				}, {
					expand: true,
					cwd: 'bower_components/pml/src',
					dot: true,
					src: '**',
					dest: 'lib'
				}, {
					expand: true,
					cwd: 'node_modules/typescript/bin',
					dot: true,
					src: 'lib.core.es6.d.ts',
					dest: 'lib'
				}]
			}
		},
		shell: {
			compile: {
				command: '"node_modules/.bin/tsc" --noLib --out "<%= JS_IN_TEMP %>" "<%= MAIN_TS %>"'
			},
			compile_tests: {
				command: '"node_modules/.bin/tsc" --noLib --out "test/build/test.js" "test/ts/tests/Main.ts"'
			},
			mocha: {
				command: '"node_modules/.bin/mocha" --reporter dot "test/build/test.js"'
			},
			update: {
				command: [
					'bower prune',
					'bower update',
					'bower install'
				].join('&&')
			}
		}
	});
	
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-shell');
	
	grunt.registerTask('compile', [
		'clean:compile',
		'copy:compile',
		'shell:compile',
		'concat:compile',
		'shell:compile_tests',
		'shell:mocha',
	]);
	grunt.registerTask('update', [
		'clean:update',
		'shell:update',
		'copy:update'
	]);
	grunt.registerTask('default', [
		'compile'
	]);
};