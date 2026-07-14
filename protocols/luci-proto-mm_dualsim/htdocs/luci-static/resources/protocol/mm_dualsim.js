'use strict';
'require fs';
'require form';
'require network';
'require mm_dualsim_helper as helper';
'require uci';

network.registerPatternVirtual(/^mobiledata-.+$/);
network.registerErrorCode('MM_CONNECT_FAILED', _('Connection attempt failed.'));
network.registerErrorCode('MM_CONNECT_IN_PROGRESS', _('Modem connection in progress. Please wait. This process will timeout after 2 minutes.'));
network.registerErrorCode('DEVICE_NOT_MANAGED', _('Device not managed by ModemManager.'));
network.registerErrorCode('INVALID_BEARER_LIST', _('Invalid bearer list. Possibly too many bearers created.  This protocol supports one and only one bearer.'));
network.registerErrorCode('UNKNOWN_METHOD', _('Unknown and unsupported connection method.'));
network.registerErrorCode('DISCONNECT_FAILED', _('Disconnection attempt failed.'));
network.registerErrorCode('MM_INVALID_ALLOWED_MODES_LIST', _('Unable to set allowed mode list.'));
network.registerErrorCode('MM_NO_PREFERRED_MODE_CONFIGURED', _('No preferred mode configuration found.'));
network.registerErrorCode('MM_NO_ALLOWED_MODE_CONFIGURED', _('No allowed mode configuration found.'));
network.registerErrorCode('MM_FAILED_SETTING_PREFERRED_MODE', _('Unable to set preferred mode.'));

