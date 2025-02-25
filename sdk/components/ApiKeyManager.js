import React, { useState, useEffect } from 'react';

const ApiKeyManager = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [name, setName] = useState('');
  const [allowedOrigins, setAllowedOrigins] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/keys');
      const data = await response.json();
      setApiKeys(data);
    } catch (error) {
      setError('Failed to fetch API keys');
    }
  };

  const createApiKey = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5002/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          allowedOrigins: allowedOrigins.split(',').map(origin => origin.trim()).filter(Boolean)
        })
      });
      const data = await response.json();
      setApiKeys([...apiKeys, { key: data.apiKey, name, allowedOrigins }]);
      setName('');
      setAllowedOrigins('');
    } catch (error) {
      setError('Failed to create API key');
    }
  };

  const deleteApiKey = async (key) => {
    try {
      await fetch(`http://localhost:5002/api/keys/${key}`, {
        method: 'DELETE'
      });
      setApiKeys(apiKeys.filter(k => k.key !== key));
    } catch (error) {
      setError('Failed to delete API key');
    }
  };

  return (
    <div className="api-key-manager">
      <h2>API Key Management</h2>
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={createApiKey} className="api-key-form">
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="API Key Name"
            required
          />
        </div>
        <div className="form-group">
          <label>Allowed Origins:</label>
          <input
            type="text"
            value={allowedOrigins}
            onChange={(e) => setAllowedOrigins(e.target.value)}
            placeholder="Comma-separated list of allowed origins"
          />
        </div>
        <button type="submit">Create API Key</button>
      </form>

      <div className="api-keys-list">
        <h3>Existing API Keys</h3>
        {apiKeys.map((key) => (
          <div key={key.key} className="api-key-item">
            <div className="api-key-info">
              <strong>{key.name}</strong>
              <code>{key.key}</code>
              <small>Created: {new Date(key.createdAt).toLocaleDateString()}</small>
              {key.allowedOrigins && key.allowedOrigins.length > 0 && (
                <div className="origins">
                  Allowed Origins: {key.allowedOrigins.join(', ')}
                </div>
              )}
            </div>
            <button
              onClick={() => deleteApiKey(key.key)}
              className="delete-button"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .api-key-manager {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        .error {
          color: red;
          margin-bottom: 15px;
        }
        .api-key-form {
          margin-bottom: 30px;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 5px;
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
        }
        .form-group input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background: #0056b3;
        }
        .api-key-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border: 1px solid #ddd;
          margin-bottom: 10px;
          border-radius: 4px;
        }
        .api-key-info {
          flex-grow: 1;
        }
        .api-key-info code {
          display: block;
          margin: 5px 0;
          padding: 5px;
          background: #f8f9fa;
          border-radius: 3px;
        }
        .delete-button {
          background: #dc3545;
        }
        .delete-button:hover {
          background: #c82333;
        }
        .origins {
          font-size: 0.9em;
          color: #666;
          margin-top: 5px;
        }
      `}</style>
    </div>
  );
};

export default ApiKeyManager;