(function(){
    _.mixin({debounce : function(func, wait, immediate) {
        var timeout=null, result=null;
        return function() {
          var context = this, args = arguments;
          var later = function() {
            timeout = null;
            if (!immediate) result = func.apply(context, args);
          };
          var callNow = immediate && !timeout;
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
          if (callNow) result = func.apply(context, args);
          return result;
        };
      }
});

 _.mixin({each : function(obj, iterator, context) {
        if (obj == null) return;
        var nativeForEach = Array.prototype.forEach;
        var breaker = {};
        if (nativeForEach && obj.forEach === nativeForEach && Ti.App.deployType === "production") {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
          for (var i = 0, l = obj.length; i < l; i++) {
            if (iterator.call(context, obj[i], i, obj) === breaker) return;
          }
        } else {
          for (var key in obj) {
            if (_.has(obj, key)) {
              if (iterator.call(context, obj[key], key, obj) === breaker) return;
            }
          }
        }
      }
  });
  
  
}());
