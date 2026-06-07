from sqlalchemy import Column, Integer, String, Text

from database import Base


class SiteSettings(Base):
    __tablename__ = "site_settings"

    id = Column(Integer, primary_key=True, default=1)
    hero_background_image = Column(Text, nullable=True)
    hero_color_start = Column(String(20), nullable=False, default="#15070A")
    hero_color_mid = Column(String(20), nullable=False, default="#6A1A24")
    hero_color_end = Column(String(20), nullable=False, default="#090D18")
    hero_background_fit = Column(String(20), nullable=False, default="cover")
    hero_background_position_x = Column(Integer, nullable=False, default=50)
    hero_background_position_y = Column(Integer, nullable=False, default=46)
    hero_background_opacity = Column(Integer, nullable=False, default=46)
    navbar_blur = Column(Integer, nullable=False, default=12)
    navbar_opacity = Column(Integer, nullable=False, default=35)
