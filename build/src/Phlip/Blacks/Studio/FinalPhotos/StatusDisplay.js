import React from 'react';

export const StatusDisplay = ({ status, error }) => {
  return (
    <>
      {status && <p className="status">{status}</p>}
      {error && <p className="error">{error}</p>}
    </>
  );
};