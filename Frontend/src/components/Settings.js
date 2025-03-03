import React from 'react';
import ApiKeyManager from './ApiKeyManager';

const Settings = () => {
  return (
    <div className="settings-container">
      <h1>Settings</h1>
      <div className="settings-section">
        <ApiKeyManager />
      </div>
    </div>
  );
};

export default Settings;