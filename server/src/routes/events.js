const express = require('express');
const router = express.Router();

// Validate event data
const validateEventData = (data) => {
  if (!data.eventName) throw new Error('Event name is required');
  if (!data.sessionId) throw new Error('Session ID is required');
  if (!data.timestamp) throw new Error('Timestamp is required');

  // Validate specific event types
  switch (data.eventName) {
    case 'resource_timing':
      if (!data.resourceType) throw new Error('Resource type is required for resource_timing events');
      if (!data.resourceUrl) throw new Error('Resource URL is required for resource_timing events');
      if (typeof data.duration !== 'number') throw new Error('Duration must be a number for resource_timing events');
      break;
    case 'performance_metric':
      if (!data.metricName) throw new Error('Metric name is required for performance_metric events');
      if (typeof data.value !== 'number') throw new Error('Metric value must be a number');
      break;
    case 'navigation_timing':
      if (typeof data.dnsTime !== 'number') throw new Error('DNS time must be a number');
      if (typeof data.tcpTime !== 'number') throw new Error('TCP time must be a number');
      if (typeof data.ttfb !== 'number') throw new Error('TTFB must be a number');
      break;
  }

  return true;
};

// Handle event tracking
router.post('/api/events', async (req, res) => {
  try {
    const eventData = req.body;
    
    // Validate the event data
    validateEventData(eventData);
    
    // Log the validated event with type-specific information
    console.log(`Received valid ${eventData.eventName} event:`, eventData);

    // Here you would typically save the event data to your database
    // For demonstration, we'll just return success with event-specific details
    res.status(200).json({
      success: true,
      message: 'Event tracked successfully',
      eventId: Date.now() // Temporary ID for demonstration
    });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track event',
      error: error.message
    });
  }
});

module.exports = router;