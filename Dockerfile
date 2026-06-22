FROM node:20-bookworm-slim

RUN apt-get update \
    && apt-get install --yes --no-install-recommends \
        build-essential \
        curl \
        libpq-dev \
        python3 \
        python3-pip \
        python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm install

COPY requirements.txt ./requirements.txt
COPY services/orchestrator/requirements.txt ./services/orchestrator/requirements.txt
RUN python3 -m pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["bash"]
