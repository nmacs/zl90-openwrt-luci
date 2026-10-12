module("luci.controller.adio-control", package.seeall)

local http    = require("socket.http")
local zlib    = require("zlib")
local ltn12   = require("ltn12")

local API_SERVER_HOST = "127.0.0.1"
local API_SERVER_PORT = "60001"
local DEFLATE_LEVEL = 6

function index()
	--local adio_status_page = entry({"admin", "services", "adio"}, cbi("adio-control"), translate("SMS control"))
	--	adio_status_page.dependent = true
		
	local adio_view_page = entry({"admin", "services", "adio"}, view("adio-control"), _(translate("ADIO control")))
		adio_view_page.dependent = true
		
	entry({"admin", "services", "adio", "api"}, call("adio_api")).leaf = true  
end

local function dump(o)
	if type(o) == 'table' then
		local s = '{ '
		for k,v in pairs(o) do
				if type(k) ~= 'number' then k = '"'..k..'"' end
				s = s .. '['..k..'] = ' .. dump(v) .. ','
		end
		return s .. '} '
	else
		return tostring(o)
	end
end

local function api_put_post_delete(query, method, data, zipped)
	local uri = string.format("http://%s:%s/%s", API_SERVER_HOST, API_SERVER_PORT, query)
  
	local resData = {}  
	local reqHeaders = {}
	local putData = data or ""
  
	if (zipped) then
		reqHeaders["accept-encoding"]  = "gzip, deflate"
	end
  
	local _source = nil
	if (data) then
		_source = ltn12.source.string(putData)
		reqHeaders["content-length"] = #data
	end
	
	local ok, resCode, resHeaders, status
	ok, resCode, resHeaders, status = http.request{
		url = uri,
		method = method, 
		headers = reqHeaders,
		source = _source,
		sink = ltn12.sink.table(resData),
	}
	
	resData = table.concat(resData)
	return ok, resCode, resHeaders, status, resData
end

local function api_get(query, zipped)
	local uri = string.format("http://%s:%s/%s", API_SERVER_HOST, API_SERVER_PORT, query)
  
	local resData = {}  
	local reqHeaders = {}
	local putData = data or ""
  
	if (zipped) then
		reqHeaders["accept-encoding"]  = "gzip, deflate"
	end
	
	local ok, resCode, resHeaders, status
	ok, resCode, resHeaders, status = http.request{
		url = uri,
		method = "GET", 
		headers = reqHeaders,
		sink = ltn12.sink.table(resData),
	}
	
	resData = table.concat(resData)
	return ok, resCode, resHeaders, status, resData
end

function adio_api()
	local path = luci.http.getenv("PATH_INFO")
	local query = luci.http.getenv("QUERY_STRING")
	local method = luci.http.getenv("REQUEST_METHOD")
	local content_data, content_length = luci.http.content()
	local path = string.gsub(path, "/admin/services/adio/", "") -- get API url only
	
	--lualog.print("Method")
	--lualog.print(tostring(method))
	--lualog.print(tostring(content_data))
	--lualog.print(tostring(content_length))

	local url = path
	if (query and #query > 0) then
		url = url .. "?" .. query
	end
  
	local ok, code, headers, status, data
	if (method == "GET") then
		ok, code, headers, status, data = api_get(url, true)
	else
		ok, code, headers, status, data = api_put_post_delete(url, method, content_data, true)
	end
	
	if (not ok) then
		return luci.http.status(404, "Not Found")
	end
	
	local sver, scode, stext = string.match(status, "(.-) (%d-) (.+)")
	
	if (data) then
		local encoding = headers["content-encoding"]  
		if not (encoding and string.find(encoding, "deflate")) then
			local stream = zlib.deflate(DEFLATE_LEVEL)  
			data = stream(data, "finish")
		end
	end
	
	--lualog.print("done " .. status)

	luci.http.header("Content-Encoding", "deflate")
	if (headers["server"] ~= nil) then						luci.http.header("Server",						headers["server"]) end
	if (headers["content-type"] ~= nil) then			luci.http.header("Content-Type",			headers["content-type"]) end
	if (headers["vary"] ~= nil) then							luci.http.header("Vary",							headers["vary"]) end
	if (headers["cache-control"] ~= nil) then			luci.http.header("Cache-Control",			headers["cache-control"]) end
	if (headers["pragma"] ~= nil) then 						luci.http.header("Pragma",						headers["pragma"]) end

	luci.http.status(tonumber(scode), stext)
	luci.http.write(data)
	
	--lualog.print("done ")
end
