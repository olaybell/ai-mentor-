from flask import current_app, g
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker


def _database_url() -> str:
    configured = current_app.config["DATABASE_PATH"]
    if configured.startswith("sqlite://"):
        return configured
    return f"sqlite:///{configured}"


def get_engine():
    if "db_engine" not in g:
        g.db_engine = create_engine(
            _database_url(),
            future=True,
            connect_args={"check_same_thread": False},
        )
    return g.db_engine


def get_session() -> Session:
    if "db_session" not in g:
        session_factory = sessionmaker(bind=get_engine(), autoflush=False, autocommit=False, future=True)
        g.db_session = session_factory()
    return g.db_session


def close_db(error=None) -> None:
    session = g.pop("db_session", None)
    if session is not None:
        session.close()

    engine = g.pop("db_engine", None)
    if engine is not None:
        engine.dispose()
