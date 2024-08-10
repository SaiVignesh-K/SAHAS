import React, { useState } from 'react';
import { Editor } from '@monaco-editor/react';
import './Arena.css';

const Arena = () => {
  const [code_to_run, setCode] = useState('// Start coding...');
  const [theme, setTheme] = useState('light'); // Options: 'light' or 'dark'
  const [language, setLanguage] = useState('javascript'); // Default language
  const [output, setOutput] = useState(''); // For displaying the output
  const [customInput, setCustomInput] = useState(''); // For custom input

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const runTestCase = async () => {
    try {
      // Prepare request data
      const requestData = {
        code: code_to_run,
        inputs: customInput.trim().split('\n') // Split custom input by newline for multiple inputs
      };
      console.log(requestData);
      const tp = JSON.stringify(requestData);
      console.log(tp);

      // Send API request
      const response = await fetch('http://localhost:3333/run-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });


      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      // Format the output
      const formattedOutput = `Output:\n${data.output}\nRuntime: ${data.runtime}s\nMemory Usage: ${data.memoryUsage} bytes`;

      // Update the state with the response data
      setOutput(formattedOutput);

    } catch (err) {
      setOutput(`Error running code: ${err.message}`);
    }
  };

  return (
    <div className={`arena-container ${theme}`}>
      <div className="toolbar">
        <select onChange={(e) => setLanguage(e.target.value)} value={language}>
          <option value="javascript">JavaScript</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
          {/* Add more languages as needed */}
        </select>
        <p>SAHAS_CODE_PLAYGROUND</p>
        <div>
          <button onClick={runTestCase}>Run Code</button>
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
        </div>
      </div>

      <div className="editor-container">
        <Editor 
          height="100%"  // Adjust height to take full available space
          language={language}
          theme={theme === 'light' ? 'light' : 'vs-dark'}  // Monaco Editor's themes: 'light' or 'vs-dark'
          value={code_to_run}
          onChange={handleEditorChange}
        />
      </div>

      <div className="output-input-container">
        <div className="output-box">
          <pre>{output}</pre>
        </div>
        <div className="input-box">
          <textarea
            placeholder="Enter custom input here..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default Arena;
