'use strict';
'require view';
'require fs';
'require rpc';
'require ui';
'require poll';

return view.extend({
	callSmsList: rpc.declare({
		object: 'smscommander',
		method: 'list'
	}),
	
	load: function() {
		return Promise.all([
			this.callSmsList(),
		])
		.catch(function(e){});
	},
	
	flagsTranslation: function(flag) {
		if (flag == "ignored") {
			return _("Ignored");
		} else if (flag == "applied") {
			return _("Applied");
		} else if (flag == "incorrect_phone_number") {
			return _("Incorrect phone number");
		} else if (flag == "incorrect_password") {
			return _("Incorrect password");
		} else if (flag == "command_not_found") {
			return _("Command is not found");
		}
		
		return undefined;
	},
	
	hexToArrayBuffer: function(input) {
		if (typeof input !== 'string') {
			throw new TypeError('Expected input to be a string')
		}

		if ((input.length % 2) !== 0) {
			throw new RangeError('Expected string to be an even number of characters')
		}

		const view = new Uint8Array(input.length / 2)

		for (let i = 0; i < input.length; i += 2) {
			view[i / 2] = parseInt(input.substring(i, i + 2), 16)
		}

		return view.buffer
	},

	render: function(list) {
		if (list) {
			list = list[0];
		} else {
			ui.addNotification(null, E('p', _('Service unavailable. May be its was stopped.')), 'danger');
			return;
		}
		
		if (list.data)
			list = list.data;
		
		console.log(list)
		
		var main = E('div', {}, []);

		var fieldset = main.appendChild(
			E('legend', {'id': 'legend2'}, [
				E('h1', {}, [ _("Input SMS list")])
			])
		);
		
		var cbiSection = main.appendChild(E('div', {'class': 'cbi-section-node'}, []));
		var table = cbiSection.appendChild(E('table', {'class': 'table  cbi-section-table', 'style': 'display:table; width:100%;' }, []));
		var entries = table.appendChild(E('tr', {'class': 'tr table-titles', 'style': 'display:flex; font-weight:bold; border-bottom:1px solid #ccc;' }, [
			E('th', {'class': 'th', 'style': 'flex:1; padding:5px;' }, [ _('Timestamp')]),
			E('th', {'class': 'th', 'style': 'flex:1; padding:5px;' }, [ _('Sender')]),
			E('th', {'class': 'th', 'style': 'flex:1; padding:5px;' }, [ _('State')]),
			E('th', {'class': 'th', 'style': 'flex:1; padding:5px;', 'width': '65%'}, [ _('Message')]),
		]));
		
		for (var i = 0; i < list.length; i++) {
			var state = "";
			var color = "";
			for (var s = 0; s < list[i].flags.length; s++) {
				if (list[i].flags[s] == "applied") {
					color = "background-color:#99ff99;";
				} else if (list[i].flags[s] == "incorrect_phone_number" || list[i].flags[s] == "incorrect_password" || list[i].flags[s] == "command_not_found") {
					color = "background-color:#ffa978;";
				}
				
				if (state == "") {
					state = this.flagsTranslation(list[i].flags[s]);
				} else {
					state += ", " + this.flagsTranslation(list[i].flags[s]);
				}
			}
			
			var content = ""
			if (list[i].data.text) {
				content = list[i].data.text; 
			} else if (list[i].data["ucs-2"]) {
				var buffer = this.hexToArrayBuffer(list[i].data["ucs-2"]);
				content = new TextDecoder("UTF-16BE").decode(buffer);
			}
			
			function createTableRow(color, ts, sender, state, text) {
				return E('div', { 'class': 'tr', 'style': 'display: flex; width: 100%; border-bottom: 1px solid #eee;' + color }, [
					E('div', { 
						'class': 'td', 
						'style': 'flex: 1; padding: 0.5rem; text-align: left; font-weight: bold;' 
					}, [ ts ]),
					E('div', { 
						'class': 'td', 
						'style': 'flex: 1; padding: 0.5rem; text-align: left; border-left: 1px solid #eee;' 
					}, [ sender ]),
					E('div', { 
						'class': 'td', 
						'style': 'flex: 1; padding: 0.5rem; text-align: left; border-left: 1px solid #eee;' 
					}, [ state ]),
					E('div', { 
						'class': 'td', 
						'style': 'flex: 1; padding: 0.5rem; text-align: left; border-left: 1px solid #eee;' 
					}, [ text ])
				]);
			}
			
			table.appendChild(
				createTableRow(color, list[i].data.timestamp, list[i].data.sender, state, content)
			);
		}
		
		return main;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
