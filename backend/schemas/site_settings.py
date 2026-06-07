from typing import Optional

from pydantic import BaseModel, ConfigDict


class SiteSettingsUpdate(BaseModel):
    hero_background_image: Optional[str] = None
    hero_color_start: Optional[str] = None
    hero_color_mid: Optional[str] = None
    hero_color_end: Optional[str] = None
    hero_background_fit: Optional[str] = None
    hero_background_position_x: Optional[int] = None
    hero_background_position_y: Optional[int] = None
    hero_background_opacity: Optional[int] = None
    navbar_blur: Optional[int] = None
    navbar_opacity: Optional[int] = None


class SiteSettingsResponse(BaseModel):
    id: int = 1
    hero_background_image: Optional[str] = None
    hero_color_start: str = "#15070A"
    hero_color_mid: str = "#6A1A24"
    hero_color_end: str = "#090D18"
    hero_background_fit: str = "cover"
    hero_background_position_x: int = 50
    hero_background_position_y: int = 46
    hero_background_opacity: int = 46
    navbar_blur: int = 12
    navbar_opacity: int = 35

    model_config = ConfigDict(from_attributes=True)
