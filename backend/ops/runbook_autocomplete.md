# Autocomplete Rebuild Runbook

이 문서는 **InstrumentMaster 기반 Autocomplete Redis 인덱스**를 운영에서 재구축(rebuild)하는 절차를 정리한다.

---

JPX / NASDAQ import가 끝난 뒤

현재 redis 버전 확인

fly ssh console -a stock-community -C 'bash -lc "cd /app && bin/rails runner \"puts InstrumentMasters::Autocomplete::KeyBuilder.current_version\" "'

## TL;DR (원클릭)

```bash
bash ops/rebuild_autocomplete_a.sh