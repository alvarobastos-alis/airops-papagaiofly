# ==========================================
# AirOps AI — YAML Configuration Loader
# Loads all YAML configs at startup, validates with Pydantic
# ==========================================

from pathlib import Path
from typing import Any
import yaml
from functools import lru_cache

CONFIG_DIR = Path(__file__).parent


def _load_yaml(filename: str) -> dict:
    """Load a YAML file from the config directory."""
    filepath = CONFIG_DIR / filename
    if not filepath.exists():
        raise FileNotFoundError(f"Config file not found: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


@lru_cache(maxsize=1)
def load_models_config() -> dict:
    """Load model definitions from models.yaml."""
    data = _load_yaml("models.yaml")
    return data.get("models", {})


@lru_cache(maxsize=1)
def load_agents_config() -> dict:
    """Load agent definitions from agents.yaml."""
    data = _load_yaml("agents.yaml")
    return data.get("agents", {})


@lru_cache(maxsize=1)
def load_guardrails_config() -> dict:
    """Load guardrail rules from guardrails.yaml."""
    data = _load_yaml("guardrails.yaml")
    return data.get("guardrails", {})


@lru_cache(maxsize=1)
def load_voice_config() -> dict:
    """Load voice pipeline config from voice.yaml."""
    data = _load_yaml("voice.yaml")
    return data.get("voice", {})


@lru_cache(maxsize=1)
def load_image_config() -> dict:
    """Load image generation config from image.yaml."""
    data = _load_yaml("image.yaml")
    return data.get("image", {})


def get_model_config(model_ref: str) -> dict:
    """Get a specific model config by its reference name."""
    models = load_models_config()
    if model_ref not in models:
        raise ValueError(f"Model ref '{model_ref}' not found in models.yaml. Available: {list(models.keys())}")
    return models[model_ref]


def get_agent_config(agent_name: str) -> dict:
    """Get a specific agent config by its name."""
    agents = load_agents_config()
    if agent_name not in agents:
        raise ValueError(f"Agent '{agent_name}' not found in agents.yaml. Available: {list(agents.keys())}")
    return agents[agent_name]


def get_agent_model_config(agent_name: str) -> dict:
    """Get the resolved model config for a specific agent."""
    agent = get_agent_config(agent_name)
    model_ref = agent.get("model_ref")
    if not model_ref:
        raise ValueError(f"Agent '{agent_name}' has no model_ref defined.")
    return get_model_config(model_ref)


def get_guardrail_config(guardrail_name: str) -> dict:
    """Get a specific guardrail config by its name."""
    guardrails = load_guardrails_config()
    if guardrail_name not in guardrails:
        raise ValueError(f"Guardrail '{guardrail_name}' not found in guardrails.yaml. Available: {list(guardrails.keys())}")
    return guardrails[guardrail_name]


def get_agent_guardrails(agent_name: str) -> list[dict]:
    """Get all resolved guardrail configs for a specific agent."""
    agent = get_agent_config(agent_name)
    guardrail_names = agent.get("guardrails", [])
    return [
        {"name": name, **get_guardrail_config(name)}
        for name in guardrail_names
    ]


def get_agent_prompt_path(agent_name: str) -> Path:
    """Get the absolute path to an agent's prompt file."""
    agent = get_agent_config(agent_name)
    prompt_rel = agent.get("prompt", "")
    if not prompt_rel:
        raise ValueError(f"Agent '{agent_name}' has no prompt defined.")
    # Prompts are relative to project root (server_python/../prompts)
    project_root = CONFIG_DIR.parent.parent
    prompt_path = project_root / prompt_rel
    if not prompt_path.exists():
        raise FileNotFoundError(f"Prompt file not found: {prompt_path}")
    return prompt_path


def load_agent_prompt(agent_name: str) -> str:
    """Load and return the prompt text for a specific agent."""
    prompt_path = get_agent_prompt_path(agent_name)
    return prompt_path.read_text(encoding="utf-8")


def reload_all():
    """Clear all caches and force reload of all configs."""
    load_models_config.cache_clear()
    load_agents_config.cache_clear()
    load_guardrails_config.cache_clear()
    load_voice_config.cache_clear()
    load_image_config.cache_clear()


def validate_all() -> dict[str, bool]:
    """Validate all config files can be loaded without errors."""
    results = {}
    loaders = {
        "models": load_models_config,
        "agents": load_agents_config,
        "guardrails": load_guardrails_config,
        "voice": load_voice_config,
        "image": load_image_config,
    }
    for name, loader in loaders.items():
        try:
            loader()
            results[name] = True
        except Exception as e:
            results[name] = False
            print(f"[CONFIG] ❌ {name}.yaml validation failed: {e}")
    return results
