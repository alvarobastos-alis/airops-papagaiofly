# ==========================================
# AirOps AI — Image Brand Agent
# Visual asset generation with brand identity
# ==========================================

import os
import base64
from typing import Optional

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

from config.config_loader import (
    get_agent_config,
    get_agent_model_config,
    load_agent_prompt,
    load_image_config,
)

AGENT_NAME = "image_brand_agent"


async def generate_brand_image(
    user_prompt: str,
    preset: str = "hero_banner",
    custom_size: Optional[str] = None,
) -> dict:
    """
    Generate a brand-consistent image.
    
    Args:
        user_prompt: What the user wants to generate
        preset: Size preset (icon, hero_banner, social_post, thumbnail)
        custom_size: Override preset size
    """
    if OpenAI is None:
        return {"error": "OpenAI not available"}

    try:
        model_config = get_agent_model_config(AGENT_NAME)
        style_prompt = load_agent_prompt(AGENT_NAME)
        image_config = load_image_config()
    except (ValueError, FileNotFoundError):
        model_config = {"model": "gpt-image-1"}
        style_prompt = ""
        image_config = {"defaults": {"size": "1024x1024", "quality": "high"}}

    # Resolve size from preset
    defaults = image_config.get("defaults", {})
    presets = image_config.get("presets", {})
    preset_config = presets.get(preset, {})

    size = custom_size or preset_config.get("size", defaults.get("size", "1024x1024"))
    quality = preset_config.get("quality", defaults.get("quality", "high"))

    # Build full prompt with brand guidelines
    full_prompt = f"{style_prompt}\n\n## User Request\n{user_prompt}"

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    try:
        response = client.images.generate(
            model=model_config.get("model", "gpt-image-1"),
            prompt=full_prompt,
            size=size,
            quality=quality,
            n=1,
        )
        image_url = response.data[0].url if response.data[0].url else None
        image_b64 = response.data[0].b64_json if hasattr(response.data[0], 'b64_json') else None

        return {
            "image_url": image_url,
            "image_b64": image_b64,
            "size": size,
            "quality": quality,
            "preset": preset,
            "model": model_config.get("model"),
        }
    except Exception as e:
        return {"error": str(e)}
