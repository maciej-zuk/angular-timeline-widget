module.exports = function (grunt) {
  'use strict';
  require('load-grunt-tasks')(grunt);
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: ['.tmp'],
    htmlmin: {
      timeline: {
        options: {
          collapseWhitespace: true
        },
        src: ['src/templates/widget.html'],
        dest: '.tmp/widget.html'
      }
    },
    ngtemplates: {
      timeline: {
        src: '<%= htmlmin.timeline.dest %>',
        dest: '.tmp/templates.js'
      }
    },
    concat: {
      timeline: {
        src: ['src/js/timeline.js', '<%= ngtemplates.timeline.dest %>'],
        dest: 'build/js/timeline.js'
      }
    },
    uglify: {
      timeline: {
        src: ['<%= concat.timeline.dest %>'],
        dest: 'build/js/timeline.min.js'
      }
    },
    cssmin: {
      timeline: {
        src: ['src/css/widget.css'],
        dest: 'build/css/timeline.css'
      }
    }
  });
  grunt.registerTask('default', ['clean', 'htmlmin', 'ngtemplates', 'concat', 'uglify', 'cssmin']);
};
