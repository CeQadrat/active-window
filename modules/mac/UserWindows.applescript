on getPID(theApp)
	return id of theApp
end getPID

on getProcessName(theApp)
	tell application "System Events"
		set theAppPath to file of theApp as alias
		set theAppName to name of theApp
		
		set isPackage to (package folder of theAppPath)
		if isPackage = false then
			return theAppName
		end if
		
		set pathToPropList to (path of theAppPath) & "Contents:Info.plist" as string
		
		tell property list file pathToPropList
			set bundleIdProperty to "CFBundleIdentifier"
			if exists property list item bundleIdProperty then
				return (value of property list item bundleIdProperty)
			else
				return theAppName
			end if
		end tell
	end tell
end getProcessName

on getAppName(theApp)
	tell application "System Events"
		set theAppPath to file of theApp as alias
		set theAppName to name of theAppPath
		if theAppName ends with ".app" then set theAppName to text 1 thru -5 of theAppName
	end tell
	return theAppName
end getAppName

on scaleImageAndConvert(theImgPath)
	tell application "System Events"
		tell application "Image Events"
			set theImage to open theImgPath
			
			set randomHash to ""
			repeat with x from 1 to 5
				set randomChar to ASCII character (random number from 97 to 122)
				set randomHash to randomHash & randomChar
			end repeat
			
			tell theImage
				set theName to name
				set theSavePath to "/tmp/" & "tmp-" & randomHash & "-" & theName
				scale to size 64
				save as PNG in theSavePath
				set b64 to do shell script "openssl enc -base64 -in \"" & theSavePath & "\" | tr -d \"\\n\""
			end tell
		end tell
		delete alias theSavePath
	end tell
	if b64 = "" then
		error "Error converting to base64"
	end if
	return b64
end scaleImageAndConvert

on getIconBase64(theApp)
	tell application "System Events"
		set theAppPath to file of theApp as alias
		
		set isPackage to (package folder of theAppPath)
		if isPackage = false then
			error "Icon cannot be extracted from " & (name of theAppPath) & "because it is not a package"
		end if
		
		set pathToPropList to (path of theAppPath) & "Contents:Info.plist" as string
		
		tell property list file pathToPropList
			set iconProperty to "CFBundleIconFile"
			
			if not (exists property list item iconProperty) then
				error "Icon cannot be extracted"
			end if
			
			set iconFile to value of property list item iconProperty
			if iconFile does not end with ".icns" then set iconFile to iconFile & ".icns"
			set pathToIcon to (path of theAppPath) & "Contents:Resources:" & iconFile as string
		end tell
		
		if (exists file pathToIcon) = false then
			error "Icon cannot be extracted from " & (name of theAppPath) & " becouse it is not found in Resources"
		end if
	end tell
	
	return my scaleImageAndConvert(pathToIcon)
end getIconBase64

on getWindowTitle(theApp)
	tell application "System Events"
		tell process (name of theApp)
			if exists (1st window whose value of attribute "AXMain" is true) then
				tell (1st window whose value of attribute "AXMain" is true)
					return (value of attribute "AXTitle")
				end tell
			else
				return ""
			end if
		end tell
	end tell
end getWindowTitle

on getActiveApp()
	tell application "System Events"
		return (first application process whose frontmost is true)
	end tell
end getActiveApp

on run
	local err, icon, frontApp, pId, processName, appName, windowTitle
	
	set icon to ""
	set err to ""
	set frontApp to my getActiveApp()
	set pId to my getPID(frontApp)
	set processName to my getProcessName(frontApp)
	set appName to my getAppName(frontApp)
	
	try
		set icon to my getIconBase64(frontApp)
	on error errMsg
		set err to errMsg
	end try
	
	set windowTitle to my getWindowTitle(frontApp)
	
	return "@{Id=" & pId & "; ProcessName=" & processName & "; AppTitle=" & windowTitle & "; AppName=" & appName & "; Icon=" & icon & "; Error=" & err & "}"
end run
