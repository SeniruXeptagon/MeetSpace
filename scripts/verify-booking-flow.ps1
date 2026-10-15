$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$settings = @{}
$dotenv = Join-Path $root '.env'
if (Test-Path -LiteralPath $dotenv) {
    foreach ($line in Get-Content -LiteralPath $dotenv) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
            $settings[$matches[1]] = $matches[2].Trim().Trim('"', "'")
        }
    }
}

function Setting([string]$name, [string]$fallback) {
    if ($settings.ContainsKey($name) -and $settings[$name]) { return $settings[$name] }
    return $fallback
}

function Assert([bool]$condition, [string]$message) {
    if (-not $condition) { throw $message }
}

function Request([string]$method, [string]$url, [string]$token, $body = $null) {
    $headers = @{ Authorization = "Bearer $token" }
    $arguments = @{ Uri = $url; Method = $method; Headers = $headers; UseBasicParsing = $true; TimeoutSec = 15 }
    if ($null -ne $body) {
        $arguments.ContentType = 'application/json'
        $arguments.Body = ($body | ConvertTo-Json -Depth 8)
    }
    try {
        $response = Invoke-WebRequest @arguments
        $data = if ($response.Content) { $response.Content | ConvertFrom-Json } else { $null }
        return @{ Status = [int]$response.StatusCode; Data = $data; Headers = $response.Headers }
    } catch {
        if (-not $_.Exception.Response) { throw }
        return @{ Status = [int]$_.Exception.Response.StatusCode; Data = $null; Headers = $null }
    }
}

$keycloak = 'http://localhost:8081'
$api = 'http://localhost:8080'
$realm = 'meeting-room'
$clientId = 'booking-flow-check-' + [guid]::NewGuid().ToString('N').Substring(0, 10)
$secret = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
$clientUuid = $null
$subject = $null
$createdIds = @()
$adminToken = $null

