/**
 * Created by johnnycage on 15/9/11.
 */
module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        banner: '/* LogWeb v<%= pkg.version %> */\n',

        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            build: [
                'gruntfile.js',
                'index.js'
            ]
        },

        uglify: {
            options: {
                banner: '<%= banner %>',
                mangle: true
            },
            build: {
                files: {
                    'dist/cage-bind.min.js': 'index.js'
                }
            }
        },

        watch: {
            styles: {
                files: ['index.js', 'Gruntfile.js'],
                tasks: ['jshint', 'uglify']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['jshint', 'uglify', 'watch']);
};
