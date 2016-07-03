<?php ?>
<!DOCTYPE html>
<html lang="en" ng-app="myApp">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
		<title>Facebook photos selector</title>

		<link href="bower_components/bootstrap/dist/css/bootstrap.css" rel="stylesheet">
		<link rel="stylesheet" type="text/css" href="style.css">

		<script src="https://use.fontawesome.com/124671c5f2.js"></script>
	</head>
	<body>
		<div  ui-view="wrapper"></div>

		<!-- Javascript -->
		<script src="bower_components/jquery/dist/jquery.min.js"></script>
		<script src="bower_components/angular/angular.js"></script>
		<script src="bower_components/angular-ui-router/release/angular-ui-router.js"></script>
		<script src="bower_components/angular-bootstrap/ui-bootstrap-tpls.js"></script>
		<script src="bower_components/bootstrap/dist/js/bootstrap.min.js"></script>
		<script src="app.js"></script>
	</body>
</html>