$root = $PSScriptRoot
$prefix = "http://localhost:5173/"
$mime = @{
  ".html"="text/html; charset=utf-8"; ".css"="text/css; charset=utf-8";
  ".js"="text/javascript; charset=utf-8"; ".svg"="image/svg+xml";
  ".jpg"="image/jpeg"; ".jpeg"="image/jpeg"; ".png"="image/png";
  ".ttf"="font/ttf"; ".woff2"="font/woff2"; ".webp"="image/webp"; ".ico"="image/x-icon"
}
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Output "serving $root at $prefix"
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
  if ($path -eq "/") { $path = "/index.html" }
  $file = Join-Path $root ($path -replace "^/","" -replace "/","\")
  $res = $ctx.Response
  $res.Headers.Add("Access-Control-Allow-Origin", "*")
  $res.Headers.Add("Cache-Control", "no-store")
  if (Test-Path $file -PathType Leaf) {
    $ext = [System.IO.Path]::GetExtension($file).ToLower()
    if ($mime.ContainsKey($ext)) { $res.ContentType = $mime[$ext] }
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $res.StatusCode = 404
    $b = [System.Text.Encoding]::UTF8.GetBytes("404 $path")
    $res.OutputStream.Write($b, 0, $b.Length)
  }
  $res.Close()
}
