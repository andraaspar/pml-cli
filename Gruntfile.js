module.exports = function(grunt) {
	'use strict';
	
	grunt.initConfig((function() {
		
		var fs = require('fs');
		
		var packageJson = fs.readFileSync('package.json', 'utf8');
		var packageObj = JSON.parse(packageJson);
		var VERSION = packageObj.version;
		
		// Config template, completed by JS below
		
		var config = {
			
			// Variables to check
			
			JS_NAME: 'pml-cli',
			JS_PATH: '',
			JS_TO_CONCAT: [
				'<%= SRC_FOLDER %>/_concat/header.txt',
				'<%= JS_IN_TEMP %>'
			],
			MAIN_TS: '<%= SRC_FOLDER %>/ts/main/Main.ts',
			TEST_COUNT: 0,
			
			// Other variables
			
			BUILD_FOLDER: 'build',
			JS_IN_TEMP: '<%= TMP_FOLDER %>/<%= JS_NAME %>.js', 
			KAPOCS_PATTERN: ['**'],
//			MINIFIED_JS_IN_TEMP: '<%= TMP_FOLDER %>/script/<%= JS_NAME %>.min.js', 
			SRC_FOLDER: 'src',
			TMP_FOLDER: 'tmp',
			
			// Targets
			
			clean: {
				compile: [
					'<%= BUILD_FOLDER %>',
					'<%= TMP_FOLDER %>'
				]
			},
			concat: {
				compile: {
					options: {
						process: function(contents, path) {
							return contents.replace(/___PACKAGE_VERSION___/g, VERSION);
						}
					},
					src: '<%= JS_TO_CONCAT %>',
					dest: '<%= BUILD_FOLDER %>/<%= JS_PATH %><%= JS_NAME %>.js'
				}
			},
			copy: {
				compile: {
					files:[{
						expand: true,
						cwd: '<%= SRC_FOLDER %>/_dropin',
						dot: true,
						src: '<%= KAPOCS_PATTERN %>',
						dest: '<%= BUILD_FOLDER %>'
					}, {
						expand: true,
						cwd: '<%= TMP_FOLDER %>/_dropin',
						dot: true,
						src: '<%= KAPOCS_PATTERN %>',
						dest: '<%= BUILD_FOLDER %>'
					}]
				},
//				debug: {
//					files: [
//						{src: ['<%= JS_IN_TEMP %>'], dest: '<%= MINIFIED_JS_IN_TEMP %>'}
//					]
//				}
			},
			sas: {
				update: {/* No options required. */}
			},
			shell: {
				compile: {
					command: '"node_modules/.bin/tsc" --noLib --out "<%= JS_IN_TEMP %>" "<%= MAIN_TS %>"'
				},
				update: {
					command: [
						'bower prune',
						'bower update',
						'bower install'
					].join('&&')
				}
			},
//			uglify: {
//				compile: {
//					files: {
//						'<%= MINIFIED_JS_IN_TEMP %>': ['<%= JS_IN_TEMP %>']
//					}
//				}
//			}
		};
		
		// Inject tests
		
//		for (var i = 1; i <= config.TEST_COUNT; i++) {
//			var folderPath = '<%= TMP_FOLDER %>/_asset_templates/test' + i;
//			var jsPath = folderPath + '/script/test.js';
//			var cssPath = folderPath + '/style/test.css';
//			
//			config.less.tests.files[cssPath] = 'test/test' + i + '/less/_desktop.less';
//			config.typescript.tests.files[jsPath] = 'test/test' + i + '/Main.ts';
//		}
		
		return config;
	})());
	
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
//	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-sas');
	grunt.loadNpmTasks('grunt-shell');
	
	grunt.registerTask('compile', [
		'clean:compile',
		'copy:compile',
		'shell:compile',
//		'uglify:compile',
		'concat:compile',
	]);
	grunt.registerTask('debug', [
		'clean:compile',
		'copy:compile',
		'shell:compile',
//		'copy:debug',
		'concat:compile',
	]);
	grunt.registerTask('update', [
		'shell:update',
		'sas:update'
	]);
	grunt.registerTask('default', [
		'compile'
	]);
};