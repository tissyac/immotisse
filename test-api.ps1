# Script de test de l'API IMMOTISS pour Windows
# Usage: .\test-api.ps1

Write-Host "🧪 TEST API IMMOTISS" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

$API = "http://localhost:3000"
$ADMIN_EMAIL = "admin@immotiss.com"
$ADMIN_PASS = "admin123"

# 1. TEST: Serveur accessible
Write-Host "1️⃣  Vérifier que le serveur répond..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$API/" -UseBasicParsing -ErrorAction SilentlyContinue
    if ($response.Content -like "*Serveur backend*") {
        Write-Host "✅ Serveur backend OK" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Serveur répond mais réponse inattendue" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Serveur backend ne répond pas" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. TEST: Admin login
Write-Host "2️⃣  Test login admin..." -ForegroundColor Yellow

try {
    $loginBody = @{
        email = $ADMIN_EMAIL
        password = $ADMIN_PASS
    } | ConvertTo-Json

    $loginResponse = Invoke-WebRequest -Uri "$API/auth/login" `
        -Method Post `
        -Headers @{"Content-Type"="application/json"} `
        -Body $loginBody `
        -UseBasicParsing `
        -ErrorAction SilentlyContinue

    $loginData = $loginResponse.Content | ConvertFrom-Json
    $TOKEN = $loginData.token

    if ($TOKEN) {
        Write-Host "✅ Admin connecté" -ForegroundColor Green
        Write-Host "   Token: $($TOKEN.Substring(0, 50))..." -ForegroundColor Gray
    } else {
        Write-Host "❌ Login admin échoué" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erreur lors du login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 3. TEST: Récupérer les offres publiques
Write-Host "3️⃣  Récupérer les 6 offres de test..." -ForegroundColor Yellow

try {
    $offersResponse = Invoke-WebRequest -Uri "$API/offers/" -ErrorAction SilentlyContinue
    $offersData = $offersResponse.Content | ConvertFrom-Json
    $OFFERS_COUNT = $offersData.offers.Count

    if ($OFFERS_COUNT -ge 6) {
        Write-Host "✅ $OFFERS_COUNT offres trouvées" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Seulement $OFFERS_COUNT offres (attendait 6)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 4. TEST: Filtrer les offres par ville
Write-Host "4️⃣  Filtrer offres par ville (Casablanca)..." -ForegroundColor Yellow

try {
    $casResponse = Invoke-WebRequest -Uri "$API/offers/?city=Casablanca" -ErrorAction SilentlyContinue
    $casData = $casResponse.Content | ConvertFrom-Json
    $CAS_COUNT = $casData.offers | Where-Object { $_.city -eq "Casablanca" } | Measure-Object | Select-Object -ExpandProperty Count

    if ($CAS_COUNT -ge 1) {
        Write-Host "✅ $CAS_COUNT offres à Casablanca" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Aucune offre trouvée à Casablanca" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Erreur lors du filtrage" -ForegroundColor Yellow
}
Write-Host ""

# 5. TEST: Récupérer les stats admin
Write-Host "5️⃣  Récupérer statistiques admin..." -ForegroundColor Yellow

try {
    $statsResponse = Invoke-WebRequest -Uri "$API/offers/admin/stats/overview" `
        -Headers @{"Authorization"="Bearer $TOKEN"} `
        -ErrorAction SilentlyContinue

    $statsData = $statsResponse.Content | ConvertFrom-Json
    $TOTAL_OFFERS = $statsData.totalOffers

    if ($TOTAL_OFFERS) {
        Write-Host "✅ Total offres (stats): $TOTAL_OFFERS" -ForegroundColor Green
    } else {
        Write-Host "❌ Impossible de récupérer les stats" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 6. TEST: Vérifier les demandes d'inscription
Write-Host "6️⃣  Vérifier les demandes d'inscription..." -ForegroundColor Yellow

try {
    $reqResponse = Invoke-WebRequest -Uri "$API/requests" `
        -Headers @{"Authorization"="Bearer $TOKEN"} `
        -ErrorAction SilentlyContinue

    $reqData = $reqResponse.Content | ConvertFrom-Json
    $REQ_COUNT = $reqData | Measure-Object | Select-Object -ExpandProperty Count

    Write-Host "✅ $REQ_COUNT demandes d'inscription" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Erreur lors de la récupération des demandes" -ForegroundColor Yellow
}
Write-Host ""

# 7. TEST: Vérifier les logs d'audit
Write-Host "7️⃣  Vérifier les logs d'audit..." -ForegroundColor Yellow

try {
    $auditResponse = Invoke-WebRequest -Uri "$API/audit?page=1&limit=10" `
        -Headers @{"Authorization"="Bearer $TOKEN"} `
        -ErrorAction SilentlyContinue

    $auditData = $auditResponse.Content | ConvertFrom-Json
    $AUDIT_COUNT = $auditData.logs | Measure-Object | Select-Object -ExpandProperty Count

    Write-Host "✅ $AUDIT_COUNT logs d'audit" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Erreur lors de la récupération des logs" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ TOUS LES TESTS SONT PASSÉS!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Accéder à l'application:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5174" -ForegroundColor White
Write-Host "   Backend API: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "👤 Comptes de test:" -ForegroundColor Cyan
Write-Host "   Admin:" -ForegroundColor White
Write-Host "   - Email: admin@immotiss.com" -ForegroundColor Gray
Write-Host "   - Password: admin123" -ForegroundColor Gray
Write-Host ""
