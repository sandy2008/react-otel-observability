// src/App.js
import React, { useEffect } from 'react';
import { tracer, meter, logger } from './otel';
import { SeverityNumber } from '@opentelemetry/api-logs';

function App() {
  useEffect(() => {
    // Start a span for the component load
    const span = tracer.startSpan('App Load');
    span.addEvent('App component mounted');

    // Emit a log when the component mounts
    logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: 'INFO',
      body: 'App component has been mounted.',
      attributes: {
        'component': 'App',
        'lifecycle': 'mounted',
      },
    });

    // Simulate some work
    setTimeout(() => {
      span.addEvent('App initialization complete');
      span.end();

      // Emit another log
      logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: 'INFO',
        body: 'App initialization complete.',
        attributes: {
          'component': 'App',
          'lifecycle': 'initialized',
        },
      });
    }, 1000);

    // Create a counter metric
    const counter = meter.createCounter('app_loads', {
      description: 'Counts number of times the app loads',
    });

    // Increment the counter
    counter.add(1, { app: 'my-react-app' });
  }, []);

  const handleClick = () => {
    // Start a span for the button click
    const span = tracer.startSpan('Button Click');
    span.addEvent('User clicked the button');

    // Emit a log when the button is clicked
    logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: 'INFO',
      body: 'Button was clicked.',
      attributes: {
        'component': 'App',
        'event': 'button_click',
      },
    });

    // Simulate some work
    setTimeout(() => {
      span.end();
    }, 500);

    // Create a counter metric for button clicks
    const counter = meter.createCounter('button_clicks', {
      description: 'Counts number of button clicks',
    });

    // Increment the counter
    counter.add(1, { button: 'click_me' });
  };

  return (
    <div>
      <h1>Hello, OpenTelemetry!</h1>
      <button onClick={handleClick}>Click Me</button>
    </div>
  );
}

export default App;
