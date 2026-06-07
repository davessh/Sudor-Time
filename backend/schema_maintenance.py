from sqlalchemy import inspect, text


REGISTRATION_COLUMNS = {
    "status": "VARCHAR(32) DEFAULT 'confirmed' NOT NULL",
    "payment_status": "VARCHAR(32) DEFAULT 'untracked' NOT NULL",
    "amount": "NUMERIC(10, 2)",
    "currency": "VARCHAR(3) DEFAULT 'MXN' NOT NULL",
    "payment_provider": "VARCHAR(50)",
    "payment_reference": "VARCHAR(255)",
    "payment_preference_id": "VARCHAR(255)",
    "payment_id": "VARCHAR(255)",
    "payment_checkout_url": "VARCHAR(1024)",
    "payment_status_detail": "VARCHAR(100)",
    "payment_expires_at": "TIMESTAMP",
    "paid_at": "TIMESTAMP",
    "confirmed_at": "TIMESTAMP",
    "cancelled_at": "TIMESTAMP",
    "public_token": "VARCHAR(128)",
    "confirmation_email_sent_at": "TIMESTAMP",
    "expires_at": "TIMESTAMP",
    "expired_at": "TIMESTAMP",
    "created_at": "TIMESTAMP",
    "updated_at": "TIMESTAMP",
}

EVENT_COLUMNS = {
    "imagen_portada": "TEXT",
    "imagen_playera": "TEXT",
    "imagen_medalla": "TEXT",
}

EVENT_MODALITY_COLUMNS = {
    "incluye_playera": "BOOLEAN DEFAULT FALSE NOT NULL",
}

REGISTRATION_PRODUCT_COLUMNS = {
    "incluye_playera": "BOOLEAN DEFAULT FALSE NOT NULL",
}

SITE_SETTINGS_COLUMNS = {
    "hero_background_image": "TEXT",
    "hero_color_start": "VARCHAR(20) DEFAULT '#15070A' NOT NULL",
    "hero_color_mid": "VARCHAR(20) DEFAULT '#6A1A24' NOT NULL",
    "hero_color_end": "VARCHAR(20) DEFAULT '#090D18' NOT NULL",
    "hero_background_fit": "VARCHAR(20) DEFAULT 'cover' NOT NULL",
    "hero_background_position_x": "INTEGER DEFAULT 50 NOT NULL",
    "hero_background_position_y": "INTEGER DEFAULT 46 NOT NULL",
    "hero_background_opacity": "INTEGER DEFAULT 46 NOT NULL",
}


def ensure_registration_payment_columns(engine):
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    if "registrations" not in table_names:
        return

    existing_columns = {
        column["name"]
        for column in inspector.get_columns("registrations")
    }

    missing_columns = [
        (name, definition)
        for name, definition in REGISTRATION_COLUMNS.items()
        if name not in existing_columns
    ]

    if not missing_columns:
        return

    with engine.begin() as connection:
        for name, definition in missing_columns:
            connection.execute(text(f"ALTER TABLE registrations ADD COLUMN {name} {definition}"))


def ensure_event_merch_columns(engine):
    table_columns = {
        "events": EVENT_COLUMNS,
        "event_modalities": EVENT_MODALITY_COLUMNS,
        "registration_products": REGISTRATION_PRODUCT_COLUMNS,
    }

    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    with engine.begin() as connection:
        for table_name, columns in table_columns.items():
            if table_name not in table_names:
                continue

            existing_columns = {
                column["name"]
                for column in inspector.get_columns(table_name)
            }

            for name, definition in columns.items():
                if name not in existing_columns:
                    connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {name} {definition}"))


def ensure_site_settings_columns(engine):
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    if "site_settings" not in table_names:
        return

    existing_columns = {
        column["name"]
        for column in inspector.get_columns("site_settings")
    }

    with engine.begin() as connection:
        for name, definition in SITE_SETTINGS_COLUMNS.items():
            if name not in existing_columns:
                connection.execute(text(f"ALTER TABLE site_settings ADD COLUMN {name} {definition}"))
