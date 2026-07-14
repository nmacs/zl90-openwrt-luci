'use strict';
'require view';
'require fs';
'require rpc';
'require ui';
'require poll';

function getType(p) {
	if (Array.isArray(p)) return 'array';
	else if (typeof p == 'string') return 'string';
	else if (p != null && typeof p == 'object') return 'object';
	else return 'other';
}
	
function parameterTranslation(p) {
	if (p == "supported-capabilities") {
		return _("Supported capabilities");
	} else if (p == "signal-quality") {
		return _("Signal quality");
	} else if (p == "operator-name") {
		return _("Operator name");
	} else if (p == "access-technologies") {
		return _("Access technologies");
	} else if (p == "state") {
		return _("State");
	} else if (p == "imei") {
		return _("IMEI");
	} else if (p == "registration-state") {
		return _("Registration state");
	} else if (p == "own-numbers") {
		return _("Phone number");
	}
	return p;
}

function valueTranslation(p, v) {
	if (v == "gsm-umts") {
		return _("GSM-UMTS");
	} else if (v == "lte") {
		return _("LTE");
	} else if (v == "connected") {
		return _("Connected");
	} else if (v == "disabled") {
		return _("Disabled");
	} else if (v == "enabled") {
		return _("Enabled");
	} else if (v == "connecting") {
		return _("Connecting");
	} else if (v == "failed") {
		return _("Failed");
	} else if (v == "home") {
		return _("Home network");
	} else if (v == "roaming") {
		return _("Roaming");
	} else if (v == "idle") {
		return _("Idle");
	} 
	
	return v;
}

function createTableRow(tableId, tableIdx, key, value) {
	return E('div', { 'class': 'tr', 'style': 'display: flex; width: 100%; border-bottom: 1px solid #eee;' }, [
		E('div', { 
			'class': 'td', 
			'style': 'flex: 1; padding: 0.5rem; text-align: left; font-weight: bold;' 
		}, [ key ]),
		E('div', { 
			'class': 'td', 
			'style': 'flex: 1; padding: 0.5rem; text-align: left; border-left: 1px solid #eee;' 
		}, [ value ])
	]);
}

function updateTable(tableId, tableIdx, data, nodataText) {
	var table = document.getElementById(tableId);
	if (!table) return;

	while (table.children.length > 1) {
		table.removeChild(table.lastChild);
	}

	for (var i = 0; i < data.length; i++) {
		var row = E('div', { 'class': 'tr' }, [
			createTableRow(tableId, tableIdx, data[i][0], data[i][1])
		]);
		table.appendChild(row);
	}
}

