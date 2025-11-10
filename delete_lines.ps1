$content = Get-Content 'D:\Pagevoo\pagevoo-frontend\src\pages\TemplateBuilder.tsx'
$newContent = $content[0..735] + $content[1510..($content.Length-1)]
Set-Content -Path 'D:\Pagevoo\pagevoo-frontend\src\pages\TemplateBuilder.tsx' -Value $newContent
