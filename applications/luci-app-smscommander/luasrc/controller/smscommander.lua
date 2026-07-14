module("luci.controller.smscommander", package.seeall)

function index()
	if not nixio.fs.access("/etc/config/smscommander") then
		return
	end

	local smscommander_status_page = entry({"admin", "services", "smscommander"}, cbi("smscommander"), translate("SMS control"))
		smscommander_status_page.dependent = true
		
	local smscommander_view_page = entry({"admin", "status", "smscommander"}, view("smscommander"), _(translate("SMS control")))
		smscommander_view_page.dependent = true
end
