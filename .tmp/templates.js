angular.module('timeline').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('.tmp/widget.html',
    "<div class=\"timeline\"><canvas></canvas><div class=\"overlay\" ng-mousemove=\"setOffset($event)\" ng-mousedown=\"startDrag($event)\" ng-mouseup=\"endDrag($event)\"><div ng-repeat=\"user in internal.users\" class=\"user-row\"><div class=\"user-label\"><span class=\"label-inner\">{{user}}</span></div><div ng-repeat=\"project in internal.assignments[user]\" class=\"project-row\"><div ng-repeat=\"event in internal.events[user][project]\" class=\"event-block\" style=\"{{calculateStyle(event)}}\">{{event.name}}<span class=\"details\">{{event.datetime|date:'MMM d, y HH:mm:ss'}}</span></div><div class=\"project-label\"><span class=\"label-inner\">{{project}}</span></div></div></div><div class=\"spacer\"></div></div></div>"
  );

}]);
