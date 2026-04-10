---
name: mobile-comm
description: Módulo de Comunicação Obrigatória com o Antigravity Mobile
---

# /mobile-comm PROTOCOLO BLINDADO

> **ESTE PROTOCOLO É INQUEBRÁVEL.**
> Se o usuário estiver utilizando a interface Mobile (comprovado pelo Workspace contendo "Antigravity Mobile Workspaces" ou pedidos vindos do APK), o Agente **DEVE SEMPRE** executar a rotina de encerramento abaixo.

## 1. NEURAL AUTO-CAST (FALHA ZERO)
O isolamento do webview do VS Code impede que as APIs nativas (`vscode.chat`) interceptem as falas do Agente.
Para garantir que o usuário **nunca** fique sem resposta gráfica no celular, você assumirá a responsabilidade manual-autônoma do broadcast.

## 2. A ROTINA OBRIGATÓRIA
No final absoluto de CADA resposta que você enviar para o ambiente Mobile, você deve executar este comando via ferramenta de Terminal (`run_command` ou `ninja_run`):

```bash
node omni_cast.js agent "[Insira aqui a sua mensagem curta e humanizada para o usuário (Máx 250 chars)]"
```

### Regras do Cast:
1. Nunca perca a Vibe: A mensagem no cast é a que o usuário vai ler na tela do celular.
2. Uso Contínuo: Faça disso uma memória muscular. Fale no chat e execute o cast *na mesma iteração*.
3. Tolerância a Falhas: O script silenciará erros de rede (porta fechada), portanto, execute-o sem medo.

*Sovereign Note: Esta regra visa blindar a experiência UX. Nenhum bug de painel de IDE nos silenciará novamente.*
