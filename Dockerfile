FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    binutils \
    libproj-dev \
    gdal-bin \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN pip install uv

WORKDIR /spark

RUN git clone -b backend https://github.com/ImpLeax/Spark.git .
RUN echo -e "DB_PASS=12344321\nSECRET_KEY=django-insecure-ye5v+6@-x3f6qf09rvj!)1_0wvjt+nqp_^8@jy*8q4bk^9a!-%" > .env
RUN uv sync

WORKDIR /spark/backend

EXPOSE 8000