import os
import statistics
import time

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.ai.adapter import StubTryOnModel, TryOnSettings
from app.ai.pipeline import TryOnPipelineInput, TryOnPipelineService
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.services.catalog_service import CatalogService
from app.services.storage_service import LocalStorageBackend

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures", "test_data")


@pytest_asyncio.fixture
async def perf_env():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")

    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as db:
        await CatalogService.seed_sample_catalog(db)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
    await engine.dispose()


@pytest.mark.asyncio
async def test_api_latency_thresholds(perf_env):
    client = perf_env
    health_latencies = []
    catalog_latencies = []

    for _ in range(10):
        t0 = time.perf_counter()
        res_h = await client.get("/health")
        assert res_h.status_code == 200
        health_latencies.append((time.perf_counter() - t0) * 1000.0)

        t1 = time.perf_counter()
        res_c = await client.get("/api/v1/products?limit=12")
        assert res_c.status_code == 200
        catalog_latencies.append((time.perf_counter() - t1) * 1000.0)

    health_p50 = statistics.median(health_latencies)
    catalog_p50 = statistics.median(catalog_latencies)
    print(f"\n[PERF] /health p50={health_p50:.2f}ms | /api/v1/products p50={catalog_p50:.2f}ms")

    assert health_p50 < 150.0
    assert catalog_p50 < 250.0


@pytest.mark.asyncio
async def test_pipeline_latency_measurement(tmp_path):
    storage = LocalStorageBackend(root_dir=str(tmp_path))
    with open(os.path.join(FIXTURES_DIR, "person_01.png"), "rb") as f:
        p_key = storage.put_object("user-uploads/perf/person.png", f.read(), "image/png")
    with open(os.path.join(FIXTURES_DIR, "garment_01.png"), "rb") as f:
        g_key = storage.put_object("catalog/perf/garment.png", f.read(), "image/png")

    pipeline = TryOnPipelineService(model=StubTryOnModel(), storage=storage)
    runs = []
    for i in range(3):
        out = await pipeline.run(
            TryOnPipelineInput(
                person_image_key=p_key,
                garment_image_key=g_key,
                output_image_key=f"tryon-results/perf/res_{i}.png",
                category="upper_body",
                settings=TryOnSettings(width=768, height=1024),
            )
        )
        assert out.success is True
        runs.append(out.total_ms)

    avg_ms = sum(runs) / len(runs)
    print(f"\n[PERF] TryOnPipeline (Stub 768x1024) avg={avg_ms:.2f}ms runs={[round(r, 1) for r in runs]}")
    assert avg_ms < 5000.0

