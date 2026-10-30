.PHONY: all test lint fuzz bench security-audit clean

NODE ?= node

all: lint test

lint:
	@echo "==> Checking syntax across src/ and tests/..."
	@$(NODE) --check src/index.js
	@$(NODE) --check tests/fuzz.js

test:
	@echo "==> Running unit and CI/CD injection security tests..."
	@$(NODE) --test tests/*.test.js

fuzz:
	@echo "==> Executing continuous cryptographic & runner fuzzing..."
	@$(NODE) tests/fuzz.js

bench:
	@echo "==> Running AEAD & masking throughput benchmarks..."
	@$(NODE) scripts/benchmark.js

security-audit:
	@echo "==> Verifying zero external runtime dependencies..."
	@$(NODE) scripts/audit.js
	@echo "OK: Zero-dependency invariant verified."

clean:
	@rm -rf coverage *.log .env.tmp*
