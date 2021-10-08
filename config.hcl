consul {

  address = $CONSUL_ADDR
  token = $CONSUL_TOKEN

  retry {
    enabled = true
    attempts = 12
    backoff = "250ms"
    max_backoff = "1m"
  }

  ssl {
    enabled = false
  }
}

exec {

  command = "node packages/backend --config app-config.yaml"
  splay = "5s"

  env {
    pristine = false
  }

  kill_signal = "SIGTERM"
  kill_timeout = "2s"
}

kill_signal = "SIGINT"
log_level = "warn"
max_stale = "10m"

prefix {
  no_prefix = true
  path = "config/bih/development"
}

pristine = false
reload_signal = "SIGHUP"
sanitize = false
upcase = false
