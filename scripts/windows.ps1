[CmdletBinding()]
Param(
    [string]$libPath,[string]$n,[string]$interval
)
Add-Type -Path $libPath
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
try {
	while($n -ne 0){
	    $AppInfo = [UserWindows]::GetForegroundAppInfo()
	    $string = $AppInfo | Select Id, ProcessName, AppTitle, AppName, Icon, Error
	    Write-Host -NoNewline $string
	    Start-Sleep -s $interval
	    If ($n -gt 0) {$n-=1}
	}
} catch {
 Write-Error "Failed to get active Window details. More Info: $_"
}
