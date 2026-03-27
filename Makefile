.PHONY: dev engine frontend test build contracts-test install clean

# Run both engine and frontend in parallel
dev:
	@echo "Starting Agent Arena dev servers..."
	@trap 'kill 0' SIGINT; \
	(cd engine && uvicorn server:app --reload --port 8000) & \
	(cd frontend && npm run dev) & \
	wait

# Run only the Python engine
engine:
	cd engine && uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Run only the Next.js frontend
frontend:
	cd frontend && npm run dev

# Run all tests
test:
	@echo "Running Python tests..."
	cd engine && python -m pytest tests/ -v
	@echo "\nRunning TypeScript build check..."
	cd frontend && npm run build --if-present

# Production builds
build:
	@echo "Building frontend..."
	cd frontend && npm run build
	@echo "Building engine Docker image..."
	docker build -t agent-arena-engine ./engine

# Move/Aptos contract tests
contracts-test:
	cd contracts && aptos move test

# Install all dependencies
install:
	cd frontend && npm install
	pip install -r engine/requirements.txt

# Clean build artifacts
clean:
	rm -rf frontend/.next frontend/out
	rm -rf engine/__pycache__ engine/.pytest_cache
	find . -name "*.pyc" -delete