try {
    $admin = Invoke-RestMethod -Uri "$keycloak/realms/master/protocol/openid-connect/token" -Method Post -Body @{
        client_id = 'admin-cli'
        grant_type = 'password'
        username = (Setting 'KEYCLOAK_ADMIN' 'admin')
        password = (Setting 'KEYCLOAK_ADMIN_PASSWORD' 'admin_dev_password')
    } -TimeoutSec 15
    $adminToken = $admin.access_token

    $createClient = Request 'POST' "$keycloak/admin/realms/$realm/clients" $adminToken @{
        clientId = $clientId
        secret = $secret
        enabled = $true
        publicClient = $false
        serviceAccountsEnabled = $true
        standardFlowEnabled = $false
        directAccessGrantsEnabled = $false
        protocol = 'openid-connect'
        clientAuthenticatorType = 'client-secret'
    }
    Assert ($createClient.Status -eq 201) "Temporary Keycloak client creation returned $($createClient.Status)."
    $clientUuid = ($createClient.Headers['Location'] -split '/')[-1]
    Assert (-not [string]::IsNullOrWhiteSpace($clientUuid)) 'Keycloak did not return the temporary client ID.'

    $mapper = Request 'POST' "$keycloak/admin/realms/$realm/clients/$clientUuid/protocol-mappers/models" $adminToken @{
        name = 'booking-test-api-audience'
        protocol = 'openid-connect'
        protocolMapper = 'oidc-audience-mapper'
        config = @{
            'included.custom.audience' = 'meeting-room-api'
            'access.token.claim' = 'true'
            'id.token.claim' = 'false'
        }
    }
    Assert ($mapper.Status -eq 201) "Temporary audience mapper creation returned $($mapper.Status)."

    $tokenReply = Invoke-RestMethod -Uri "$keycloak/realms/$realm/protocol/openid-connect/token" -Method Post -Body @{
        client_id = $clientId
        client_secret = $secret
        grant_type = 'client_credentials'
    } -TimeoutSec 15
    $token = $tokenReply.access_token
    $payloadPart = $token.Split('.')[1].Replace('-', '+').Replace('_', '/')
    $payloadPart = $payloadPart.PadRight($payloadPart.Length + ((4 - $payloadPart.Length % 4) % 4), '=')
    $claims = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payloadPart)) | ConvertFrom-Json
    $subject = $claims.sub
    Assert ($subject -match '^[0-9a-fA-F-]{36}$') 'Unexpected temporary service account subject.'
    Assert (@($claims.aud) -contains 'meeting-room-api') 'Test token is missing the API audience.'

    $rooms = Request 'GET' "$api/api/rooms" $token
    Assert ($rooms.Status -eq 200 -and @($rooms.Data).Count -gt 0) 'Could not list rooms.'
    $roomId = @($rooms.Data)[0].id
    $date = (Get-Date).AddDays(45).ToString('yyyy-MM-dd')
    $dayUrl = "$api/api/rooms/$roomId/bookings?date=$date"
    $day = Request 'GET' $dayUrl $token
    Assert ($day.Status -eq 200) 'Could not read room availability.'

    $startMinute = $null
    foreach ($minute in 600..1050 | Where-Object { $_ % 30 -eq 0 }) {
        $overlap = @($day.Data) | Where-Object {
            if (-not $_) { return $false }
            $existingStart = [datetime]::Parse($_.startTime).ToUniversalTime().TimeOfDay.TotalMinutes
            $existingEnd = [datetime]::Parse($_.endTime).ToUniversalTime().TimeOfDay.TotalMinutes
            $minute -lt $existingEnd -and ($minute + 30) -gt $existingStart
        }
        if (-not $overlap) { $startMinute = $minute; break }
    }
    Assert ($null -ne $startMinute) 'No 30-minute test slot is available.'
    $startTime = '{0:D2}:{1:D2}:00' -f [int][math]::Floor($startMinute / 60), [int]($startMinute % 60)
    $endMinute = $startMinute + 30
    $endTime = '{0:D2}:{1:D2}:00' -f [int][math]::Floor($endMinute / 60), [int]($endMinute % 60)
    $bookingUrl = "$api/api/rooms/$roomId/bookings"
    $requestBody = @{ date = $date; startTime = $startTime; endTime = $endTime }

    $created = Request 'POST' $bookingUrl $token $requestBody
    Assert ($created.Status -eq 201 -and $created.Data.id -gt 0) "Booking creation returned $($created.Status)."
    $createdIds += $created.Data.id
    Write-Output 'PASS: booking created'

    $mine = Request 'GET' "$api/api/bookings/mine" $token
    Assert ($mine.Status -eq 200 -and @($mine.Data | Where-Object { $_.id -eq $created.Data.id }).Count -eq 1) 'Booking did not appear in My Bookings.'
    $day = Request 'GET' $dayUrl $token
    Assert ($day.Status -eq 200 -and @($day.Data | Where-Object { $_.id -eq $created.Data.id }).Count -eq 1) 'Booking did not appear in room availability.'
    Write-Output 'PASS: booking visible in My Bookings and availability'

    $conflict = Request 'POST' $bookingUrl $token $requestBody
    Assert ($conflict.Status -eq 409) "Overlapping booking returned $($conflict.Status), expected 409."
    Write-Output 'PASS: overlapping booking rejected'

    $cancelled = Request 'DELETE' "$api/api/bookings/$($created.Data.id)" $token
    Assert ($cancelled.Status -eq 204) "Cancellation returned $($cancelled.Status)."
    $mine = Request 'GET' "$api/api/bookings/mine" $token
    Assert (@($mine.Data | Where-Object { $_.id -eq $created.Data.id -and $_.isCancelled }).Count -eq 1) 'Cancelled booking was not retained in My Bookings.'
    $day = Request 'GET' $dayUrl $token
    Assert (@($day.Data | Where-Object { $_.id -eq $created.Data.id }).Count -eq 0) 'Cancelled booking still blocks availability.'
    Write-Output 'PASS: cancellation retained in history and freed the slot'

    $replacement = Request 'POST' $bookingUrl $token $requestBody
    Assert ($replacement.Status -eq 201) "Rebooking the freed slot returned $($replacement.Status)."
    $createdIds += $replacement.Data.id
    Write-Output 'PASS: cancelled slot can be booked again'
} finally {
    if ($adminToken -and $clientUuid) {
        try {
            $removed = Request 'DELETE' "$keycloak/admin/realms/$realm/clients/$clientUuid" $adminToken
            Assert ($removed.Status -eq 204) 'Could not remove the temporary Keycloak client.'
        } catch { Write-Warning $_.Exception.Message }
    }
    if ($subject -and $createdIds.Count -gt 0) {
        $dbUser = Setting 'POSTGRES_USER' 'meetingroom'
        $dbName = Setting 'POSTGRES_DB' 'meetingroom'
        $sql = "DELETE FROM `"Users`" WHERE `"KeycloakUserId`" = '$subject';"
        try {
            $previous = Get-Location
            Set-Location $root
            $sql | & docker compose exec -T postgres psql -U $dbUser -d $dbName | Out-Null
            Assert ($LASTEXITCODE -eq 0) 'Could not remove temporary booking records.'
        } catch {
            throw "Temporary booking cleanup failed: $($_.Exception.Message)"
        } finally {
            if ($previous) { Set-Location $previous }
        }
    }
}
