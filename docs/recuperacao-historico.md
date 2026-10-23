# Proposta segura de recuperação do histórico

Status: **investigação concluída; nenhuma importação, reconstrução ou sobrescrita foi realizada**.

## 1. O que foi verificado

| Fonte | Conteúdo encontrado | Situação |
|---|---|---|
| IndexedDB `dashboard-estudos` da origem atual | 0 registros | Vazio nesta origem/navegador/perfil. Não prova perda: o IndexedDB é isolado por origem. |
| `integracao/estado-estudos.json` | Resumo v2 do catálogo e das contagens **relatadas** | Não é backup restaurável e não contém registros pessoais. |
| `integracao/mapeamento-migracao-v1-v2.json` | Mapeamento candidato legado → novo | Somente leitura; não converte nem grava. |
| `.audit-backup-2026-10-22/historicalProgress.ts` (backup externo do projeto) | Registros derivados do relato, com datas inventadas | **Não importar.** Não representa histórico confirmado. |
| Backups do projeto em `AppData\Local\Dashboard-Estudos-Recovery` | Cópias de código/testes | Não contêm JSON de progresso. |
| `src/progressMigration.ts` | Manifesto de reconciliação com decisão `preservar_sem_converter` | Migração real permanece desativada. |

Nenhum arquivo de backup v1 (`app: Dashboard-Estudos`, `versao: 1`) com registros pessoais foi encontrado no projeto.

## 2. Mecanismos existentes e compatibilidade

- **Backup v1 completo**: exportado em Configurações pelo navegador na origem correta. É o único formato que restaura registros e configurações. A importação mostra prévia, exige confirmação e permite mesclar ou substituir; substituição exige digitar `SUBSTITUIR` e baixar um backup de segurança.
- **Sessões/intercâmbio v2**: importação manual, aditiva, com prévia e aprovação explícita. Serve para atualizações pontuais, não para reconstruir todo o histórico.
- **Registros legados** (`roadmapStage` sem `topicId`): preservados e visíveis no Roteiro legado, mas fora do percentual principal. Não são convertidos automaticamente.
- **Prévia de mesclagem**: sinaliza arquivo vazio, importação parcial e conflito de mesmo `id`. Nada é gravado antes da confirmação.

## 3. Conflitos e limitações de mapeamento

As contagens relatadas têm granularidade diferente do catálogo atual, então não podem ser convertidas por inferência:

| Relato histórico | Catálogo atual | Conflito |
|---|---|---|
| Python: curso básico concluído | 4 tópicos suplementares | Não há identificação de quais tópicos foram concluídos. |
| POO 18/18 | 4 tópicos na matéria Arquitetura de software | 18 exercícios não equivalem a 4 tópicos. |
| Git e GitHub 9/9 | 3 tópicos | Contagem incompatível. |
| SQL 34/34 | 4 tópicos | Contagem incompatível. |
| Web Fundamentals 8/8 | 5 tópicos (`web.fundamentos`) | Contagem incompatível. |
| DSA 6/15 | 15 tópicos, 6 recuperados e 9 propostos | Quais 6 foram concluídos precisa de confirmação explícita. |
| JavaScript em andamento (`map`, `filter`, `reduce`) | 4 tópicos | Não indica automaticamente um único status por tópico. |

Além disso, dois tópicos da matéria Arquitetura de software (`fundamentos.poo.modelagem` e `fundamentos.sqlite.python`) têm pré-requisito em `fundamentos.python.estruturas`, que é suplementar. A ordem oficial das 20 matérias foi mantida; o bloqueio pedagógico continua valendo e está indicado na interface.

## 4. Proposta (somente após aprovação do usuário)

1. **Localizar a origem correta**: repetir a verificação em cada navegador, perfil e endereço usado (por exemplo `localhost` em portas diferentes, `file://` ou URL publicada). O IndexedDB não é compartilhado entre origens.
2. **Exportar um backup v1** dessa origem, sem limpar nem redefinir nada.
3. **Validar na prévia** deste app: conferir `app`, `versao`, quantidade de registros, conflitos e registros desconhecidos. Não confirmar a importação nessa etapa.
4. **Comparar com o relato** e listar explicitamente, tópico a tópico, o que o usuário confirma. Datas desconhecidas não devem ser inventadas; usar o estado de andamento confirmado (`Em andamento`) ou deixar sem data de conclusão.
5. **Baixar um backup de segurança** da origem atual antes de qualquer escrita.
6. **Importar em modo mesclar**. Substituir só é aceitável quando o backup for completo, validado e o usuário digitar `SUBSTITUIR`.
7. **Conferir depois**: totais principal (137), suplementares (13), DSA (15) e catálogo (165), além do histórico de status de cada tópico.

Se nenhum backup válido for encontrado, a recuperação deve ser **manual e confirmada**, tópico a tópico. Este repositório não contém dados suficientes para reconstruir o histórico sem inventar conclusões ou datas.
