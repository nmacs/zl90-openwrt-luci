require 'luci.sys'
local uci = require("luci.model.uci").cursor()

m = Map("smscommander", translate("SMS commands"), translate("Configure RTU with SMS"))
m.apply_on_parse = true

--
section_general = m:section(NamedSection, "general", "smscommander", translate("General"))

	enabled = section_general:option(Flag, "enabled", translate("Enable"))
		enabled.rmempty = false
		enabled.default = true
		
section_smscommander = m:section(NamedSection, "smscommander", "smscommander", translate("Limits"))

	max_sms = section_smscommander:option(Value, "max_sms", translate("Maximum sms in memory"))
		max_sms.default = "256"
		max_sms.datatype = "and(uinteger, min(1), max(1024))"
		max_sms.rmempty = false
		max_sms.optional = false
		
	password = section_smscommander:option(Value, "password",translate("Command password"))
		password.default = "JYNfK"
		password.datatype = "string"
		password.rmempty = true
		password.optional = false

	phone_list = section_smscommander:option(DynamicList, "phone_list", translate("Phone list with permissions"))
	
s = m:section(TypedSection, "sms_command", translate("SMS Commands List"))
	s.anonymous = true
	s.addremove = true

	o = s:option(Flag, "enabled", translate("Enabled"))
	o.rmempty = false
	
	o = s:option(Flag, "response", translate("Send response"))
	o.rmempty = false

	o = s:option(Value, "text", translate("Received Text"))
	o.placeholder = "reboot"
	o.datatype = "string"

	o = s:option(Value, "command", translate("System Command"))
	o.placeholder = "reboot"
	o.datatype = "string"

function m.on_after_apply(self)
	luci.sys.call("/etc/init.d/smscommander restart")
end

return m
