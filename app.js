/**
 * SHOEBOX - Responsive Theme
 * Copyright 2015 Webapplayers.com
 *
 */
angular.module('myApp', ['ui.router', 'ui.bootstrap'])

.run(['$rootScope', '$window', function ($rootScope, $window) {
    // Facebook SDK
    $window.fbAsyncInit = function() {
        // Executed when the SDK is loaded
        FB.init({ 
            appId: '309680669370564',
            /* 
               Set if you want to check the authentication status
               at the start up of the app 
            */
            status: true, 
            /* 
               Enable cookies to allow the server to access 
               the session 
            */
            cookie: true, 

            /* Parse XFBML */
            xfbml: true,
            version: 'v2.6'
        });
    };

    // Are you familiar to IIFE ( http://bit.ly/iifewdb ) ?
    (function(d, s, id){
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {return;}
        js = d.createElement(s); js.id = id;
        js.src = "//connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
}])

.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
    $stateProvider
        .state('myApp', {
            url: '/',
            views: {
                wrapper: {
                    templateUrl: './templates/wrapper.html',
                    controller: 'myCtrl'
                }
            }
        });

}])

.controller('myCtrl', ['$rootScope', '$scope', 'facebookService', function ($rootScope, $scope, facebookService) {
    $scope.mediaList = {};
}])

.directive('facebookSelector', ['$uibModal', 'facebookService', function ($uibModal, facebookService) {
    return {
        restrict: 'A',
        scope: {
            facebookSelector: '='
        },
        link: function (scope, element, attrs) {

            // Loading
            element.unbind('click');
            element.bind('click', function (e) {
                checkLogin();
            });

            // Facebook login status
            function checkLogin() {
                FB.login(function (response) {
                    if (response.authResponse && response.authResponse.accessToken) { // Loged in
                        // Set token
                        facebookService.setToken(response.authResponse.accessToken);

                        // Open selector
                        openModal(); 
                    }
                }, {scope:'user_photos, user_videos'});
            }

            // Open selector modal
            function openModal() {
                var modalInstance = $uibModal.open({
                    templateUrl: './templates/facebook_selector.html',
                    size: 'md',
                    controller: ['$scope', '$rootScope', '$uibModalInstance', 'facebookService', function ($scope, $rootScope, $uibModalInstance, facebookService) {
                        /**
                         * Variables
                         */
                        $scope._state = {
                            album: 1,
                            media: 2
                        };
                        $scope.curState = $scope._state.album;

                        $scope.albumList = [];
                        $scope.mediaList = [];
                        $scope.selectedList = [];
                        $scope.curAlbum = {};
                        $scope.albumPaging = {
                            curPage: 1,
                            total: '',
                            limit: 6,
                            numOfPages: 2
                        };
                        $scope.mediaPaging = {
                            nextPage: ''
                        };

                        /**
                         * Functions
                         */
                        // Load all albums
                        function loadAlbums() {
                            facebookService.getAlbums().then(function (res) {
                                if (res.data && res.data.data) {
                                    $scope.albumList = res.data.data;

                                    // Format created_date and get cover photo of each folder
                                    $scope.albumList.forEach(function (item, index) {
                                        // Created date
                                        if (item.created_time) {
                                            var t = new Date(item.created_time);
                                            item.createdTime = t.toDateString();
                                        }

                                        // Get cover photo
                                        if (item.cover_photo && item.cover_photo.id) {
                                            item.coverPhoto = facebookService.getPhotoLink(item.cover_photo.id);
                                        }
                                    });

                                    // Add Videos folder
                                    $scope.albumList.push({ id: 'video', name: 'Videos' });

                                    // Pagination
                                    $scope.albumPaging.total = $scope.albumList.length;
                                }
                            });
                        }

                        // Load photos from album
                        $scope.loadPhotos = function () {
                            // Check for lazy load of photos
                            if ($scope.curState != $scope._state.media || $scope.stopLoad) return;

                            $rootScope.isLoading = true;
                            facebookService.getPhotosFromAlbum($scope.curAlbum.id, $scope.mediaPaging.nextPage).then(function (res) {
                                $rootScope.isLoading = false;

                                // Get photos
                                if (checkNestedObj(res, 'data', 'data')) {
                                    // Check to stop loading
                                    if (!res.data.data.length) {
                                        $scope.stopLoad = true;
                                    }

                                    res.data.data.forEach(function (item, index) {
                                        item.isType = 'image';
                                        if (item.images && Array.isArray(item.images)) {
                                            // To get type is smallest
                                            var length = item.images.length;
                                            item.thumbnail = item.images[length-1] ? item.images[length-1].source : '';
                                        }
                                        $scope.mediaList.push(item);
                                    });
                                }

                                // Next page ID
                                if (checkNestedObj(res, 'data', 'paging', 'cursors', 'after')) {
                                    $scope.mediaPaging.nextPage = res.data.paging.cursors.after;
                                }

                            }, function (res) {
                                $rootScope.isLoading = false;
                            });
                        };

                        // Load videos from Facebook user
                        $scope.loadVideos = function () {
                            // Check for lazy load of photos
                            if ($scope.curState != $scope._state.media || $scope.stopLoad) return;

                            $rootScope.isLoading = true;
                            facebookService.getVideos($scope.mediaPaging.nextPage).then(function (res) {
                                $rootScope.isLoading = false;

                                // Get photos
                                if (checkNestedObj(res, 'data', 'data')) {
                                    // Check to stop loading
                                    if (!res.data.data.length) {
                                        $scope.stopLoad = true;
                                    }

                                    res.data.data.forEach(function (item, index) {
                                        item.isType = 'video';
                                        if (checkNestedObj(item, 'thumbnails', 'data') && Array.isArray(item.thumbnails.data)) {
                                            // To get type is smallest
                                            item.thumbnail = item.thumbnails.data[0] ? item.thumbnails.data[0].uri : '';
                                        }
                                        $scope.mediaList.push(item);
                                    });
                                }

                                // Next page ID
                                if (checkNestedObj(res, 'data', 'paging', 'cursors', 'after')) {
                                    $scope.mediaPaging.nextPage = res.data.paging.cursors.after;
                                }

                            }, function (res) {
                                $rootScope.isLoading = false;
                            });
                        };

                        // Load more media
                        $scope.loadMoreMedia = function () {
                            if ($scope.curAlbum.id != 'video') {
                                $scope.loadPhotos();
                            } else {
                                $scope.loadVideos();
                            }
                        };

                        // Select media
                        $scope.selectMedia = function (index) {
                            if ($scope.mediaList[index].isSelect) {
                                $scope.mediaList[index].isSelect = false;

                                // Remove from selected media list
                                var findIndex = null;
                                for (var i = 0, length = $scope.selectedList.length; i < length; i++) {
                                    if ($scope.selectedList[i].id == $scope.mediaList[index].id) {
                                        findIndex = i;
                                        i = length;
                                    }
                                }
                                if (findIndex !== null) {
                                    $scope.selectedList.splice(findIndex, 1);
                                }

                            } else {
                                $scope.mediaList[index].isSelect = true;

                                // Get photo source
                                var item = angular.copy($scope.mediaList[index]);
                                delete item.isSelect;
                                $scope.selectedList.push(item);
                            }
                        };

                        // Select all media which were loaded
                        $scope.selectAll = function () {
                            $scope.selectedList = [];
                            $scope.mediaList.forEach(function (val, k) {
                                val.isSelect = true;

                                // Get photo source
                                var item = angular.copy(val);
                                delete item.isSelect;
                                $scope.selectedList.push(item);
                            });
                        };

                        // Go to photo state
                        $scope.goPhotoState = function (albumId, $index) {
                            // Set current album
                            $scope.curAlbum =  $scope.albumList[$index];
                            $scope.mediaPaging = {
                                nextPage: ''
                            };

                            // Change state
                            $scope.curState = $scope._state.media;

                            // Load first page
                            $scope.stopLoad = false;
                            if ($scope.curAlbum.id != 'video') {
                                $scope.loadPhotos();
                            } else {
                                $scope.loadVideos();
                            }
                        };

                        // Go to album state
                        $scope.goAlbumState = function () {
                            // Reset
                            $scope.selectedList = [];
                            $scope.mediaList = [];

                            // Change state
                            $scope.curState = $scope._state.album;
                            loadAlbums();
                        };

                        // Check nested object
                        function checkNestedObj(obj /*, level1, level2, ... levelN*/) {
                            var args = Array.prototype.slice.call(arguments, 1);

                            for (var i = 0; i < args.length; i++) {
                                if (!obj || !obj.hasOwnProperty(args[i])) {
                                    return false;
                                }
                                obj = obj[args[i]];
                            }
                            return true;
                        }

                        // Finish
                        $scope.finish = function () {
                            $rootScope.$broadcast('facebook:selection', {mediaList: $scope.selectedList});
                            $scope.close();
                        };

                        // Close modal
                        $scope.close = function () {
                            $uibModalInstance.close(true);
                        };

                        /**
                         * Loading 
                         */
                        loadAlbums();
                    }]
                });
            }

            // Get selection
            scope.$on('facebook:selection', function (event, args) {
                scope.facebookSelector = args.mediaList;
            });
        }
    };
}])