return network.registerProtocol('mm_dualsim', {
	getI18n: function() {
		return _('Dualsim Modemmanager');
	},

	getIfname: function() {
		return this._ubus('l3_device') || 'mm_dualsim-%s'.format(this.sid);
	},

	getPackageName: function() {
		return 'mm_dualsim';
	},

	isFloating: function() {
		return true;
	},

	isVirtual: function() {
		return true;
	},

	getDevices: function() {
		return null;
	},

	containsDevice: function(ifname) {
		return (network.getIfnameOf(ifname) == this.getIfname());
	},

	renderFormOptions: function(s) {
		var o;
		
		function generate_sim_settings(s, simid) {
			var sim_prefix = "sim" + simid.toString();
			var sim_prefix1 = "sim" + simid.toString() + "_";
			var o;
			
			o = s.taboption(sim_prefix, form.Value, sim_prefix1 + 'apn', _('APN'));
			o.validate = function(section_id, value) {
				if (value == null || value == '')
					return true;

				if (!/^[a-zA-Z0-9\-.]*[a-zA-Z0-9]$/.test(value))
					return _('Invalid APN provided');

				return true;
			};

			o = s.taboption(sim_prefix, form.Value, sim_prefix1 + 'pincode', _('PIN'));
			o.datatype = 'and(uinteger,minlength(4),maxlength(8))';

			o = s.taboption(sim_prefix, form.DynamicList, sim_prefix1 + 'allowedauth', _('Authentication Type'));
			o.value('pap', 'PAP');
			o.value('chap', 'CHAP');
			o.value('mschap', 'MSCHAP');
			o.value('mschapv2', 'MSCHAPv2');
			o.value('eap', 'EAP');
			o.value('', _('None'));
			o.default = 'none';

			o = s.taboption(sim_prefix, form.ListValue, sim_prefix1 + 'allowedmode', _('Allowed network technology'),
				_('Setting the allowed network technology.'));
			o.value('2g');
			o.value('3g');
			o.value('3g|2g');
			o.value('4g');
			o.value('4g|2g');
			o.value('4g|3g');
			o.value('4g|3g|2g');
			o.value('5g');
			o.value('5g|2g');
			o.value('5g|3g');
			o.value('5g|3g|2g');
			o.value('5g|4g');
			o.value('5g|4g|2g');
			o.value('5g|4g|3g');
			o.value('5g|4g|3g|2g');
			o.value('',_('any'));
			o.default = '';

			o = s.taboption(sim_prefix, form.ListValue, sim_prefix1 + 'preferredmode', _('Preferred network technology'),
				_('Setting the preferred network technology.'));
			o.value('2g');
			o.value('3g');
			o.value('4g');
			o.value('5g');
			o.value('none', _('None'));
			o.depends('allowedmode','3g|2g');
			o.depends('allowedmode','4g|2g');
			o.depends('allowedmode','4g|3g');
			o.depends('allowedmode','4g|3g|2g');
			o.depends('allowedmode','5g|2g');
			o.depends('allowedmode','5g|3g');
			o.depends('allowedmode','5g|3g|2g');
			o.depends('allowedmode','5g|4g');
			o.depends('allowedmode','5g|4g|2g');
			o.depends('allowedmode','5g|4g|3g');
			o.depends('allowedmode','5g|4g|3g|2g');

			o = s.taboption(sim_prefix, form.Value, sim_prefix1 + 'username', _('PAP/CHAP username'));
			o.depends('auth', 'pap');
			o.depends('auth', 'chap');
			o.depends('auth', 'both');

			o = s.taboption(sim_prefix, form.Value, sim_prefix1 + 'password', _('PAP/CHAP password'));
			o.depends('auth', 'pap');
			o.depends('auth', 'chap');
			o.depends('auth', 'both');
			o.password = true;

			o = s.taboption(sim_prefix, form.ListValue, sim_prefix1 + 'iptype', _('IP Type'));
			o.value('ipv4v6', _('IPv4/IPv6 (both - defaults to IPv4)'))
			o.value('ipv4', _('IPv4 only'));
			o.value('ipv6', _('IPv6 only'));
			o.default = 'ipv4v6';

			o = s.taboption('advanced', form.Value, sim_prefix1 + 'mtu', _('Override MTU'));
			o.placeholder = '1500';
			o.datatype    = 'max(9200)';

			o = s.taboption(sim_prefix, form.Value, sim_prefix1 + 'signalrate', _('Signal Refresh Rate'), _("In seconds"));
			o.datatype = 'uinteger';

			s.taboption(sim_prefix, form.Value, sim_prefix1 + 'metric', _('Gateway metric'));

			s.taboption('advanced', form.Flag, sim_prefix1 + 'debugmode', _('Enable Debugmode'));

			o = s.taboption('advanced', form.ListValue, sim_prefix1 + 'loglevel', _('Log output level'));
			o.value('ERR', _('Error'))
			o.value('WARN', _('Warning'));
			o.value('INFO', _('Info'));
			o.value('DEBUG', _('Debug'));
			o.default = 'ERR';

			o = s.taboption(sim_prefix, form.ListValue, sim_prefix1 + 'init_epsbearer', _('Initial EPS Bearer'),
			_('none: Do not set an initial EPS bearer (default behaviour)') + '<br/>' +
			_('default: Use the configuration options above (APN, IP Type, ...).') + '<br/>' +
			_('custom: Use different options when establishing a connection (these options are prefixed with %s).').format('<code>init_</code>'));
			o.value('', _('none'));
			o.value('default', 'default');
			o.value('custom', 'custom');
			o.default = '';

			o = s.taboption(sim_prefix, form.Value, sim_prefix1 + 'init_apn', _('Initial EPS Bearer APN'));
			o.depends('init_epsbearer', 'custom');
			o.default = '';

			o = s.taboption(sim_prefix, form.ListValue, sim_prefix1 + 'init_allowedauth', _('Initial EPS Bearer Authentication Type'));
			o.depends('init_epsbearer', 'custom');
			o.value('pap', 'PAP');
			o.value('chap', 'CHAP');
			o.value('mschap', 'MSCHAP');
			o.value('mschapv2', 'MSCHAPv2');
			o.value('eap', 'EAP');
			o.value('', _('None'));
			o.default = '';

			o = s.taboption(sim_prefix, form.Value, sim_prefix1 + 'init_username', _('Initial EPS Bearer Username'));
			o.depends('init_allowedauth', 'pap');
			o.depends('init_allowedauth', 'chap');
			o.depends('init_allowedauth', 'mschap');
			o.depends('init_allowedauth', 'mschapv2');
			o.depends('init_allowedauth', 'eap');
			o.default = '';

			o = s.taboption(sim_prefix, form.Value, sim_prefix1 + 'init_password', _('Initial EPS Bearer Password'));
			o.depends('init_allowedauth', 'pap');
			o.depends('init_allowedauth', 'chap');
			o.depends('init_allowedauth', 'mschap');
			o.depends('init_allowedauth', 'mschapv2');
			o.depends('init_allowedauth', 'eap');
			o.default = '';
			o.password = true;

			o = s.taboption(sim_prefix, form.ListValue, sim_prefix1 + 'init_iptype', _('Initial EPS Bearer IP Type'));
			o.depends('init_epsbearer', 'custom');
			o.value('ipv4v6', _('IPv4/IPv6 (both - defaults to IPv4)'))
			o.value('ipv4', _('IPv4 only'));
			o.value('ipv6', _('IPv6 only'));
			o.default = 'ipv4v6';
			
			o = s.taboption(sim_prefix, form.Flag, sim_prefix1+'ping_monitoring', _('ICMP (ping) monitoring'));
			o.rmempty = false;
			
			o = s.taboption(sim_prefix, form.DynamicList, sim_prefix1+'ping_hosts', _('ICMP hosts'));
			o.depends(sim_prefix1+'ping_monitoring', '1');
			o.create = true;
			o.rmempty = true;
			
			o = s.taboption(sim_prefix, form.Value, sim_prefix1+'ping_interval', _('ICMP interval, min'));
			o.depends(sim_prefix1+'ping_monitoring', '1');
			o.datatype = 'range(1,60)';
			o.rmempty = true;
			
			o = s.taboption(sim_prefix, form.Value, sim_prefix1+'ping_timeout', _('ICMP timeout, s'));
			o.depends(sim_prefix1+'ping_monitoring', '1');
			o.datatype = 'range(1,60)';
			o.rmempty = true;
			
			o = s.taboption(sim_prefix, form.Value, sim_prefix1+'ping_packet_size', _('ICMP packet size, bytes'));
			o.depends(sim_prefix1+'ping_monitoring', '1');
			o.datatype = 'range(0,1400)';
			o.rmempty = true;
			
			o = s.taboption(sim_prefix, form.Value, sim_prefix1+'ping_packets_count', _('ICMP packets per request'));
			o.depends(sim_prefix1+'ping_monitoring', '1');
			o.datatype = 'range(1,10)';
			o.rmempty = true;
			
			o = s.taboption(sim_prefix, form.Flag, sim_prefix1+'ping_tcp_port_monitoring', _('TCP (port-opening) monitoring'));
			o.rmempty = false;
			
			o = s.taboption(sim_prefix, form.DynamicList, sim_prefix1+'ping_tcp_port_hosts', _('TCP hosts'));
			o.depends(sim_prefix1+'ping_tcp_port_monitoring', '1');
			o.create = true;
			o.rmempty = true;
		}
		
		function moveTabToPosition(section, name, position = 1) {
			const targetIndex = position - 1;

			const tabIndex = section.tabs.findIndex(t => t.name === name);
			if (tabIndex > -1) {
				const [tab] = section.tabs.splice(tabIndex, 1);
				section.tabs.splice(targetIndex, 0, tab);
			}
			
			const nameIndex = section.tab_names.indexOf(name);
			if (nameIndex > -1) {
				section.tab_names.splice(nameIndex, 1);
				section.tab_names.splice(targetIndex, 0, name);
			}
		}
			
		o = s.taboption('general', form.ListValue, '_modem_device', _('Modem device'));
		o.ucioption = 'device';
		o.rmempty = false;
		o.readonly = true;
		
		o.load = function(section_id) {
			this.value(uci.get('network', section_id, '_modem_device'), _('Modem') + " " + uci.get('network', section_id, '_modem_name'));
			return form.Value.prototype.load.apply(this, [section_id]);
		};
		
		o = s.taboption('general', form.ListValue, 'sim_priority', _('SIM priority'));
		o.value('0', _('No'));
		o.value('1', _('SIM 1'));
		o.value('2', _('SIM 2'));
		o.rmempty = false;
		
		o = s.taboption('general', form.Value, 'sim_switch_timeout', _('SIM switch timeout, s'));
		o.datatype = 'range(60,86400)';
		o.rmempty = false;
		
		o = s.taboption('general', form.Value, 'sim_switch_retries', _('SIM switch tries'));
		o.datatype = 'range(1,10)';
		o.rmempty = false;
		
		o = s.taboption('general', form.Value, 'startup_delay', _('Startup delay, s'));
		o.datatype = 'range(1,600)';
		o.rmempty = false;
		
		s.tab('sim1', _('SIM 1 Settings'));
		s.tab('sim2', _('SIM 2 Settings'));
		
		moveTabToPosition(s, 'sim1', 2);
		moveTabToPosition(s, 'sim2', 3);
		
		generate_sim_settings(s, 1);
		generate_sim_settings(s, 2);
	}
});
