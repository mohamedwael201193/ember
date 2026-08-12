# Security (public)

## Secrets

- Never commit `.env`  
- Never put `kh_` keys in `VITE_` / browser bundles  
- Never paste keys into agent chat  
- Rotate immediately if a key appears in a screenshot, log, or PR  

## Modes

- Default local path is **DEMO FIXTURE** (no spend)  
- Mainnet writes require explicit configuration and human confirmation  
- Keep production schedules disabled unless intentionally operating  

## Credential isolation

- Org A and Org B keys stay separate  
- Observer and Sentinel shared secrets must differ  
- BFF holds server secrets; browser talks to BFF only  

## Threat model

Deeper notes: [THREAT_MODEL.md](./THREAT_MODEL.md) · [SERVICE_AUTH.md](./SERVICE_AUTH.md)

## If secrets were ever tracked in git

1. Rotate all exposed credentials first  
2. Report history remediation separately  
3. Do not rewrite git history automatically in this DX pass
