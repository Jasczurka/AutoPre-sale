# Full system cycle test
# 1. Registration/Login
# 2. Create project
# 3. Upload TZ file
# 4. Check Kafka event publication
# 5. Check document-analysis-service processing
# 6. Check file in MinIO

Write-Host "=== FULL SYSTEM CYCLE TEST ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: User registration
Write-Host "[1/6] User registration..." -ForegroundColor Yellow
$registerBody = @{
    email = "test@example.com"
    password = "Test123!"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:5158/api/Auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "OK: User registered" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409 -or $_.Exception.Response.StatusCode -eq 400) {
        Write-Host "WARN: User already exists, continuing..." -ForegroundColor Yellow
    } else {
        Write-Host "ERROR: Registration failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Step 2: Login
Write-Host "[2/6] Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@example.com"
    password = "Test123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5158/api/Auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.accessToken
    Write-Host "OK: Token received" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Create project
Write-Host "[3/6] Creating project..." -ForegroundColor Yellow
$projectBody = @{
    name = "Test Project " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    description = "Project for testing TZ upload"
    status = "Draft"
    clientName = "Test Client"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $projectResponse = Invoke-RestMethod -Uri "http://localhost:5159/api/Projects" -Method Post -Body $projectBody -Headers $headers
    $projectId = $projectResponse.id
    Write-Host "OK: Project created: $projectId" -ForegroundColor Green
    Write-Host "  Name: $($projectResponse.name)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Project creation failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "  Response: $responseBody" -ForegroundColor Red
    }
    exit 1
}

# Step 4: Create test TZ file
Write-Host "[4/6] Creating test TZ file..." -ForegroundColor Yellow
$testFileContent = "TECHNICAL SPECIFICATION`n`n1. GENERAL INFORMATION`nProject: Project Management System`nGoal: Business Process Automation`n`n2. REQUIREMENTS`n2.1. Functional Requirements`n- Project Management`n- Task Management`n- Reporting`n`n2.2. Non-Functional Requirements`n- Performance: 1000 requests/sec`n- Security: Data encryption`n- Scalability: Horizontal scaling`n`n3. TECHNOLOGY STACK`n- Backend: .NET 8.0`n- Frontend: React`n- Database: PostgreSQL`n- Message Queue: Kafka`n- Storage: MinIO"

$testFilePath = "$env:TEMP\test_tz.txt"
$testFileContent | Out-File -FilePath $testFilePath -Encoding UTF8 -NoNewline
Write-Host "OK: Test file created: $testFilePath" -ForegroundColor Green

# Step 5: Upload TZ file
Write-Host "[5/6] Uploading TZ file to project..." -ForegroundColor Yellow

# Create multipart form data
$boundary = [System.Guid]::NewGuid().ToString()
$fileBytes = [System.IO.File]::ReadAllBytes($testFilePath)
$fileName = "test_tz.txt"

$LF = "`r`n"
$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
    "Content-Type: text/plain",
    "",
    [System.Text.Encoding]::UTF8.GetString($fileBytes),
    "--$boundary--"
)
$body = $bodyLines -join $LF

$uploadHeaders = @{
    "Authorization" = "Bearer $token"
}

try {
    $uploadResponse = Invoke-RestMethod -Uri "http://localhost:5159/api/Projects/$projectId/documents" -Method Post -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) -Headers $uploadHeaders -ContentType "multipart/form-data; boundary=$boundary"
    $documentId = $uploadResponse.id
    $fileUrl = $uploadResponse.fileUrl
    Write-Host "OK: File uploaded successfully!" -ForegroundColor Green
    Write-Host "  Document ID: $documentId" -ForegroundColor Gray
    Write-Host "  File URL: $fileUrl" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: File upload failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "  Server response: $responseBody" -ForegroundColor Red
    }
    exit 1
}

# Step 6: Wait for processing
Write-Host "[6/6] Waiting for document-analysis-service processing..." -ForegroundColor Yellow
Write-Host "  Waiting 30 seconds for processing..." -ForegroundColor Gray
Start-Sleep -Seconds 30

# Check results
Write-Host ""
Write-Host "=== CHECKING RESULTS ===" -ForegroundColor Cyan
Write-Host ""

# Check document-analysis-service logs
Write-Host "Checking document-analysis-service logs..." -ForegroundColor Yellow
$logs = docker logs document-analysis-service --tail 50 2>&1
if ($logs -match "FileUploaded|file-uploaded|project_id.*$projectId") {
    Write-Host "OK: FileUploaded event processed" -ForegroundColor Green
} else {
    Write-Host "WARN: FileUploaded event not found in logs" -ForegroundColor Yellow
}

if ($logs -match "Analysis completed successfully") {
    Write-Host "OK: Analysis completed successfully" -ForegroundColor Green
} else {
    Write-Host "WARN: Analysis not completed or still running" -ForegroundColor Yellow
}

# Check project-service logs
Write-Host ""
Write-Host "Checking project-service logs..." -ForegroundColor Yellow
$projectLogs = docker logs project-service --tail 30 2>&1
if ($projectLogs -match "error|Error|ERROR|exception|Exception") {
    Write-Host "WARN: Errors found in project-service logs" -ForegroundColor Yellow
    $projectLogs | Select-String -Pattern "error|Error|ERROR|exception|Exception" | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Red
    }
} else {
    Write-Host "OK: No errors in project-service logs" -ForegroundColor Green
}

# Check Kafka topic
Write-Host ""
Write-Host "Checking Kafka topic file-uploaded..." -ForegroundColor Yellow
try {
    $kafkaCheck = docker exec kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic file-uploaded --from-beginning --max-messages 1 --timeout-ms 5000 2>&1
    if ($kafkaCheck -match "project_id|file_url") {
        Write-Host "OK: Events found in Kafka" -ForegroundColor Green
    } else {
        Write-Host "WARN: Events not found in Kafka (may be already processed)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "WARN: Could not check Kafka directly" -ForegroundColor Yellow
}

# Check MinIO
Write-Host ""
Write-Host "Checking MinIO..." -ForegroundColor Yellow
try {
    $minioObjects = docker exec minio mc ls minio/documents/ 2>&1
    if ($minioObjects -match $projectId) {
        Write-Host "OK: Files found in MinIO" -ForegroundColor Green
        $minioObjects | Select-String -Pattern $projectId | ForEach-Object {
            Write-Host "  $_" -ForegroundColor Gray
        }
    } else {
        Write-Host "WARN: Files with project_id not found in MinIO" -ForegroundColor Yellow
    }
} catch {
    Write-Host "WARN: Could not check MinIO directly" -ForegroundColor Yellow
}

# Final summary
Write-Host ""
Write-Host "=== FINAL SUMMARY ===" -ForegroundColor Cyan
Write-Host "Project ID: $projectId" -ForegroundColor White
Write-Host "Document ID: $documentId" -ForegroundColor White
Write-Host "File URL: $fileUrl" -ForegroundColor White
Write-Host ""
Write-Host "Test completed!" -ForegroundColor Green
