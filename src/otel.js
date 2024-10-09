// src/otel.js
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { XMLHttpRequestInstrumentation } from "@opentelemetry/instrumentation-xml-http-request";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";

// Resource attributes
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: "my-react-app",
});

// Tracer provider
const tracerProvider = new WebTracerProvider({ resource });

// Console exporter (for debugging)
const consoleExporter = new ConsoleSpanExporter();
tracerProvider.addSpanProcessor(new SimpleSpanProcessor(consoleExporter));

// OTLP Trace exporter
const traceExporter = new OTLPTraceExporter({
  url: "http://localhost:4318/v1/traces", // OTLP HTTP endpoint
});

// Add OTLP exporter to the tracer provider
tracerProvider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));

// Register the tracer
tracerProvider.register({
  contextManager: new ZoneContextManager(),
});

// Meter provider
const metricExporter = new OTLPMetricExporter({
  url: "http://localhost:4318/v1/metrics", // OTLP HTTP endpoint
});

const meterProvider = new MeterProvider({
  resource,
});

meterProvider.addMetricReader(
  new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 1000, // Export metrics every second
  })
);

// Register automatic instrumentations
registerInstrumentations({
  instrumentations: [
    new FetchInstrumentation({
      traceFetch: true,
      propagateTraceHeaderCorsUrls: /.*/,
    }),
    new XMLHttpRequestInstrumentation({
      traceXHR: true,
      propagateTraceHeaderCorsUrls: /.*/,
    }),
  ],
  tracerProvider,
  meterProvider,
});

const collectorOptions = {
  url: 'http://localhost:4318/v1/logs', // url is optional and can be omitted - default is http://localhost:4318/v1/logs
  concurrencyLimit: 1, // an optional limit on pending requests
};
const logExporter = new OTLPLogExporter(collectorOptions);
const loggerProvider = new LoggerProvider();

loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));

// Export tracer and meter for use in the app
export const tracer = tracerProvider.getTracer("default");
export const meter = meterProvider.getMeter("default");
export const logger = loggerProvider.getLogger('default');