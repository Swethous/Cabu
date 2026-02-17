mkdir -p ops && cat > ops/rebuild_autocomplete_a.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail

APP="${APP:-stock-community}"
V="${V:-3}"          # 고정할 autocomplete version
CAP="${CAP:-30}"

# sym (빠르게)
SYM_BATCH="${SYM_BATCH:-200}"
SYM_SLEEP="${SYM_SLEEP:-0.03}"
SYM_LOG_EVERY="${SYM_LOG_EVERY:-500}"

# name (안정적으로)
NAME_BATCH="${NAME_BATCH:-100}"
NAME_SLEEP="${NAME_SLEEP:-0.08}"
NAME_LOG_EVERY_JPX="${NAME_LOG_EVERY_JPX:-100}"
NAME_LOG_EVERY_NASDAQ="${NAME_LOG_EVERY_NASDAQ:-200}"

run() {
  local cmd="$1"
  echo
  echo "==> $cmd"
  fly ssh console -a "$APP" -C "bash -lc 'cd /app && $cmd'"
}

echo "============================================================"
echo "[A] Rebuild Autocomplete Index"
echo "APP=$APP"
echo "VERSION=$V"
echo "CAP=$CAP"
echo "============================================================"

# 0) Redis flushall
run "bin/rails runner \"InstrumentMasters::RedisStore::Client.with{|r| puts r.flushall }\""

# 1) version 고정
run "bin/rails runner \"InstrumentMasters::RedisStore::Client.with{|r| r.set(InstrumentMasters::Autocomplete::KeyBuilder::VERSION_KEY, $V); puts({set_version: r.get(InstrumentMasters::Autocomplete::KeyBuilder::VERSION_KEY)}) }\""

# 2) JPX sym
run "bin/rails runner 'RebuildAutocompleteIndexJob.perform_now(providers: %w[JPX], kinds: %w[sym], cap: $CAP, batch_size: $SYM_BATCH, sleep_sec: $SYM_SLEEP, bump_version: false, log_every: $SYM_LOG_EVERY); puts :JPX_SYM_OK'"

# 3) NASDAQ_LISTED sym
run "bin/rails runner 'RebuildAutocompleteIndexJob.perform_now(providers: %w[NASDAQ_LISTED], kinds: %w[sym], cap: $CAP, batch_size: $SYM_BATCH, sleep_sec: $SYM_SLEEP, bump_version: false, log_every: $SYM_LOG_EVERY); puts :NASDAQ_SYM_OK'"

# 4) JPX name
run "bin/rails runner 'RebuildAutocompleteIndexJob.perform_now(providers: %w[JPX], kinds: %w[name], cap: $CAP, batch_size: $NAME_BATCH, sleep_sec: $NAME_SLEEP, bump_version: false, log_every: $NAME_LOG_EVERY_JPX); puts :JPX_NAME_OK'"

# 5) NASDAQ_LISTED name
run "bin/rails runner 'RebuildAutocompleteIndexJob.perform_now(providers: %w[NASDAQ_LISTED], kinds: %w[name], cap: $CAP, batch_size: $NAME_BATCH, sleep_sec: $NAME_SLEEP, bump_version: false, log_every: $NAME_LOG_EVERY_NASDAQ); puts :NASDAQ_NAME_OK'"

# 6) quick verify
run "bin/rails runner \"v=InstrumentMasters::Autocomplete::KeyBuilder.current_version; puts({current_version: v})\""

run "bin/rails runner \"v=InstrumentMasters::Autocomplete::KeyBuilder.current_version; InstrumentMasters::RedisStore::Client.with{|r| k=\\\"ac:#{v}:JPX:sym:7203\\\"; p({key:k, exists:r.exists(k), sample:r.zrevrange(k,0,5)}) }\""

run "bin/rails runner \"v=InstrumentMasters::Autocomplete::KeyBuilder.current_version; InstrumentMasters::RedisStore::Client.with{|r| k=\\\"ac:#{v}:NASDAQ_LISTED:sym:AAPL\\\"; p({key:k, exists:r.exists(k), sample:r.zrevrange(k,0,5)}) }\""

echo
echo "✅ DONE: A안 rebuild complete."
SH

chmod +x ops/rebuild_autocomplete_a.sh