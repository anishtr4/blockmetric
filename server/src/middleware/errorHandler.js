const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid Data',
      details: err.message
    });
  }

  // Handle specific event tracking errors
  if (err.code === 'EVENT_TRACKING_ERROR') {
    return res.status(422).json({
      error: 'Event Tracking Error',
      details: err.message
    });
  }

  // Default server error
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

module.exports = errorHandler;