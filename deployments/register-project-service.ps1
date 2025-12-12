# Скрипт для регистрации ProjectService в Consul

Write-Host "Waiting for project-service to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$maxRetries = 30
$retryCount = 0

while ($retryCount -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5159/swagger/index.html" -Method GET -TimeoutSec 5 -ErrorAction Stop
        Write-Host "ProjectService is ready!" -ForegroundColor Green
        break
    } catch {
        $retryCount++
        Write-Host "Waiting for ProjectService... ($retryCount/$maxRetries)" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if ($retryCount -eq $maxRetries) {
    Write-Host "ProjectService did not become ready in time" -ForegroundColor Red
    exit 1
}

# Регистрируем ProjectService в Consul
$serviceDefinition = @{
    ID = "project-service-8080"
    Name = "project-service"
    Address = "project-service"
    Port = 8080
    Check = @{
        HTTP = "http://project-service:8080/swagger/index.html"
        Interval = "10s"
        Timeout = "3s"
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8500/v1/agent/service/register" -Method Put -Body $serviceDefinition -ContentType "application/json"
    Write-Host "ProjectService registered in Consul successfully!" -ForegroundColor Green
} catch {
    Write-Host "Failed to register ProjectService in Consul: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

