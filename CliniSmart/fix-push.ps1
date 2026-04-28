# Reset do commit anterior (mantém as mudanças)
Write-Host "🔄 Revertendo commit anterior..." -ForegroundColor Yellow
git reset --soft HEAD~1

# Aguarda um momento
Start-Sleep -Seconds 1

Write-Host "✅ Commit revertido. Agora fazendo novo commit com as chaves removidas..." -ForegroundColor Green

# Add das mudanças (sem as chaves sensíveis)
git add .

# Novo commit
git commit -m "✨ feat: Configurações da Clínica + API Clinic Settings + Admin Dashboard (sem secrets)"

Write-Host "📤 Fazendo push para GitHub..." -ForegroundColor Cyan
git push origin main

Write-Host ""
Write-Host "✅ Pronto! Push concluído com sucesso!" -ForegroundColor Green
