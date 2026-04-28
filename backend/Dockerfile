FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    libpq-dev gcc gettext curl \
    gdal-bin libgdal-dev \
    libgeos-dev \
    binutils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /spark_backend

COPY pyproject.toml uv.lock data.json ./
RUN uv sync --frozen

COPY . .

EXPOSE 8000

CMD sh -c "\
uv run manage.py migrate && \
uv run manage.py loaddata data.json && \
uv run manage.py collectstatic --noinput && \
uv run gunicorn spark.asgi:application -k uvicorn.workers.UvicornWorker --workers 15 --bind 0.0.0.0:8000"