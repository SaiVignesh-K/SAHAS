import React, { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { ResizableBox } from 'react-resizable';
import './problempage.css';
import 'react-resizable/css/styles.css';
import { v4 as uuidv4 } from 'uuid';
import './Battleground.css';

const Battleground = () => {
    const [pid, setpid] = useState(''); // Extract problemid from URL
    const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId') || uuidv4());
    const [problemValue, setProblemValue] = useState('');
    const [code_to_run, setCode] = useState('// Start coding...');
    const [theme, setTheme] = useState('light');
    const [lng, setLanguage] = useState('cpp');
    const [output, setOutput] = useState('');
    const [problemdif, setproblemdif] = useState('');
    const [testcase, setTestcase] = useState('');
    const [customInput, setCustomInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [ws, setWs] = useState(null);
    const [waiting, setWaiting] = useState(false);
    const [inBattle, setInBattle] = useState(false);
    const [battleId, setBattleId] = useState(null);
    const [notification, setNotification] = useState('');

    localStorage.getItem('sessionId') || localStorage.setItem('sessionId', uuidv4());

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:3333');
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'winner':
                    setNotification(`You won the battle!`);
                    setInBattle(false);
                    break;
                case 'loser':
                    setNotification(`You lost the battle!`);
                    setInBattle(false);
                default:
                    break;
            }
        };
        setWs(socket);
        return () => {
            socket.close();
        };
    }, []);

    const enterBattle = async () => {
        setWaiting(true);
        try {
            data = {
                SID: localStorage.getItem('sessionId')
            }
            const response = await fetch('http://localhost:3333/enter-battle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const data = await response.json();

            if (data.error) {
                setOutput(`Error: ${data.error}`);
                return;
            }
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            setpid(data.problemID); // Set the problem ID received from the backend
            setBattleId(data.battleID); // Set the battle ID received from the backend
            setInBattle(true);
            setWaiting(false);

        } catch (err) {
            setOutput(`Error: ${err.message}`);
        }

    };

useEffect(() => {
    const fetchProblem = async () => {
        try {
            const response = await fetch(`http://localhost:3333/problem/${pid}`);
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
}, [pid]);

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
            PID: localStorage.getItem('pid'),
            BID: localStorage.getItem('battleId'),
            SID: localStorage.getItem('sessionId')
        };

        const response = await fetch('http://localhost:3333/submit-battle-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();
        setOutput(data.msg);
    } catch (err) {
        setOutput(`Error running code: ${err.message}`);
    } finally { setLoading(false); }
};


return (
    <div className='battle-container'>
        {!inBattle ? (
            <button className='battle-button' onClick={enterBattle} disabled={waiting}>
                {waiting ? 'Waiting for opponent...' : 'Enter Battle'}
            </button>
        ) : (
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
                {notification && <div>{notification}</div>}
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
        )}
    </div>
);
};

export default Battleground;
