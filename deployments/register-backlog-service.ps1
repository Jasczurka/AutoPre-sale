# Скрипт для регистрации BacklogService в Consul

Write-Host "Waiting for backlog-service to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$maxRetries = 30
$retryCount = 0

while ($retryCount -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5160/swagger/index.html" -Method GET -TimeoutSec 5 -ErrorAction Stop
        Write-Host "BacklogService is ready!" -ForegroundColor Green
        break
    } catch {
        $retryCount++
        Write-Host "Waiting for BacklogService... ($retryCount/$maxRetries)" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if ($retryCount -eq $maxRetries) {
    Write-Host "BacklogService did not become ready in time" -ForegroundColor Red
    exit 1
}

# Проверяем и удаляем старые регистрации с неправильными ID
Write-Host "Checking for existing registrations..." -ForegroundColor Yellow
try {
    $existingServices = Invoke-RestMethod -Uri "http://localhost:8500/v1/agent/services" -Method Get
    $backlogServices = $existingServices.PSObject.Properties | Where-Object { $_.Value.Name -eq "backlog-service" -and $_.Value.ID -ne "backlog-service-8080" }
    foreach ($service in $backlogServices) {
        Write-Host "Removing old registration: $($service.Value.ID)" -ForegroundColor Yellow
        Invoke-RestMethod -Uri "http://localhost:8500/v1/agent/service/deregister/$($service.Value.ID)" -Method Put -ErrorAction SilentlyContinue
    }
} catch {
    Write-Host "Warning: Could not check existing services: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Регистрируем BacklogService в Consul
$serviceDefinition = @{
    ID = "backlog-service-8080"
    Name = "backlog-service"
    Address = "backlog-service"
    Port = 8080
    Check = @{
        HTTP = "http://backlog-service:8080/swagger/index.html"
        Interval = "10s"
        Timeout = "3s"
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8500/v1/agent/service/register" -Method Put -Body $serviceDefinition -ContentType "application/json"
    Write-Host "BacklogService registered in Consul successfully!" -ForegroundColor Green
} catch {
    Write-Host "Failed to register BacklogService in Consul: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}


