module.exports = function(app, addon) {

	// Root route. This route will serve the `atlassian-connect.json` unless the
	// documentation url inside `atlassian-connect.json` is set
	app.get('/', function(req, res) {
		res.format({

			// If the request content-type is text-html, it will decide which to
			// serve up
			'text/html' : function() {
				res.redirect('/atlassian-connect.json');
			},
			// This logic is here to make sure that the `atlassian-connect.json`
			// is always
			// served up when requested by the host
			'application/json' : function() {
				res.redirect('/atlassian-connect.json');
			}
		});
	});

	// Add any additional route handlers you need for views or REST resources
	// here...
	app.get('/dashboard-item', addon.authenticate(), function(req, res) {
		res.render('dashboard-item', {
			title : "Release Dashboard"
		});

	});		
};