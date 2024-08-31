import React, { useState } from 'react';
import { executeCode } from '../api'; // Assuming you have a function to call your backend API for code execution

const Output = ({ editorRef }) => {
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runCode = async () => {
    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) return;

    setLoading(true);
    setError(null);

    try {
      const { run: result } = await executeCode('javascript', sourceCode);
      setOutput(result.output.split('\n'));
    } catch (err) {
      setError('Failed to execute code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="output-container">
      <h2>Output</h2>
      <button
        className="run-code-button"
        onClick={runCode}
        disabled={loading}
      >
        {loading ? 'Running...' : 'Run Code'}
      </button>
      <div className="output-box">
        {loading ? (
          <div className="spinner"></div>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : (
          <pre>{output ? output.join('\n') : 'Click "Run Code" to see the output here'}</pre>
        )}
      </div>
    </div>
  );
};

export default Output;
