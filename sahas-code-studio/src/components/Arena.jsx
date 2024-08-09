import React, { useState } from 'react';
import { Editor } from '@monaco-editor/react';
import './Arena.css';

const Arena = () => {
  const [code, setCode] = useState('// Start coding...');
  const [theme, setTheme] = useState('light'); // Options: 'light' or 'dark'
  const [language, setLanguage] = useState('javascript'); // Default language
  const [output, setOutput] = useState(''); // For displaying the output
  const [error, setError] = useState(null); // For capturing errors

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const runTestCase = () => {
    try {
      setError(null); // Clear any previous errors

      // Simulate running the code (this could be replaced with real execution)
      let simulatedOutput = `Output:\n${code}`;

      // If executing JavaScript, run it inside a try-catch to handle errors
      if (language === 'javascript') {
        try {
          /* eslint no-eval: 0 */
          const result = eval(code); // WARNING: eval is dangerous and should only be used for demonstration
          simulatedOutput = `Output:\n${result}`;
        } catch (err) {
          simulatedOutput = `Error: ${err.message}`;
        }
      }

      setOutput(simulatedOutput);
    } catch (err) {
      setError(`Error running code: ${err.message}`);
    }
  };

  return (
    <div className={`arena-container ${theme}`}>
      <div className="toolbar">
        <select onChange={(e) => setLanguage(e.target.value)} value={language}>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="csharp">C#</option>
          <option value="java">Java</option>
          {/* Add more languages as needed */}
        </select>
        <button onClick={runTestCase}>Run Code</button>
        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      <Editor
        height="50vh"
        language={language}
        theme={theme === 'light' ? 'light' : 'vs-dark'}  // Monaco Editor's themes: 'light' or 'vs-dark'
        value={code}
        onChange={handleEditorChange}
      />
      <div className="output-box">
        <pre>{output}</pre>
      </div>
    </div>
  );
};

export default Arena;
