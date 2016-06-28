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

.directive('facebookSelector', ['$uibModal', function ($uibModal) {
    return {
        restrict: 'A',
        scope: {
            facebookSelector: '='
        },
        link: function (scope, element, attrs) {

            // Loading
            element.unbind('click');
            element.bind('click', function (e) {
                FB.getLoginStatus(function(response) {
                    checkLogin();
                });
            });

            // Facebook login status
            function checkLogin() {
                FB.login(function (response) {
                    if (response.authResponse) { // Loged in
                        openModal(); 
                    }
                }, {scope:'user_photos, user_videos'});
            }

            // Open selector modal
            function openModal() {
                var modalInstance = $uibModal.open({
                    templateUrl: './templates/facebook_selector.html',
                    size: 'md',
                    controller: ['$scope', '$rootScope', '$uibModalInstance', 'facebookService',
                    function ($scope, $rootScope, $uibModalInstance, facebookService) {
                        mine = $scope;

                        /**
                         * Functions
                         */
                        // Load all albums
                        function loadAlbums () {
                            facebookService.getAlbums().then(function (res) {
                                console.log(res);
                            });
                        }

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

    this.getAlbums = function () {
        return $http.get('https://graph.facebook.com/v2.6/me/albums');
    };

}]);
