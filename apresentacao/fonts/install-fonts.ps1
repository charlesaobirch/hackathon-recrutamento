$fonts = 'HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Fonts'
$entries = @(
    @{ Name = 'Bricolage Grotesque Bold (TrueType)'; File = 'BricolageGrotesque-Bold.ttf' },
    @{ Name = 'Instrument Sans (TrueType)'; File = 'InstrumentSans-Regular.ttf' },
    @{ Name = 'Instrument Sans Bold (TrueType)'; File = 'InstrumentSans-Bold.ttf' }
)
foreach ($e in $entries) {
    New-ItemProperty -Path $fonts -Name $e.Name -Value $e.File -PropertyType String -Force | Out-Null
}
Add-Type -Name Gdi -Namespace Win -MemberDefinition '[DllImport("gdi32.dll")] public static extern int AddFontResource(string lpFileName);'
foreach ($e in $entries) {
    $full = Join-Path $env:LOCALAPPDATA ('Microsoft\Windows\Fonts\' + $e.File)
    $n = [Win.Gdi]::AddFontResource($full)
    Write-Output ("{0} -> {1} faces" -f $e.File, $n)
}
Get-ItemProperty -Path $fonts |
    Select-Object 'Bricolage Grotesque Bold (TrueType)', 'Instrument Sans (TrueType)', 'Instrument Sans Bold (TrueType)' |
    Format-List