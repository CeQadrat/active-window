Param(
    [string]$srcPath,[string]$destPath
)

$srcPath
$destPath

$runtimeDirectory = 'C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.0\'
$compiler = $([System.Runtime.InteropServices.RuntimeEnvironment]::GetRuntimeDirectory()) + 'csc.exe'

$csharpRef = '/reference:"' + $runtimeDirectory + 'Microsoft.CSharp.dll"'
$corelibRef = '/reference:"' + $runtimeDirectory + 'mscorlib.dll"'
$presentationCoreRef = '/reference:"' + $runtimeDirectory + 'PresentationCore.dll"'
$systemCoreRef = '/reference:"' + $runtimeDirectory + 'System.Core.dll"'
$systemRef = '/reference:"' + $runtimeDirectory + 'System.dll"'
$systemXmlRef = '/reference:"' + $runtimeDirectory + 'System.Xml.dll"'
$systemXmlLinqRef = '/reference:"' + $runtimeDirectory + 'System.Xml.Linq.dll"'
$windowsBaseRef = '/reference:"' + $runtimeDirectory + 'WindowsBase.dll"'
$systemXamlRef = '/reference:"' + $runtimeDirectory + 'System.Xaml.dll"'

$prm = '/noconfig', "/nowarn:1701,1702,2008", '/nostdlib+', '/platform:x64', '/errorreport:prompt', '/errorendlocation', "/define:DEBUG;TRACE", `
$csharpRef, $corelibRef, $presentationCoreRef, $systemCoreRef, $systemRef, $systemXmlRef, $systemXmlLinqRef, $windowsBaseRef, $systemXamlRef, `
"/out:`"$destPath`"", "/target:library", $srcPath

& $compiler $prm
