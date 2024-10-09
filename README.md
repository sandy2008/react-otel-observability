# React OpenTelemetry Instrumented Application

This repository contains a React application instrumented with OpenTelemetry to send **logs**, **traces**, and **metrics** to an OpenTelemetry Collector. The collector is configured to export data to **Cortex** (metrics), **Loki** (logs), and **Tempo** (traces).

## Introduction

This project demonstrates how to instrument a React application using OpenTelemetry and send observability data to popular backends like **Cortex** (metrics), **Loki** (logs), and **Tempo** (traces). The OpenTelemetry Collector acts as an intermediary, receiving data from the application and exporting it to the respective backends.

## Prerequisites

- **Node.js** and **npm** installed on your machine.
- **Docker** and **Docker Compose** installed.
- Basic knowledge of **React**, **OpenTelemetry**, and **Docker**.

## Architecture Overview

```
+----------------+           +---------------------+
|                |           |                     |
|  React App     |  ----->   |  OpenTelemetry      |
|  (Instrumented)|           |  Collector          |
|                |           |                     |
+----------------+           +----------+----------+
                                         |
                                         |
                          +--------------+--------------+
                          |              |              |
                          v              v              v
                   +------------+  +------------+  +------------+
                   |  Cortex    |  |   Loki     |  |   Tempo    |
                   |  (Metrics) |  |   (Logs)   |  |  (Traces)  |
                   +------------+  +------------+  +------------+
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Set Up the Backend Services

1. **Create a `docker-compose.yaml` File**

   ```yaml
   version: '3'
   services:
     cortex:
       image: quay.io/cortexproject/cortex:latest
       ports:
         - "9009:9009"  # HTTP
       command: -config.file=/etc/cortex/cortex.yaml
       volumes:
         - ./cortex-config.yaml:/etc/cortex/cortex.yaml

     loki:
       image: grafana/loki:latest
       ports:
         - "3100:3100"

     tempo:
       image: grafana/tempo:latest
       ports:
         - "3200:3200"

     grafana:
       image: grafana/grafana:latest
       ports:
         - "3000:3000"
       depends_on:
         - cortex
         - loki
         - tempo
   ```

2. **Create Configuration Files for Each Service**

   - **Cortex Configuration (`cortex-config.yaml`)**
   - **Loki Configuration**
   - **Tempo Configuration**

   For brevity, the detailed configurations are not included here. Refer to the official documentation for sample configurations.

3. **Start the Services**

   ```bash
   docker-compose up -d
   ```

### 3. Configure the OpenTelemetry Collector

Create a configuration file named `otel-collector-config.yaml`:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
      http:

exporters:
  logging:
    loglevel: debug
  otlp/cortex:
    endpoint: 'http://localhost:9009/v1/metrics'
    headers:
      X-Scope-OrgID: '1'
  otlp/loki:
    endpoint: 'http://localhost:3100/loki/api/v1/push'
  otlp/tempo:
    endpoint: 'http://localhost:3200/'

processors:
  batch: {}

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp/tempo, logging]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp/cortex, logging]
    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp/loki, logging]
```

**Note:** Replace `localhost` with the appropriate service hostnames if necessary (e.g., `cortex`, `loki`, `tempo`).

### 4. Run the OpenTelemetry Collector and Backend Services

Create a `docker-compose.yaml` for the OpenTelemetry Collector:

```yaml
version: '3'
services:
  otelcol:
    image: otel/opentelemetry-collector:latest
    command: ["--config=/etc/otel-collector-config.yaml"]
    volumes:
      - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
    ports:
      - "4317:4317"   # OTLP gRPC receiver
      - "4318:4318"   # OTLP HTTP receiver
    depends_on:
      - cortex
      - loki
      - tempo

  # Include the backend services if not already running
  cortex:
    image: quay.io/cortexproject/cortex:latest
    ports:
      - "9009:9009"
    command: -config.file=/etc/cortex/cortex.yaml
    volumes:
      - ./cortex-config.yaml:/etc/cortex/cortex.yaml

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"

  tempo:
    image: grafana/tempo:latest
    ports:
      - "3200:3200"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    depends_on:
      - cortex
      - loki
      - tempo
```

**Start the OpenTelemetry Collector and Services:**

```bash
docker-compose up -d
```

### 5. Run the React Application

1. **Install Dependencies**

   If not already done, install the npm dependencies:

   ```bash
   npm install
   ```

2. **Start the React Application**

   ```bash
   npm start
   ```

   The application will start on `http://localhost:3000`.

## Accessing the Observability Data

### Viewing Metrics in Grafana via Cortex

1. **Access Grafana**

   Open your browser and navigate to `http://localhost:3000`.

2. **Login to Grafana**

   - **Username:** `admin`
   - **Password:** `admin` (you may be prompted to change this password)

3. **Configure Data Source**

   - Navigate to **Configuration** > **Data Sources**.
   - Click **Add data source**.
   - Select **Prometheus** (since Cortex is compatible with Prometheus).
   - Configure the data source:
     - **Name:** `Cortex`
     - **URL:** `http://cortex:9009/prometheus`
     - **Access:** `Server (default)`
   - Click **Save & Test**.

4. **Visualize Metrics**

   - Create a new dashboard.
   - Add a panel with a Prometheus query like `app_loads` or `button_clicks`.
   - You should see the metrics generated by your React application.

### Viewing Logs in Grafana via Loki

1. **Configure Loki Data Source**

   - Go to **Configuration** > **Data Sources**.
   - Click **Add data source**.
   - Select **Loki**.
   - Configure the data source:
     - **Name:** `Loki`
     - **URL:** `http://loki:3100`
   - Click **Save & Test**.

2. **Explore Logs**

   - Navigate to **Explore**.
   - Select the **Loki** data source.
   - Run a query like `{job="otelcol"}` to see logs from the OpenTelemetry Collector.
   - You should see the logs emitted by your React application.

### Viewing Traces in Grafana via Tempo

1. **Configure Tempo Data Source**

   - Go to **Configuration** > **Data Sources**.
   - Click **Add data source**.
   - Select **Tempo**.
   - Configure the data source:
     - **Name:** `Tempo`
     - **URL:** `http://tempo:3200`
   - Click **Save & Test**.

2. **Explore Traces**

   - Navigate to **Explore**.
   - Select the **Tempo** data source.
   - You can search for traces by trace ID or use the built-in trace viewer.

3. **Linking Traces with Logs and Metrics**

   - Grafana allows you to correlate traces with logs and metrics.
   - Ensure your instrumentation includes the necessary trace context propagation.

## Troubleshooting

- **Ports Already in Use**

  If any of the ports (e.g., `3000`, `4317`, `4318`, `9009`, `3100`, `3200`) are already in use, modify the `docker-compose.yaml` files to use different ports.

- **Services Not Starting**

  Check the Docker logs for each service:

  ```bash
  docker-compose logs <service-name>
  ```
