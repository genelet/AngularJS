var app = angular.module(GOTO.app, []);
app.controller(GOTO.controller, function($scope, $http, $window, $location) {

  var ajax_page = function(role, comp, query, method, landing) {
    var url = GOTO.script+"/"+role+"/"+GOTO.json+"/"+comp;
    if (angular.isUndefined(method)) method = 'GET';
    if (angular.isUndefined(query.action)) query.action = GOTO.action;
    var hash = {'url': url, 'method': method};
    if (method==='GET') {
      var pairs = [];
      for (var k in query) pairs.push(k+"="+encodeURIComponent(query[k]));
      hash.url += "?"+pairs.join("&");
    } else {
      hash.data = query;
    }
    $http(hash)
    .error(function(err, status, headers, config) {
      $window.alert("Systm error, status: "+status);
      return false;
    })
    .success(function(data) {
      if (!data.Success) {
        if (data.data == GOTO.challenge || data.data == GOTO.failed) {
          if (angular.isUndefined(data.errorstr)) data.errorstr = data.data;
          $scope.names = data;
          $scope.partial_header = GOTO.role+"/"+GOTO.header+"."+GOTO.html;
          $scope.partial        = role+"/"+GOTO.login+"."+GOTO.html;
          $scope.partial_footer = GOTO.role+"/"+GOTO.footer+"."+GOTO.html;
          return false;
        } else if (data.data != GOTO.logged && data.data != GOTO.logout) {
          $window.alert(data.data);
          return false;
        }
      }

      var l_data = data[GOTO.lists]

      if (landing===true) {
        if (l_data) $scope.single = angular.copy(l_data[0]);
        $scope.names = data;
        return true;
      } else if (landing===false) {
        $scope[$scope.note] = data;
        return true;
      } else if (angular.isString(landing)) {
        //if (l_data) $scope.single = angular.copy(l_data[0]);
        $scope[landing] = data;
        return true;
      } else if (angular.isObject(landing)) {
        if (angular.isString(landing.operator)) {
          var single = l_data[0];
          var lists;
          if (landing.target) {
            var a = landing.target.split('.');
            if (a.length==4) {
              var pos = $scope[a[0]][a[1]].map(function(e) {return e[a[2]];}).indexOf(data[a[2]]);
              if (pos < 0) return false;
              lists = $scope[a[0]][a[1]][pos][a[3]];
              if (angular.isUndefined(lists)) {
                $scope[a[0]][a[1]][pos][a[3]]=[];
                lists = $scope[a[0]][a[1]][pos][a[3]];
              }
            }
            if (a.length==3) {
              var s = $scope.names[$scope.names.action][0][a[0]];
              var pos=s.map(function(e) {return e[a[1]];}).indexOf(data[a[1]]);
              if (pos < 0) return false;
              lists = s[pos][a[2]];
              if (angular.isUndefined(lists)) {
                s[pos][a[2]]=[];
                lists = s[pos][a[2]];
              }
            }
            if (a.length==2) lists = $scope[a[0]][a[1]];
            if (a.length==1) lists = $scope[a[0]];
          } else {
            lists = $scope.names[GOTO.lists];
          }
          if (angular.isUndefined(single) || angular.isUndefined(lists))
            return false;
          if (landing.operator===GOTO.insert) {
            if (landing.extra)
              angular.forEach(landing.extra, function(v,k) { single[k]=v; });
            lists.push(single);
          } else {
            var pos = lists.map(function(e) {return e[landing.id_name];}).indexOf(single[landing.id_name]);
            if (pos<0) {
                var id = parseInt(single[landing.id_name]);
                if (angular.isNumber(id)) {
                    pos = lists.map(function(e) {return e[landing.id_name];}).indexOf(id);
                }
            }
            if (pos < 0) return false;
            if (landing.operator===GOTO.delete) {
              lists.splice(pos,1);
            } else if (landing.operator===GOTO.update) {
              angular.forEach(lists[pos], function(v,k) {
                if (angular.isDefined(single[k])) lists[pos][k]=single[k];
              });
            }
          }
          return true;
        } else {
          var s = landing.query || {};
          s.action = landing.action || GOTO.action;
          var r = landing.role      || role;
          var c = landing.component || comp;
          return ajax_page(r, c, s, "GET", landing.refresh);
        }
      }

      if (l_data) $scope.single = angular.copy(l_data[0]);
      $scope.names = data;
      for (var k in $location.search()) $location.search(k, null);
      if (method==='GET') {
        for (var k in query) $location.search(k, query[k]);
      }
      $scope.partial_header = role+"/"+GOTO.header+"."+GOTO.html;
      $scope.partial        = role+"/"+comp+"/"+query.action+"."+GOTO.html;
      $scope.partial_footer = role+"/"+GOTO.footer+"."+GOTO.html;
      $location.path("/"+role+"/"+comp);
      $location.replace();
    });
    return true;
  };

  var parts = $location.path().split("/");
  var role  = GOTO.role;
  var component = GOTO.component;
  if (parts.length>=3) {
    role = parts[1];
    component = parts[2];
  }

  ajax_page(role, component, angular.copy($location.search()), "GET");

  var wrapper = function(r,c,a,q,method,landing) {
    if (angular.isUndefined(q)) q = {};
    q.action=a;
    return ajax_page(r, c, q, method, landing);
  };
  $scope.go = function(r,c,a,q,landing) {
    return wrapper(r,c,a,q,"GET",landing);
  };
  $scope.optional_go = function(r,c,a,q,name) {
    if (angular.isObject($scope[name])) return;
    return wrapper(r,c,a,q,"GET",name);
  };
  $scope.send = function(r,c,a,q,landing) {
    return wrapper(r,c,a,q,"POST",landing);
  };
  $scope.login = function(r,a,q,landing) {
    q.provider = a
    return ajax_page(r,GOTO.login,q,"POST",landing);
  };
});
