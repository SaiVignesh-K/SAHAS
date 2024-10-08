import React, { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { ResizableBox } from 'react-resizable';
import { useParams } from 'react-router-dom';
import './problempage.css';
import 'react-resizable/css/styles.css';

const Problempage = () => {
  const { ProblemID } = useParams(); // Extract problemid from URL
  const [problemValue, setProblemValue] = useState('');
  const [code_to_run, setCode] = useState('// Start coding...');
  const [theme, setTheme] = useState('light');
  const [lng, setLanguage] = useState('cpp');
  const [output, setOutput] = useState('');
  const [problemdif, setproblemdif] = useState('');
  const [testcase, setTestcase] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const response = await fetch(`http://localhost:3333/problem/${ProblemID}`);
        if (response.ok) {
          const data = await response.json();
          setProblemValue(`Problem Statement: ${data.ProblemStatement}`); // Set formatted problem statement
          setproblemdif(`Difficulty: ${data.ProblemDifficulty}`);
          setCustomInput(data.ProblemTestCasesInput); // Set custom input
          setTestcase(` Sample Input: ${data.ProblemTestCasesInput}\n Sample Output: ${data.ProblemTestCasesOutput}`);
          setCode('// Start coding...'); // Optionally set initial code
        } else {
          console.error('Failed to fetch problem details');
        }
      } catch (error) {
        console.error('Error fetching problem details:', error);
      }
    };

    fetchProblem();
  }, [ProblemID]);

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const runTestCase = async () => {
    setLoading(true);
    try {
      const requestData = {
        code: code_to_run,
        inputs: customInput.trim().split('\n'),
        language: lng
      };

      const response = await fetch('http://localhost:3333/run-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (data.error) {
        setOutput(`Error: ${data.error}`);
        return;
      }
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const formattedOutput = `Output:\n${data.output}\nRuntime: ${data.runtime}s\n`;
      setOutput(formattedOutput);

    } catch (err) {
      setOutput(`Error running code: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const SubmitCode = async () => {
    setLoading(true);
    try {
      const requestData = {
        code: code_to_run,
        language: lng,
        PID: ProblemID
      };

      const response = await fetch('http://localhost:3333/submit-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (data.error) {
        setOutput(`Error: ${data.error}`);
        return;
      }
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const formattedOutput = `${data.msg}`;
      setOutput(formattedOutput);

    } catch (err) {
      setOutput(`Error running code: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`problem-page-container ${theme}`}>
      <div className="toolbar">
        <select onChange={(e) => setLanguage(e.target.value)} value={lng}>
          <option value="c">C</option>
          <option value="cpp">C++</option>
        </select>
        <p>SAHAS_CODE_ARENA</p>
        <div>
          <button onClick={runTestCase}>Run Code</button>
          <button onClick={SubmitCode}>Submit</button>
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
        </div>
      </div>

      <div className="content-container">
        <ResizableBox
          className="problem-statement"
          width={600}
          height={Infinity}
          minConstraints={[200, Infinity]}
          maxConstraints={[600, Infinity]}
          axis="x"
          resizeHandles={['e']}
        >
          <h4>Problem</h4>
          <p>{problemValue}</p>
          <p>{problemdif}</p>
        </ResizableBox>

        <ResizableBox
          className="editor-container"
          width={400}
          height={Infinity}
          minConstraints={[300, Infinity]}
          maxConstraints={[800, Infinity]}
          axis="x"
          resizeHandles={['w']}
        >
          <Editor
            height="100%"
            language={lng}
            theme={theme === 'light' ? 'light' : 'vs-dark'}
            value={code_to_run}
            onChange={handleEditorChange}
          />
        </ResizableBox>
      </div>

      <ResizableBox
        className="output-input-horizontal-container"
        width={Infinity}
        height={100}
        minConstraints={[Infinity, 150]}
        maxConstraints={[Infinity, 500]}
        axis="y"
        resizeHandles={['n']}
      >
        <div className="output-box">
          {loading ? (
            <div className="progress-bar">
              <p>Loading.....</p>
              <div className="progress"></div>
            </div>
          ) : (
            <pre>{output || "Your output goes here..."}</pre>
          )}
        </div>
        <div className="input-boxes">
          <textarea
            className="input-box"
            placeholder="Enter custom input here..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
          />
          <pre>{testcase || " Sample test case"}</pre>
        </div>
      </ResizableBox>
    </div>
  );
};

export default Problempage;
