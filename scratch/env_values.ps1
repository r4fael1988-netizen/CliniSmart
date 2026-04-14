# Script para adicionar variáveis de ambiente limpa na Vercel
# Usa arquivos temporários sem newline

$envVars = @{
    "N8N_WEBHOOK_BASE" = "https://lostbaskingshark-n8n.cloudfy.live/webhook/crm-manager-agent-v1"
    "EVOLUTION_INSTANCE_NAME" = "SOFIA_CRM"
    "JWT_SECRET" = "outro-secret-forte-aqui-123456789"
}

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    $tmpFile = "$PWD\temp_env_val.txt"
    [System.IO.File]::WriteAllText($tmpFile, $value)
    Write-Host "Adding $key..."
    & npx -y vercel env add $key production < $tmpFile
    Remove-Item $tmpFile -ErrorAction SilentlyContinue
}

Write-Host "Done! All env vars added."
