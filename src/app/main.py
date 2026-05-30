"""Compatibility entrypoint for Render services configured with Root Directory `src`.

The real AI service lives in `ai-service/app/main.py`.
"""

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

repo_root = Path(__file__).resolve().parents[2]
module_path = repo_root / "ai-service" / "app" / "main.py"
spec = spec_from_file_location("smart_cart_ai_service", module_path)
if spec is None or spec.loader is None:
    raise RuntimeError("Could not load Smart Cart AI service entrypoint")

module = module_from_spec(spec)
spec.loader.exec_module(module)

app = module.app