return view.extend({
	callStatus: rpc.declare({
		object: 'modem',
		method: 'get_status'
	}),
	
	load: function() {
		return Promise.all([
			this.callStatus(),
		]).catch(function(e) {});
	},
	
	pollData: function() {
		var that = this;
		
		poll.add(L.bind(function() {
			var tasks = [];
			tasks.push(that.callStatus());
			
			return Promise.all(tasks).then(function(json) {
				if (json)
					json = json[0];
				
				var rows = [];
				var table = undefined;
				var param, value;
				
				/*
					* General
					*/
				
				rows = [];
				table = 'general';
				
				param = "signal-quality";
				value = "";
				
				if (json.modem && json.modem.generic) {
					if (json.modem.generic.model) {
						rows.push([_('Model'), json.modem.generic.model]);
					}
				}
				
				if (json.modem && json.modem.sim) {
					rows.push([_('SIM1 inserted'), json.modem.sim.sim1 ? _('Yes') : _('No')]);
					rows.push([_('SIM2 inserted'), json.modem.sim.sim2 ? _('Yes') : _('No')]);
					
					rows.push([_('SIM selected'), json.modem.sim.selected]);
				}
				
				param = "state";
				value = "";
				if (json.modem && json.modem.generic && json.modem.generic[param]) {
					value = valueTranslation(param, json.modem.generic[param]);
					rows.push([parameterTranslation(param), value]);
				}
				
				updateTable(table, 0, rows, _('There is no status information.'));
				
				/*
					* Modem
					*/
				
				rows = [];
				table = 'modem';
				
				param = "supported-capabilities";
				value = "";
				if (json.modem.generic && json.modem.generic[param]) {
					for (var i in json.modem.generic[param]) {
						if (value.length > 0)
							value += ", ";
						value += valueTranslation(param, json.modem.generic[param][i]);
					}
					rows.push([parameterTranslation(param), value]);
				}
				
				param = "imei";
				value = "";
				if (json.modem && json.modem["3gpp"] && json.modem["3gpp"][param]) {
					value = json.modem["3gpp"][param];
					rows.push([parameterTranslation(param), value]);
				}
				
				param = "own-numbers";
				value = "";
				if (json.modem.generic && json.modem.generic[param]) {
					for (var i in json.modem.generic[param]) {
						if (value.length > 0)
							value += ", ";
						value += json.modem.generic[param][i];
					}
					rows.push([parameterTranslation(param), value]);
				}
				
				updateTable(table, 1, rows, _('There is no status information.'));
				
				/*
					* Signal
					*/
				
				rows = [];
				table = 'signal';
				
				param = "signal-quality";
				value = "";
				if (json.modem && json.modem.generic && json.modem.generic[param] && json.modem.generic[param].value) {
					value = json.modem.generic[param].value + " %";
					rows.push([parameterTranslation(param), value]);
				}
				
				updateTable(table, 2, rows, _('There is no status information.'));
				
				/*
					* Service
					*/
				
				rows = [];
				table = 'service';
				
				param = "operator-name";
				value = "";
				if (json.modem && json.modem["3gpp"] && json.modem["3gpp"][param]) {
					value = json.modem["3gpp"][param];
					rows.push([parameterTranslation(param), value]);
				}
				
				updateTable(table, 3, rows, _('There is no status information.'));
				
				/*
					* Caps
					*/
					
				rows = [];
				table = 'caps';
				
				param = "access-technologies";
				value = "";
				if (json.modem && json.modem.generic && json.modem.generic[param]) {
					value = valueTranslation(param, json.modem.generic[param]);
					rows.push([parameterTranslation(param), value]);
				}
				
				param = "registration-state";
				value = "";
				if (json.modem && json.modem["3gpp"] && json.modem["3gpp"][param]) {
					value = valueTranslation(param, json.modem["3gpp"][param]);
					rows.push([parameterTranslation(param), value]);
				}
				
				updateTable(table, 4, rows, _('There is no status information.'));

			})
			.catch(function(e) {
				ui.addNotification(null, E('p', _('Service unavailable. May be its was stopped.')), 'danger');
				return;
			});
		}, that), 2);
	},

	render: function(status) {
		var tableIdx = 0;
		
		if (status) {
			status = status[0];
		} else {
			ui.addNotification(null, E('p', _('Service unavailable. May be its was stopped.')), 'danger');
			return;
		}
		
		var main = E('div', {}, []);
		
		var fieldset = main.appendChild(
			E('legend', { 'id': 'legend2' }, [
				E('h1', {}, [ _("Mobile Network Info")])
			])
		);
		
		function addKeyValueTable(root, header, tableId) {
			root.appendChild(
				E('fieldset', { 'class': 'cbi-section' }, [
					E('legend', {}, [ E('h3', {}, [ header ]) ]),

					E('div', { 'class': 'cbi-section-node' }, [
						E('table', { 'class': 'table cbi-section-table', 'id': tableId, 'style': 'display:table; width:100%;' }, [
							E('tr', { 'class': 'tr table-titles', 'style': 'display:flex; font-weight:bold; border-bottom:1px solid #ccc;' }, [
								E('th', { 'class': 'th', 'style': 'flex:1; padding:5px;' }, [ _("Parameter") ]),
								E('th', { 'class': 'th', 'style': 'flex:1; padding:5px;' }, [ _("Value") ])
							]),
							E('tr', { 'class': 'tr' }, [
								E('td', { 'class': 'td', 'style': 'padding: 5px; width: 50%;' }, [ E('em', {}, [ _("Collecting data...") ]) ]),
								E('td', { 'class': 'td', 'style': 'padding: 5px; width: 50%;' }, [ '...' ]) 
							])
						])
					])
				])
			);
			
			tableIdx++;
		}
		
		addKeyValueTable(main, _("General Info"), "general")
		addKeyValueTable(main, _("Modem Info"), "modem")
		addKeyValueTable(main, _("Signal Status"), "signal")
		addKeyValueTable(main, _("Service Status"), "service")
		addKeyValueTable(main, _("Network Capabilities"), "caps")

		this.pollData();
		return main;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
