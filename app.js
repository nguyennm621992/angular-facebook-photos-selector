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
            appId: '1031527436931737',
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
            version: 'v2.4'
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
    $urlRouterProvider.otherwise("/");
    $stateProvider
        .state('myApp', {
            url: '/',
            controller: 'myController'
        });

}])

.controller('myController', ['$rootScope', '$scope', 'facebookService', function ($rootScope, $scope, facebookService) {

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
                        mine = $scope;

                        /**
                         * Variables
                         */
                        $scope.albumList = [];
                        $scope.photoList = [];

                        /**
                         * Functions
                         */
                        // Load all albums
                        function loadAlbums() {
                            facebookService.getAlbums().success(function (res) {
                                if (res.data) {
                                    $scope.albumList = res.data;

                                    // Format created_date and get cover photo of each folder
                                    for (var i = 0, length = $scope.albumList.length; i < length; i++) {
                                        // Created date
                                        var t = new Date($scope.albumList[i].created_time);
                                        $scope.albumList[i].createdTime = t.toDateString();

                                        // Get cover photo
                                        if ($scope.albumList[i].cover_photo && $scope.albumList[i].cover_photo.id) {
                                            $scope.albumList[i].coverPhoto = facebookService.getPictureLink($scope.albumList[i].cover_photo.id);
                                        }
                                    }

                                    // Add Videos folder
                                    $scope.albumList.push({ id: 'video', name: 'Videos' });
                                }
                            });
                        }

                        // Load photos from album
                        $scope.loadPhotos = function (albumId, $index) {
                            facebookService.getPhotosFromAlbum(albumId).success(function (res) {
                                $scope.photoList = res.data;

                                // Get photo links
                                for (var i = 0, length = $scope.photoList.length; i < length; i++) {
                                    $scope.photoList[i].photoUrl = facebookService.getPictureLink($scope.photoList[i].id);;
                                }
                            });
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
        }
    };
}])

.service('facebookService', ['$http', function ($http) {
    var accessToken = '';

    this.setToken = function (_accessToken) {
        this.accessToken = _accessToken;
    };

    this.getAlbums = function () {
        var url = 'https://graph.facebook.com/v2.6/me/albums?fields=cover_photo,name,created_time&&access_token=' + this.accessToken;
        return $http.get(url);
    };

    this.getPictureLink = function (photoId) {
        return 'https://graph.facebook.com/v2.6/' + photoId + '/picture?access_token=' + this.accessToken;
    };

    this.getPhotosFromAlbum = function (albumId) {
        var url = 'https://graph.facebook.com/v2.6/' + albumId + '/photos?access_token=' + this.accessToken;
        return $http.get(url);
    };

}]);
