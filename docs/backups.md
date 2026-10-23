# Backups e restauração

## Tipos
- **Backup do código:** cópias fora da pasta do projeto (ex.: `AppData\Local\Dashboard-Estudos-Recovery`). Exclui `node_modules`, `.git`, `dist`.
- **Backup dos dados de estudo:** exportado pelo dashboard em Configurações. Formato **v1**. É o único meio para restaurar registros do IndexedDB. O arquivo `integracao/estado-estudos.json` é um **resumo para intercâmbio manual**, não é backup restaurável.

## Como funciona hoje
- Exportação/importação v1 com prévia, mesclagem/substituição, confirmação e proteção contra arquivo vazio.
- Importação v2 aditiva com aprovação explícita.
- Registros legados preservados.

## Limitações
- **Armazenamento local do navegador:** IndexedDB é por origem/perfil. Não existe backup automático na nuvem configurado neste repositório.
- Não há serviço de backend agendado neste projeto. Qualquer backup automático na nuvem exigiria infraestrutura externa, credenciais e autorização explícita.

## Procedimento de restauração
1. Baixar backup de segurança da origem atual antes de qualquer escrita.
2. Validar prévia (app, versão, conflitos).
3. Importar em **mesclar** quando possível.
4. **Substituir** só com backup completo validado e digitando `SUBSTITUIR`.
5. Conferir totais (137 principais / 13 suplementares / 15 DSA / 165 catálogo).

## Plano seguro de histórico
Ver `docs/recuperacao-historico.md`. Não inventar datas/conclusões.
