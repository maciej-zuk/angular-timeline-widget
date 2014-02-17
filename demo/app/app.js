'use strict';
angular.module("demo", ['timeline'])
  .controller('DemoCtrl', ['$scope',
    function ($scope) {
      $scope.demoData = {
        entries: [{
            name: 'Task 1',
            datetime: '2014-02-14T19:00:00Z',
            duration: 1 * 24 * 60 * 60 * 1000,
            tags: ["important"], //tags not implement yet
            users: ["user1"],
            project: 'project3'
          }, {
            name: 'Task 2',
            datetime: '2014-02-16T12:00:00Z',
            duration: 4 * 24 * 60 * 60 * 1000,
            users: ["user1", "user2"],
            project: "project2"
          }, {
            name: 'Task 3',
            datetime: '2014-02-19T12:00:00Z',
            duration: 2 * 24 * 60 * 60 * 1000,
            users: ['user2'],
            project: 'project1'
          }, {
            name: 'Task 4',
            datetime: '2014-03-02T12:00:00Z',
            duration: 24 * 60 * 60 * 1000,
            users: ['user2'],
            project: 'project1'
          }, {
            name: 'Task 5',
            datetime: '2014-02-19T12:00:00Z',
            duration: 12 * 60 * 60 * 1000,
            users: ['user3'],
            project: 'project1'
          }, {
            name: 'Task 6',
            datetime: '2014-02-19T12:00:00Z',
            duration: 4 * 60 * 60 * 1000,
            users: ['user1', 'user3'],
            project: 'project4'
          }, {
            name: 'Task 7',
            datetime: '2014-02-19T12:00:00Z',
            duration: 4 * 24 * 60 * 60 * 1000,
            users: ['user2'],
            project: 'project6'
          }
        ]
        };
    }
  ]);
