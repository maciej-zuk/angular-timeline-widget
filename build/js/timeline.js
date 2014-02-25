'use strict';

angular.module('timeline', [])
  .directive('timeline', ['$filter',
    function ($filter) {

      var validateTimelineData = function (timeline) {
        if (angular.isUndefined(timeline.entries)) {
          throw 'No entries defined for timeline!';
        }
        angular.forEach(timeline.entries, function (entry) {
          if (angular.isUndefined(entry.name)) {
            throw 'Entry ' + JSON.stringify(entry) + ' has no name';
          }
          if (angular.isUndefined(entry.datetime)) {
            throw 'Entry ' + JSON.stringify(entry) + ' has no datetime';
          }
        });
      };

      var findUniqueAttribute = function (timeline, attribute, existing) {
        var uniqueAttributes = existing || [];
        angular.forEach(timeline.entries, function (entry) {
          if (angular.isUndefined(entry[attribute])) {
            return;
          }
          if (uniqueAttributes.indexOf(entry[attribute]) < 0) {
            uniqueAttributes.push(entry[attribute]);
          }
        });
        return uniqueAttributes;
      };

      var findUniqueAttributeList = function (timeline, attribute, existing) {
        var uniqueAttributes = existing || [];
        angular.forEach(timeline.entries, function (entry) {
          if (angular.isUndefined(entry[attribute])) {
            return;
          }
          angular.forEach(entry[attribute], function (attr) {
            if (uniqueAttributes.indexOf(attr) < 0) {
              uniqueAttributes.push(attr);
            }
          });
        });
        return uniqueAttributes;
      };

      var findUniqueAttributePairs = function (timeline, major, minor, existing) {
        var uniqueMajors = existing || {};
        angular.forEach(timeline.entries, function (entry) {
          if (angular.isUndefined(entry[major])) {
            return;
          }
          if (angular.isUndefined(entry[minor])) {
            return;
          }
          angular.forEach(entry[major], function (attr1) {
            if (angular.isUndefined(uniqueMajors[attr1])) {
              uniqueMajors[attr1] = [];
            }
            if (uniqueMajors[attr1].indexOf(entry[minor]) < 0) {
              uniqueMajors[attr1].push(entry[minor]);
            }
          });
        });
        return uniqueMajors;
      };

      var calculateEvents = function (timeline) {
        var events = {};
        var minDate = null;
        angular.forEach(timeline.entries, function (entry) {
          var eventDate = new Date(entry.datetime);
          if (minDate === null || minDate > eventDate) {
            minDate = eventDate;
          }
        });
        var minOffset = minDate.getTime();
        angular.forEach(timeline.entries, function (entry) {
          var eventDate = new Date(entry.datetime);
          var event = {
            name: entry.name,
            datetime: eventDate,
            offset: eventDate.getTime() - minOffset,
            duration: entry.duration
          };
          angular.forEach(entry.users, function (user) {
            if (angular.isUndefined(events[user])) {
              events[user] = {};
            }
            if (angular.isUndefined(events[user][entry.project])) {
              events[user][entry.project] = [];
            }
            events[user][entry.project].push(event);
          });
        });
        events.minDate = minDate;
        return events;
      };

      return {
        templateUrl: '.tmp/widget.html',
        restrict: 'A',
        scope: {
          timeline: '=',
        },
        controller: ["$scope", function ($scope) {
          $scope.internal = {};
          $scope.internal.uniqueTags = [];
          $scope.internal.users = [];
          $scope.internal.projects = [];
          $scope.internal.assignments = {};
          $scope.duringDrag = false;
          $scope.initialOffset = 0;
          $scope.scale = 0.5;
          $scope.viewOffset = 0;
          $scope.temporaryOffset = 0;
          $scope.centerOffset = 0;
          $scope.mouseOffset = 0;
          $scope.basicInterval = 60 * 60 * 1000.0;

          $scope.$watchCollection($scope.timeline, function () {
            validateTimelineData($scope.timeline);
            findUniqueAttributeList($scope.timeline, 'tags', $scope.internal.uniqueTags);
            findUniqueAttributeList($scope.timeline, 'users', $scope.internal.users);
            findUniqueAttribute($scope.timeline, 'project', $scope.internal.projects);
            findUniqueAttributePairs($scope.timeline, 'users', 'project', $scope.internal.assignments);
            $scope.internal.events = calculateEvents($scope.timeline);
          });

        }],
        link: function postLink(scope, iElement) {
          scope.$canvas = iElement.find('canvas');
          scope.canvasCtx = scope.$canvas[0].getContext('2d');

          var onResize = function () {
            scope.centerOffset = iElement[0].offsetWidth * scope.basicInterval / 2;
            scope.viewOffset = scope.centerOffset;
            scope.$canvas.attr('width', iElement[0].offsetWidth);
            scope.$canvas.attr('height', iElement[0].offsetHeight);
            scope.canvasWidth = iElement[0].offsetWidth;
            scope.canvasHeight = iElement[0].offsetHeight;
            scope.redrawCanvas();
            scope.$apply();
          };

          angular.element(window).bind('resize', onResize);
          setTimeout(onResize, 10);

          iElement.bind('mousewheel wheel', function (e) {
            if (e.originalEvent !== undefined){
              e = e.originalEvent;
            }
            var delta = e.wheelDelta || e.deltaY;
            if (delta > 0) {
              if (scope.scale < 0.5) {
                scope.scale *= 2.0;
              }
            } else {
              if (scope.scale > 0.0005) {
                scope.scale /= 2.0;
              }
            }
            scope.$apply();
          });

          scope.calculateStyle = function (event) {
            var viewOffset = scope.viewOffset + scope.temporaryOffset;
            viewOffset -= scope.centerOffset;
            viewOffset /= scope.scale;
            viewOffset += scope.centerOffset;
            var left = ((viewOffset + event.offset / scope.scale) / scope.basicInterval);
            var width = event.duration / (scope.scale * scope.basicInterval);
            return 'left: ' + left + 'px; width: ' + width + 'px';
          };

          scope.setOffset = function (event) {
            if (!scope.duringDrag) {
              return;
            }
            var newTemporaryOffset = (event.screenX - scope.initialOffset) * scope.scale * scope.basicInterval;
            if (Math.abs(newTemporaryOffset - scope.temporaryOffset) > scope.scale * scope.basicInterval * 2) {
              scope.temporaryOffset = newTemporaryOffset;
            }
          };

          scope.startDrag = function (event) {
            scope.duringDrag = true;
            scope.initialOffset = event.screenX;
          };

          scope.endDrag = function (event) {
            scope.duringDrag = false;
            scope.viewOffset += scope.temporaryOffset;
            scope.temporaryOffset = 0;
          };

          scope.redrawCanvas = function () {
            scope.canvasCtx.clearRect(0, 0, scope.canvasWidth, scope.canvasHeight);

            // change scale resolution depeding on zoom
            var scaleDateStep;
            var scaleDateStepMinor;
            var dateFilterLower;
            var dateFilterUpper;
            var fixMonth;
            if (scope.scale > 0) {
              scaleDateStep = scope.basicInterval;
              scaleDateStepMinor = scope.basicInterval / 60;
              dateFilterUpper = 'HH:mm d EEE';
              dateFilterLower = 'MMM yyyy';
              fixMonth = false;
            }
            if (scope.scale > 0.0005) {
              scaleDateStep = scope.basicInterval;
              scaleDateStepMinor = scope.basicInterval / 4;
              dateFilterUpper = 'HH:mm d EEE';
              dateFilterLower = 'MMM yyyy';
            }
            if (scope.scale > 0.01) {
              scaleDateStep = 24 * scope.basicInterval;
              scaleDateStepMinor = scope.basicInterval;
              dateFilterUpper = 'd EEE';
              dateFilterLower = 'MMM yyyy';
            }
            if (scope.scale > 0.05) {
              scaleDateStep = 24 * scope.basicInterval;
              scaleDateStepMinor = 6 * scope.basicInterval;
              dateFilterUpper = 'd EEE';
              dateFilterLower = 'MMM yyyy';
            }
            //calculate some useful variables
            var viewOffset = scope.viewOffset + scope.temporaryOffset;
            viewOffset -= scope.centerOffset;
            viewOffset /= scope.scale;
            viewOffset += scope.centerOffset;
            var dateOffset = scope.internal.events.minDate.getTime();
            //var firstOffset = (new Date(scope.internal.events.minDate.getTime())).getTime()-dateOffset;
            //console.log(firstDate);
            var firstDate = new Date(scope.internal.events.minDate.getTime());
            firstDate.setHours(0);
            firstDate.setMinutes(0);
            firstDate.setSeconds(0);
            var firstOffset = firstDate.getTime() - dateOffset;
            var prevMul = Math.round((-viewOffset * scope.scale) / (scaleDateStep)) - 1;
            firstOffset += scaleDateStep * prevMul;
            var lastOffset = ((scope.basicInterval * scope.canvasWidth) - viewOffset) * scope.scale;
            var date = new Date();
            lastOffset += scaleDateStep;
            var i, lpos, lposDelta;

            // draw major scale and dates
            lpos = ((viewOffset + firstOffset / scope.scale) / scope.basicInterval);
            lposDelta = scaleDateStep / (scope.scale * scope.basicInterval);
            scope.canvasCtx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
            scope.canvasCtx.font = '9px Arial';
            scope.canvasCtx.textAlign = 'center';
            scope.canvasCtx.lineWidth = 1;
            for (i = firstOffset; i < lastOffset; i += scaleDateStep) {
              date.setTime(dateOffset + i);
              scope.canvasCtx.beginPath();
              scope.canvasCtx.moveTo(lpos, 0);
              scope.canvasCtx.lineTo(lpos, scope.canvasHeight);
              scope.canvasCtx.stroke();
              if (date.getDay() === 6 || date.getDay() === 0) {
                scope.canvasCtx.fillStyle = 'rgba(255,0,0,0.75)';
              } else {
                scope.canvasCtx.fillStyle = 'rgba(0,0,0,0.75)';
              }
              scope.canvasCtx.fillText($filter('date')(date, dateFilterUpper), lpos + lposDelta / 2, scope.canvasHeight - 20);
              scope.canvasCtx.fillText($filter('date')(date, dateFilterLower), lpos + lposDelta / 2, scope.canvasHeight - 10);
              lpos += lposDelta;
            }

            // draw minor scale
            lpos = ((viewOffset + firstOffset / scope.scale) / scope.basicInterval);
            scope.canvasCtx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
            lposDelta = scaleDateStepMinor / (scope.scale * scope.basicInterval);
            for (i = firstOffset; i < lastOffset; i += scaleDateStepMinor) {
              scope.canvasCtx.beginPath();
              scope.canvasCtx.moveTo(lpos, 0);
              scope.canvasCtx.lineTo(lpos, scope.canvasHeight - 40);
              scope.canvasCtx.stroke();
              lpos += lposDelta;
            }

            // draw 'now' bar
            scope.canvasCtx.strokeStyle = 'rgba(255, 0, 0, 0.75)';
            var nowOffset = (new Date()).getTime() - scope.internal.events.minDate.getTime();
            lpos = ((viewOffset + nowOffset / scope.scale) / scope.basicInterval);
            scope.canvasCtx.beginPath();
            scope.canvasCtx.moveTo(lpos, 0);
            scope.canvasCtx.lineTo(lpos, scope.canvasHeight - 40);
            scope.canvasCtx.stroke();
          };
          scope.$watch('scale', scope.redrawCanvas);
          scope.$watch('temporaryOffset', scope.redrawCanvas);
          scope.$watch('viewOffset', scope.redrawCanvas);

          setInterval(function () {
            scope.redrawCanvas();
          }, 2000);
        }
      };
    }
  ]);

angular.module('timeline').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('.tmp/widget.html',
    "<div class=\"timeline\"><canvas></canvas><div class=\"overlay\" ng-mousemove=\"setOffset($event)\" ng-mousedown=\"startDrag($event)\" ng-mouseup=\"endDrag($event)\"><div ng-repeat=\"user in internal.users\" class=\"user-row\"><div class=\"user-label\"><span class=\"label-inner\">{{user}}</span></div><div ng-repeat=\"project in internal.assignments[user]\" class=\"project-row\"><div ng-repeat=\"event in internal.events[user][project]\" class=\"event-block\" style=\"{{calculateStyle(event)}}\">{{event.name}}<span class=\"details\">{{event.datetime|date:'MMM d, y HH:mm:ss'}}</span></div><div class=\"project-label\"><span class=\"label-inner\">{{project}}</span></div></div></div><div class=\"spacer\"></div></div></div>"
  );

}]);
