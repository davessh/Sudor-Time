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
    "expires_at": "TIMESTAMP",
    "expired_at": "TIMESTAMP",
    "created_at": "TIMESTAMP",
    "updated_at": "TIMESTAMP",
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
