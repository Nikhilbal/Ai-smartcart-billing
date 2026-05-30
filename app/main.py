"""Compatibility entrypoint for deploying the AI service from the repo root.

Preferred Render setup uses Root Directory `ai-service`. This shim also allows
`uvicorn app.main:app` to work when the service is accidentally configured from
the repository root.
"""

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

module_path = Path(__file__).resolve().parents[1] / "ai-service" / "app" / "main.py"
spec = spec_from_file_location("smart_cart_ai_service", module_path)
if spec is None or spec.loader is None:
    raise RuntimeError("Could not load Smart Cart AI service entrypoint")

module = module_from_spec(spec)
spec.loader.exec_module(module)

app = module.app
