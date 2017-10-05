module.exports = function(app, addon) {

	app.get(function(req, res) {
		res.render('installed', {
			title : "Installed"
		});

	});
};