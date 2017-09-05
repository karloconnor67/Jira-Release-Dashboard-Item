/* add-on script */
// Release Dashboard functionality
$(function() {

	var dashboardItemId = getUrlParameter('dashboardItemId');
	var dashboardId = getUrlParameter('dashboardId');

	var paginationLocation = 1;

	var form = document.getElementById('configForm');
	var numRowsSelect = document.getElementById('numRowsSelect');
	var projectSelect = document.getElementById('selectedProject');
	var titleItem = document.getElementById('itemTitle');

	var config_id = document.getElementById("config");
	var menu_id = document.getElementById("menu");
	var main_id = document.getElementById("main");
	var noFixVersions_id = document.getElementById("no_fix_versions");
	var pagination_id = document.getElementById("pagination");

	config_id.style.display = 'none';
	menu_id.style.display = 'block';
	main_id.style.display = 'block';
	noFixVersions_id.style.display = 'none';
	pagination_id.style.display = 'block';

	var projectKey;
	var displayRows;
	var title;

	var projHeadRow;
	var projTable;

	var projectBaseUrl = baseUrl + "/browse/";
	var params = getQueryParams(document.location.search);
	var baseUrl = params.xdm_e + params.cp;

	var rootElement = d3.select(".display");
	var projBody = buildTableAndReturnTbody(rootElement);

	// get query params
	function getQueryParams(qs) {
		qs = qs.split("+").join(" ");

		var params = {}, tokens, re = /[?&]?([^=]+)=([^&]*)/g;

		while (tokens = re.exec(qs)) {
			params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
		}

		return params;
	}

	function getUrlParameter(name) {
		name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
		var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
		var results = regex.exec(location.search);
		return results === null ? '' : decodeURIComponent(results[1].replace(
				/\+/g, ' '));
	}

	function buildTableAndReturnTbody(hostElement) {
		projTable = hostElement.append('table').classed({
			'project' : true,
			'aui' : true
		});

		projHeadRow = projTable.append("thead").append("tr");

		projHeadRow.append("th").text("Key");
		projHeadRow.append("th").text("Summary");
		projHeadRow.append("th").text("Status");

		return projTable.append("tbody");
	}

	function getData(url) {

		var start = (paginationLocation * displayRows) - displayRows;

		var urlFull = url.concat("&maxResults=" + displayRows + "&startAt="
				+ start);

		AP.request(urlFull, {
			success : function(response) {
				response = JSON.parse(response);

				populateTable(response);
			},
			error : function(response) {
				alert("Error:", response);
			}
		});
	}

	function pagination(numPages, url) {
		var pagination_div = document.getElementById('pagination');

		// empty div
		pagination_div.innerHTML = "";

		var buttons = [];

		// Add "FIRST" button
		buttons.push["first"];
		buttons["first"] = document.createElement("first");
		buttons["first"].innerHTML = "<< First";
		pagination_div.appendChild(buttons["first"]);

		buttons["first"].addEventListener("click", bindClick("first", numPages,
				url));

		// Add "PREVIOUS" button
		buttons.push["previous"];
		buttons["previous"] = document.createElement("previous");
		buttons["previous"].innerHTML = "< Previous";
		pagination_div.appendChild(buttons["previous"]);

		buttons["previous"].addEventListener("click", bindClick("previous",
				numPages, url));

		var currentLocation = document.createElement("currentLocation");
		currentLocation.id = "currentLocation";
		currentLocation.innerHTML = "Showing Page " + paginationLocation
				+ " of " + numPages;
		pagination_div.appendChild(currentLocation);

		// Add "NEXT" button
		buttons.push["next"];
		buttons["next"] = document.createElement("next");
		buttons["next"].innerHTML = "Next >";
		pagination_div.appendChild(buttons["next"]);

		buttons["next"].addEventListener("click", bindClick("next", numPages,
				url));

		// Add "LAST" button
		buttons.push["last"];
		buttons["last"] = document.createElement("last");
		buttons["last"].innerHTML = "Last >>";
		pagination_div.appendChild(buttons["last"]);

		buttons["last"].addEventListener("click", bindClick("last", numPages,
				url));
	}

	function bindClick(button, numPages, url) {
		return function() {

			var currentLocation = document.getElementById('currentLocation');

			if (button == "first") {
				paginationLocation = 1;
			} else if (button == "previous") {
				if (paginationLocation > 1) {
					paginationLocation--;
				}
			} else if (button == "next") {
				if (paginationLocation < numPages) {
					paginationLocation++;
				}
			} else if (button == "last") {
				paginationLocation = numPages;
			}

			currentLocation.innerHTML = "Showing Page " + paginationLocation
					+ " of " + numPages;

			getData(url);
		};
	}

	// Get Dashboard Configuration
	// Call this first and either show Dashboard or Dashboard configuration
	AP.require([ 'request' ], function(request) {
		request({
			url : '/rest/api/latest/dashboard/' + dashboardId + '/items/'
					+ dashboardItemId + '/properties/config',
			success : function(response) {

				// Convert the string response to JSON
				response = JSON.parse(response);

				projectKey = response.value.project;
				displayRows = response.value.numrows;
				title = response.value.title;

				if (response.value.project == null) {
					setupConfigureDashboardScreen();
				} else {
					showDashboard();
				}

			},
			error : function(response) {
				console.log("ERROR: ", response);
				// NEED TO GET MORE ELOGANT WAY TO HANDLE INITIAL CONFIG SETUP
				setupConfigureDashboardScreen();
			},
			contentType : "application/json"
		});

	});

	// Show Dashboard
	function showDashboard() {

		// set title
		AP.require([ 'jira' ], function(jira) {
			jira.setDashboardItemTitle(title);
		});

		// update project link
		var link = baseUrl + '/browse/' + projectKey;

		AP
				.request(
						'/rest/api/latest/project/' + projectKey,
						{
							success : function(response) {

								response = JSON.parse(response);
								
								// show link
								document.getElementById('project_name_label').innerHTML += '<a href="'
										+ link
										+ '">'
										+ response.name
										+ ' ('
										+ projectKey + ')' + '</a>';

								// show Avatar
								document.getElementById('avatar').src = response.avatarUrls["16x16"];

								var versions = response.versions;

								// check if project has versions
								var isEmpty = (versions || []).length === 0;

								if (isEmpty) {
									noFixVersions_id.style.display = 'block';

									// remove old data from select
									var select = document
											.getElementById("version_select");
									select.options.length = 0;

									var numRows = projBody[0][0].rows.length;

									// clean rows
									for (i = 0; i < numRows; i++) {
										projBody[0][0].deleteRow(0);
									}

								} else {
									populateVersionsDropdown(versions);
								}

							},
							error : function(response) {
								alert("Error:", response);
							}
						});

	}

	// Config Dashboard Listener
	AP.require([ 'jira' ], function(jira) {
		jira.DashboardItem.onDashboardItemEdit(function() {
			setupConfigureDashboardScreen();
		});
	});

	// get all projects
	function addAllProjects() {

		AP
				.request(
						'/rest/api/latest/project/',
						{
							success : function(response) {
								response = JSON.parse(response);

								response
										.forEach(function(com) {
											var name = com.name;
											var key = com.key;
											projectSelect.options[projectSelect.options.length] = new Option(
													name, key);
										});

								// update select to show current config
								projectSelect.value = projectKey;

							},
							error : function(response) {
								alert("Error:", response);
							}
						});

	}

	// process form config
	function processForm(e) {
		var url = '/rest/api/latest/dashboard/' + dashboardId + '/items/'
				+ dashboardItemId + '/properties/config';

		if (e.preventDefault)
			e.preventDefault();

		var numRowsValue = numRowsSelect.options[numRowsSelect.selectedIndex].value;
		var projectValue = projectSelect.options[projectSelect.selectedIndex].value;
		var titleValue = titleItem.value;

		projectKey = projectValue;
		displayRows = numRowsValue;
		title = titleValue;

		var configuration = {
			'numrows' : numRowsValue,
			'project' : projectValue,
			'title' : titleValue
		};

		// reset current location
		currentLocation = 1;

		AP.request({
			url : url,
			type : 'PUT',
			contentType : 'application/json',
			data : JSON.stringify(configuration),

			success : function(response) {
				config_id.style.display = 'none';
				menu_id.style.display = 'block';
				main_id.style.display = 'block';
				pagination_id.style.display = 'block';
			},
			error : function(response) {

			}
		});

		showDashboard();

		// You must return false to prevent the default form behavior
		return false;
	}

	// Config the Dasboard
	function setupConfigureDashboardScreen() {

		config_id.style.display = 'block';
		menu_id.style.display = 'none';
		main_id.style.display = 'none';
		noFixVersions_id.style.display = 'none';
		pagination_id.style.display = 'none';

		// remove old data from selects
		numRowsSelect.options.length = 0;
		projectSelect.options.length = 0;

		document.getElementById('project_name_label').innerHTML = "";

		// add values to num rows field
		var rowValues = {
			1 : '1',
			5 : '5',
			10 : '10',
			20 : '20'
		};

		for (index in rowValues) {
			numRowsSelect.options[numRowsSelect.options.length] = new Option(
					rowValues[index], index);
		}

		// update select to show current config
		numRowsSelect.value = displayRows;
		titleItem.value = title;

		// add projects to proj rows field
		addAllProjects();

		// call processForm
		if (form.attachEvent) {
			form.attachEvent("submit", processForm);
		} else {
			form.addEventListener("submit", processForm);
		}

	}

	// populate versions dropdown
	function populateVersionsDropdown(versions) {

		var select = document.getElementById("version_select");

		// remove old data from select
		select.options.length = 0;

		for (var i = 0; i < versions.length; i++) {
			var el = document.createElement("option");
			el.textContent = versions[i].name;
			el.value = versions[i].name;
			select.appendChild(el);
		}

		// call on initial load
		changeActivityItem(select.options[select.selectedIndex].text);

		// call on event change
		select.addEventListener("change", function() {

			var numRows = projBody[0][0].rows.length;

			// clean rows
			for (i = 0; i < numRows; i++) {
				projBody[0][0].deleteRow(0);
			}

			changeActivityItem(select.options[select.selectedIndex].text);

		});

	}

	function changeActivityItem(version_id) {

		var urlBegin = "/rest/api/2/search?jql=";
		var jql = "fixVersion=";
		var urlFull = urlBegin.concat(jql + "\"" + version_id + "\"");

		var numPagesNeeded = 0;

		AP
				.request(
						urlFull,
						{
							success : function(response) {
								response = JSON.parse(response);
								totalIssues = response.total;

								console.log("VERSIONS: ", response);
								// show # of issues
								document.getElementById('num_issues_label').innerHTML = totalIssues;

								// show release date
								if (response.issues[0].fields.fixVersions[0].releaseDate != null) {

									var releaseDate = response.issues[0].fields.fixVersions[0].releaseDate;
								} else {
									var releaseDate = "None";
								}

								document.getElementById('release_date_label').innerHTML = releaseDate;

								console.log("RELEASED FLAG: ", response.issues[0].fields.fixVersions[0].released);
								
								// show released label
								if (response.issues[0].fields.fixVersions[0].released){
									var released = "Released";
								} else {
									var released = "Not Released";
								}

								document.getElementById('released_label').innerHTML = released;

								// Round Up
								numPagesNeeded = Math.ceil(totalIssues
										/ displayRows);
								pagination(numPagesNeeded, urlFull);

							},
							error : function(response) {
								alert("Error:", response);
							}
						});

		try {
			paginationLocation = 1;
			var currentLocation = document.getElementById('currentLocation');
			currentLocation.innerHTML = "Showing Page " + paginationLocation
					+ " of " + numPagesNeeded;
		} catch (error) {

		}

		getData(urlFull);

	}

	function populateTable(version_issues) {

		var numRows = projBody[0][0].rows.length;

		// clean rows
		for (i = 0; i < numRows; i++) {
			projBody[0][0].deleteRow(0);
		}

		version_issues.issues.forEach(function(element) {
			var row = projBody.append("tr");
			row.append("td").text(element.key);
			row.append("td").text(element.fields.summary);
			row.append("td").text(element.fields.status.name);
		});

	}

});