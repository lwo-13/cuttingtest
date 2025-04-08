bind = '0.0.0.0:5005'

# 🧠 Use all 4 cores efficiently
workers = 9  # 2 * cores + 1 -> 2 * 4 + 1 = 9

# 💪 Each worker gets 2 threads for lightweight concurrency
threads = 2

# 📊 Logging (stdout)
accesslog = '-'
loglevel = 'debug'
capture_output = True
enable_stdio_inheritance = True

# ⏱️ Timeouts
timeout = 60
keepalive = 5

# 🔁 Reload disabled for production (default)
# reload = False