.directive('scrollOnElement', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {     
            $(element).unbind('scroll');               
            $(element).scroll(function () {
                var percentScroll = ($(element).scrollTop() + $(element).height()) * 100 / $(element).children().eq(0).height();
                if(percentScroll >= 80 && !scope.isLoading) {
                    scope.$apply(attrs.scrollOnElement);
                }
            });
        }
    };
})

.filter('startFrom', function () {
    return function (input, start) {
        if (input) {
            start = +start;
            return input.slice(start);
        }
        return [];
    };
})

.service('facebookService', ['$http', '$q', function ($http, $q) {
    var accessToken = '',
        defer = $q.defer();

    this.setToken = function (_accessToken) {
        this.accessToken = _accessToken;
    };

    this.getAlbums = function () {
        var url = 'https://graph.facebook.com/v2.6/me/albums?fields=cover_photo,name,created_time&&access_token=' + this.accessToken;
        return $http.get(url);
    };

    this.getPhotoLink = function (photoId) {
        return 'https://graph.facebook.com/v2.6/' + photoId + '/picture?access_token=' + this.accessToken;
    };

    this.getPhotosFromAlbum = function (albumId, nextId) {
        var url = 'https://graph.facebook.com/v2.6/' + albumId + '/photos?fields=images&&access_token=' + this.accessToken;
        if (nextId) {
            url += '&&after=' + nextId;
        }
        return $http.get(url);
    };

    this.getVideos = function (nextId) {
        var url = 'https://graph.facebook.com/v2.6/me/videos/uploaded?fields=thumbnails,source&&access_token=' + this.accessToken;
        if (nextId) {
            url += '&&after=' + nextId;
        }
        return $http.get(url);
    };

}]);
