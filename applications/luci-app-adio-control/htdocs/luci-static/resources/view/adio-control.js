'use strict';
'require ui';
'require view';
'require fs';
'require poll';
'require request';

function adio_set(peripheral, id, value) {
	var url = window.L.url('admin/services/adio/api/adio/set')
	var data = {};
	data[peripheral] = {}
	data[peripheral][id] = {}
	data[peripheral][id]["value"] = value;

	console.log("ADIO set: ", JSON.stringify(data));
	return request.post(url, data);
}

function adio_set_cfg(peripheral, id, value) {
	var url = window.L.url('admin/services/adio/api/adio/configuration')
	var data = {};
	data[peripheral] = {}
	data[peripheral][id] = value

	console.log("ADIO cfg set: ", JSON.stringify(data));
	return request.post(url, data);
}
		
return view.extend({
	
	loadConfig: function() {
		var url = window.L.url('admin/services/adio/api/adio/configuration')
		return request.get(url, {})
		.then(window.L.bind(function(response) {
			if (response.status != 200) {
				return;
			}
			
			var data = response.json(); 

			console.log(data);
			return data;
		}, this)).catch(function(error) {
		});
	},

	showEditModal: function(subsystem, item, nameSpanEl) {
		var inputEl = E('input', {
			'type': 'text',
			'class': 'cbi-input-text',
			'value': item.name || '',
			'style': 'width: 100%; margin-top: 8px;'
		});

		ui.showModal(_('Name changing'), [
			E('p', {}, _('Enter new device name')),
			inputEl,
			E('div', { 'class': 'right', 'style': 'margin-top: 16px;' }, [
				E('button', {
					'class': 'btn cbi-button-neutral',
					'click': ui.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-action',
					'click': function() {
						var newName = inputEl.value.trim();
						if (newName) {
							item.name = newName;
							if (nameSpanEl) {
								nameSpanEl.innerText = newName;
								
								console.log(item, newName)
								
								var data = {};
								data["name"] = newName;
								
								adio_set_cfg(subsystem, item.id, data)
							}
						}
						ui.hideModal();
					}
				}, _('Save'))
			])
		]);
	},

	load: function() {
		return this.loadConfig();
	},

	render: function(config) {
		var self = this;

		var style = E('style', {}, `
			.dyn-grid { 
				display: grid; 
				grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); 
				gap: 16px; 
				margin-top: 15px; 
			}
			
			.dyn-card { 
				padding: 16px !important; 
				margin-bottom: 0 !important;
			}
			
			.dyn-card h3 { 
				margin-top: 0; 
				margin-bottom: 12px; 
				border-bottom: 2px solid #1890ff; 
				padding-bottom: 6px; 
				font-size: 16px; 
			}
			
			.ctrl-item { 
				border-bottom: 1px solid var(--border-color, rgba(128,128,128,0.2)); 
				padding-bottom: 12px; 
				margin-bottom: 12px; 
			}
			.ctrl-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }

			.status-badge { 
				display: inline-block; 
				padding: 2px 8px; 
				border-radius: 12px; 
				font-size: 12px; 
				font-weight: bold; 
				color: #ffffff !important; 
				text-align: center; 
				white-space: nowrap; 
				min-width: 42px;
			}
			.status-on { background-color: #52c41a; }
			.status-off { background-color: #f5222d; }

			.type-tag { 
				font-size: 11px; 
				padding: 1px 5px; 
				border-radius: 4px; 
				background: rgba(24, 144, 255, 0.15); 
				color: #1890ff; 
				border: 1px solid rgba(24, 144, 255, 0.4); 
				white-space: nowrap; 
			}
			
			.ctrl-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
			.ctrl-row:last-child { margin-bottom: 0; }
			
			.item-header { display: flex; align-items: center; gap: 6px; flex-grow: 1; overflow: hidden; }
			.item-title { font-weight: bold; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
			
			.item-subtext { 
				font-size: 12px; 
				opacity: 0.75;
				white-space: nowrap; 
			}

			.btn-edit { 
				background: none; 
				border: none; 
				cursor: pointer; 
				padding: 2px 4px; 
				font-size: 14px; 
				opacity: 0.7; 
				transition: opacity 0.2s; 
			}
			.btn-edit:hover { opacity: 1.0; }

			.val-display { font-size: 22px; font-weight: bold; text-align: center; color: #1890ff; margin: 8px 0; }
			.power-val { font-size: 18px; font-weight: bold; color: #52c41a; white-space: nowrap; }
		`);

		var grid = E('div', { 'class': 'dyn-grid' });

		var createHeader = function(subsystem, item, subtext, noteditable) {
			var nameSpan = E('span', { 'class': 'item-title' }, item.name);
			var editBtn = E('button', {
				'class': 'btn-edit',
				'style': noteditable ? 'display:none' : 'display',
				'title': _('Rename'),
				'click': function(ev) {
					ev.preventDefault();
					self.showEditModal(subsystem, item, nameSpan);
				}
			}, '✏️');

			var subtextNode = '';
			if (subtext) {
				subtextNode = typeof subtext === 'string' 
					? E('span', { 'class': 'item-subtext' }, subtext)
					: E('span', { 'class': 'item-subtext' }, [ subtext ]);
			}

			return E('div', { 'class': 'item-header' }, [
				nameSpan,
				editBtn,
				subtextNode
			]);
		};

		if (config && config.power_supply && Object.keys(config.power_supply).length > 0) {
			var pwrNodes = Object.values(config.power_supply).map(function(pwr) {
				return E('div', { 'class': 'ctrl-item' }, [
					E('div', { 'class': 'ctrl-row' }, [
						createHeader("pwr", pwr, undefined, true),
						E('span', { 'id': 'pwr-val-' + pwr.id, 'class': 'power-val' }, '0.00 ' + _('V'))
					])
				]);
			});
			grid.appendChild(E('div', { 'class': 'cbi-section dyn-card' }, [ E('h3', {}, _('Power Supply')), E('div', {}, pwrNodes) ]));
		}

		if (config && config.relay && Object.keys(config.relay).length > 0) {
			var relayNodes = Object.values(config.relay).map(function(r) {
				var relayType = (r.type || 'NO').toUpperCase();
				
				var subtext = E('span', { 'style': 'display: inline-flex; align-items: center; gap: 4px;' }, [
					E('span', {}, ),
					E('span', { 'class': 'type-tag', 'id':  'type-' + r.id}, relayType)
				]);

				return E('div', { 'class': 'ctrl-item' }, [
					E('div', { 'class': 'ctrl-row' }, [
						createHeader("relay", r, subtext),
						E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
							E('span', { 
								'id': 'badge-' + r.id, 
								'class': 'status-badge status-off'
							}, 'OFF'),
							E('button', {
								'class': 'btn cbi-button-action',
								'click': ui.createHandlerFn(self, function() {
									adio_set("relay", r.id, 1)
								})
							}, _('On.')),
							E('button', {
								'class': 'btn cbi-button-action',
								'click': ui.createHandlerFn(self, function() {
									adio_set("relay", r.id, 0)
								})
							}, _('Off.')),
						])
					])
				]);
			});
			grid.appendChild(E('div', { 'class': 'cbi-section dyn-card' }, [ E('h3', {}, _('Power relay')), E('div', {}, relayNodes) ]));
		}

		if (config && config.dio && Object.keys(config.dio).length > 0) {
			var dioNodes = Object.values(config.dio).map(function(d) {
					console.log(JSON.stringify(d));

					var actionButtonsRow = E('div', {
						'class': 'ctrl-row',
						'style': d.mode === 'input' ? 'display: none;' : ''
					}, [
						E('button', {
							'class': 'btn cbi-button-neutral',
							'click': ui.createHandlerFn(self, function() {
								adio_set("dio", d.id, 1);
							})
						}, _('On.')),
						E('button', {
							'class': 'btn cbi-button-neutral',
							'click': ui.createHandlerFn(self, function() {
								adio_set("dio", d.id, 0);
							})
						}, _('Off.'))
					]);

					return E('div', { 'class': 'ctrl-item' }, [
						E('div', { 'class': 'ctrl-row' }, [
							createHeader("dio", d),
							E('span', { 'id': 'badge-' + d.id, 'class': 'status-badge status-off' }, _('LOW'))
						]),
						E('div', { 'class': 'ctrl-row' }, [
							E('label', {}, _('Direction:')),
							E('select', {
								'class': 'cbi-input-select',
								'change': ui.createHandlerFn(self, function(ev) {
									var val = ev.target.value;
									var data = { "mode": val };
									
									actionButtonsRow.style.display = (val === 'input') ? 'none' : '';

									adio_set_cfg("dio", d.id, data);
								})
							}, [
								E('option', { 'value': 'input', 'selected': d.mode === 'input' ? '' : null }, _('Input (IN)')),
								E('option', { 'value': 'output', 'selected': d.mode === 'output' ? '' : null }, _('Output (OUT)'))
							])
						]),
						actionButtonsRow
					]);
			});

			grid.appendChild(E('div', { 'class': 'cbi-section dyn-card' }, [ 
				E('h3', {}, _('Digital I/O')), 
				E('div', {}, dioNodes) 
			]));
		}

		if (config && config.dac && Object.keys(config.dac).length > 0) {
			var dacNodes = Object.values(config.dac).map(function(dac) {
				var maxRaw = Math.pow(2, dac.bits || 12) - 1;
				var scales = dac.scale.available;
				var scaleIdSelected = dac.scale.selected;
				var scaleSelected = undefined;
				
				for (var s in scales) {
					if (scales[s].id == scaleIdSelected) {
						scaleSelected = scales[s];
						break;
					}
				}

				var updateVoltageDisplay = function() {
					var slider = document.getElementById('slider-' + dac.id);
					var scaleSelect = document.getElementById('scale-dac-' + dac.id);
					var selectedOpt = scaleSelect.options[scaleSelect.selectedIndex];
					
					var disp = document.getElementById('disp-' + dac.id);
					
					if (slider && scaleSelect && disp) {
						var maxV = parseFloat(selectedOpt.getAttribute('data-max'));
						var volts = ((slider.value / maxRaw) * maxV).toFixed(2);

						disp.innerText = volts + ' ' + _('V') + ' (' + _('max.') + maxV + ' ' + _('V') + ')';
					}
				};

				var scaleOptions = scales.map(function(s) {
					var optAttrs = {
						'value': String(s.id),
						'data-min': s.min !== undefined ? s.min : '',
						'data-max': s.max !== undefined ? s.max : '',
						'data-bits': dac.bits !== undefined ? dac.bits : '',
					};
					
					if (s.id === scaleIdSelected)
						optAttrs['selected'] = 'selected';
					
					return E('option', optAttrs, '0 — ' + s.max + ' ' + _('V'));
				});

				return E('div', { 'class': 'ctrl-item' }, [
					E('div', { 'class': 'ctrl-row' }, [
						createHeader("dac", dac),
						E('strong', { 'id': 'val-' + dac.id, 'style': 'font-size: 18px; color: #1890ff; white-space: nowrap;' }, '0.00' + ' ' + _('V'))
					]),
					E('div', { 'class': 'val-display', 'id': 'disp-' + dac.id }, '0.00' + ' ' + _('V') + ' (' + _('max.') + ' ' +  (scaleSelected ? scaleSelected.max : '0') + ' ' + _('V') + ')'),
					
					E('div', { 'class': 'ctrl-row' }, [
						E('label', {}, _('DAC Range')),
						E('select', {
							'id': 'scale-dac-' + dac.id,
							'class': 'cbi-input-select',
							'change': function() {
								updateVoltageDisplay();
								
								var scaleSelect = document.getElementById('scale-dac-' + dac.id);
								
								var data = {};
								data["scale"] = {};
								data["scale"]["selected"] = scaleSelect.value;
								
								adio_set_cfg("dac", dac.id, data)
							}
						}, scaleOptions)
					]),

					E('div', { 'class': 'ctrl-row' }, [
						E('label', {}, _('Value')),
						E('input', {
							'id': 'slider-' + dac.id,
							'type': 'range',
							'min': '0',
							'max': String(maxRaw),
							'value': '0',
							'style': 'width: 60%;',
							'input': function() {
								updateVoltageDisplay();
							},
							'change': ui.createHandlerFn(self, function(ev) {
								adio_set("dac", dac.id, ev.target.value)
							})
						})
					])
				]);
			});
			grid.appendChild(E('div', { 'class': 'cbi-section dyn-card' }, [ E('h3', {}, _('Analog outputs (DAC)')), E('div', {}, dacNodes) ]));
		}

		if (config && config.adc && Object.keys(config.adc).length > 0) {
			var adcNodes = Object.values(config.adc).map(function(adc) {
				var maxRaw = Math.pow(2, adc.bits || 12) - 1;
				var scales = adc.scale.available;
				var scaleIdSelected = adc.scale.selected;
				var scaleSelected = undefined;
				
				for (var s in scales) {
					if (scales[s].id == scaleIdSelected) {
						scaleSelected = scales[s];
						break;
					}
				}

				var scaleOptions = scales.map(function(s) {
					var optAttrs = {
						'value': String(s.id),
						'data-type': s.type !== undefined ? s.type : '',
						'data-min': s.min !== undefined ? s.min : '',
						'data-max': s.max !== undefined ? s.max : '',
					};
					
					if (s.id === scaleIdSelected)
						optAttrs['selected'] = 'selected';
					
					if (s.type == "voltage") {
						return E('option', optAttrs, '0 — ' + s.max + ' ' + _('V'));
					} else if (s.type == "current_4_20") {
						return E('option', optAttrs, '0 — ' + (s.max*1000.0).toString() + ' ' + _('mA'));
					} else if (s.type == "temperature") {
						return E('option', optAttrs, _('Thermistor'));
					}
				});

				var toggleRangeVisibility = function() {
					var modeSelect = document.getElementById('mode-' + adc.id);
					var rangeRow = document.getElementById('range-row-' + adc.id);
					if (modeSelect && rangeRow) {
						rangeRow.style.display = (modeSelect.value === 'voltage') ? 'flex' : 'none';
					}
				};

				return E('div', { 'class': 'ctrl-item' }, [
					E('div', { 'class': 'ctrl-row' }, [
						createHeader("adc", adc),
						E('strong', { 'id': 'val-' + adc.id, 'style': 'font-size: 18px; color: #1890ff; white-space: nowrap;' }, '0.00' + ' ' + _('V'))
					]),
					E('div', { 'class': 'ctrl-row', 'id': 'range-row-' + adc.id }, [
						E('label', {}, _('Measurement')),
						E('select', {
							'id': 'scale-' + adc.id,
							'class': 'cbi-input-select',
							'change': function() {
								var scaleSelect = document.getElementById('scale-' + adc.id);
								
								var data = {};
								data["scale"] = {};
								data["scale"]["selected"] = scaleSelect.value;
								
								adio_set_cfg("adc", adc.id, data)
							}
						}, scaleOptions)
					])
				]);
			});
			grid.appendChild(E('div', { 'class': 'cbi-section dyn-card' }, [ E('h3', {}, _('Analog inputs (ADC)')), E('div', {}, adcNodes) ]));
		}

		poll.add((function() {
			var url = window.L.url('admin/services/adio/api/adio/get')
			return request.get(url, {})
			.then(window.L.bind(function(response) {
				if (response.status != 200) {
					return;
				}
				
				var data = response.json(); 
				
				try {
					if (data.power_supply && Object.keys(data.power_supply).length > 0) {
						for (var id in data.power_supply) {
							var pwr = data.power_supply[id];
							
							var el = document.getElementById('pwr-val-' + id);
							if (el)
								el.innerText = pwr.value.toFixed(2) + ' ' + _('V');
						}
					}
					
					if (data.relay && Object.keys(data.relay).length > 0) {
						for (var id in data.relay) {
							var relay = data.relay[id];

							var type = document.getElementById('type-' + id);
							var badge = document.getElementById('badge-' + id);

							if (badge) {
								var isNc = (type.innerText || '').toUpperCase() === 'NC';
								var isActive = isNc ? (relay.value === 0) : (relay.value === 1);
								badge.className = 'status-badge ' + (isActive ? 'status-on' : 'status-off');
								badge.innerText = isActive ? _('ON') : _('OFF');
							}
						}
					}
					
					if (data.dio && Object.keys(data.dio).length > 0) {
						for (var id in data.dio) {
							var dio = data.dio[id];
							
							var badge = document.getElementById('badge-' + id);
							if (badge) {
								badge.className = 'status-badge ' + (dio.value ? 'status-on' : 'status-off');
								badge.innerText = dio.value ? _('HIGH') : _('LOW');
							}
						}
					}
					
					if (data && data.adc && Object.keys(data.adc).length > 0) {
						for (var id in data.adc) {
							var adc = data.adc[id];
							
							var scaleSelect = document.getElementById('scale-' + id);
							var selectedOpt = scaleSelect.options[scaleSelect.selectedIndex];
							var type = selectedOpt.getAttribute('data-type');
							
							var valEl = document.getElementById('val-' + id);
							
							if (type === 'current_4_20') {
								valEl.innerText = adc.value.toFixed(4) + ' ' + _('mA');
							} else if (type === 'voltage') {
								valEl.innerText = adc.value.toFixed(2) + ' ' + _('V');
							} else if (type === 'temperature') {
								valEl.innerText = adc.value.toFixed(1) + ' ' + _('°C');
							}
						}
					}
					
					if (data && data.dac && Object.keys(data.dac).length > 0) {
						for (var id in data.dac) {
							var dac = data.dac[id];
							
							var scaleSelect = document.getElementById('scale-dac-' + id);
							var selectedOpt = scaleSelect.options[scaleSelect.selectedIndex];
							
							var disp = document.getElementById('val-' + id);
					
							if (scaleSelect && disp) {
								var maxBits = parseInt(selectedOpt.getAttribute('data-bits'));
								var maxRaw = Math.pow(2, maxBits || 12) - 1;
								var maxV = parseFloat(selectedOpt.getAttribute('data-max'));
								var volts = ((dac.value / maxRaw) * maxV).toFixed(2);

								disp.innerText = volts + ' ' + _('V');
							}
						}
					}
				} catch (err) {
					console.log(err);
				}
				
			}, this)).catch(function(error) {
			});
		}).bind(this), 1);

		return E('div', { 'class': 'cbi-map' }, [
			style,
			E('h2', {}, _('ADIO Control')),
			grid
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
