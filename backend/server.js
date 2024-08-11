const express = require('express');
const bodyParser = require('body-parser');
const Docker = require('dockerode');
const tar = require('tar-stream');
const app = express();
const docker = new Docker();
const cors = require('cors');
app.use(cors());

app.use(bodyParser.json());

// Run Code API
app.post('/run-code', async (req, res) => {
  const { code, inputs, language } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });
  if (!language) return res.status(400).json({ error: 'Language is required' });

  // Validate language
  if (language !== 'c' && language !== 'cpp') {
    return res.status(400).json({ error: 'Invalid language. Supported languages: c, cpp' });
  }

  // Create job
  const job = { code, inputs, language };

  try {
    const dockerContainer = await getOrCreateContainer();
    const result = await runCodeInContainer(dockerContainer, job.code, job.inputs, job.language);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get or Create Docker Container
const getOrCreateContainer = async () => {
  const containers = await docker.listContainers({ all: true });
  let container = containers.find(c => c.Names.includes('/cpp-executor'));

  if (!container) {
    container = await docker.createContainer({
      Image: 'cpp-executor', // Replace with your Docker image name
      name: 'cpp-executor',
      Cmd: ['sleep', 'infinity'], // Keep the container running
      Tty: true,
    });
    await container.start();
  }

  return docker.getContainer(container.Id);
};

// Run Code in Docker Container
const runCodeInContainer = async (container, code, inputs, language) => {
  const tar = require('tar-stream');
  const { PassThrough } = require('stream');
  const fs = require('fs');
  const path = require('path');

  // Create a tar archive with the code file and input file
  const pack = tar.pack();

  // Add the code file to the tar archive
  const codeFileName = language === 'cpp' ? 'main.cpp' : 'main.c';
  pack.entry({ name: codeFileName }, code);

  // Create input.txt file with inputs
  const inputFilePath = path.join(__dirname, 'input.txt');
  fs.writeFileSync(inputFilePath, inputs.join(' '));

  // Add the input.txt file to the tar archive
  pack.entry({ name: 'input.txt' }, fs.readFileSync(inputFilePath));
  pack.finalize();
  
  // Create a PassThrough stream to use as an input for putArchive
  const tarStream = new PassThrough();
  pack.pipe(tarStream);
  
  // Upload code and input files to container
  await container.putArchive(tarStream, { path: '/code' });

  // Compile and run code with timeout
  const compileCommand = language === 'cpp'
  ? 'g++ -o /code/main /code/main.cpp'
  : 'gcc -o /code/main /code/main.c';
  const runCommand = 'timeout 100 /code/main < /code/input.txt > /code/output.txt'; // 10-second timeout

  let startTime = Date.now();

  try {
    // Compile code
    const compileResult = await executeInContainer(container, compileCommand);
    if (compileResult.includes('error')) throw new Error('Compilation failed: '+compileResult);

    // Run the compiled program
    await executeInContainer(container, runCommand);
    
    let endTime = Date.now();
    let runtime = (endTime - startTime) / 1000; // runtime in seconds
    if(runtime > 100) {
      throw new Error('Timelimit Exceeded');
    }

    // Create tar stream with output.txt
    const outputTarStream = await createOutputTarStream(container);

    // Extract the output from the tar stream
    const output = await extractOutputFromTarStream(outputTarStream);

    return { output, runtime };
  } catch (error) {
    throw error;
  }
};

// Create tar stream containing output.txt
const createOutputTarStream = async (container) => {
  return new Promise((resolve, reject) => {
    container.getArchive({ path: '/code/output.txt' }, (err, stream) => {
      if (err) return reject(err);

      resolve(stream);
    });
  });
};

// Extract and read the output.txt from tar stream
const extractOutputFromTarStream = (stream) => {
  return new Promise((resolve, reject) => {
    const extract = tar.extract();
    let output = '';

    extract.on('entry', (header, entryStream, next) => {
      if (header.name === 'output.txt') {
        entryStream.on('data', (chunk) => {
          output += chunk.toString();
        });

        entryStream.on('end', () => {
          resolve(output);
        });
      } else {
        entryStream.resume();
      }

      next();
    });

    extract.on('error', (err) => {
      reject(err);
    });

    stream.pipe(extract);
  });
};

// Execute command in Docker container
const executeInContainer = (container, command) => {
  return new Promise((resolve, reject) => {
    container.exec(
      {
        Cmd: ['/bin/bash', '-c', command],
        AttachStdout: true,
        AttachStderr: true,
      },
      (err, exec) => {
        if (err) return reject(err);

        exec.start((err, stream) => {
          if (err) return reject(err);

          let output = '';

          stream.on('data', (data) => {
            output += data.toString();
          });

          stream.on('end', () => {
            resolve(output);
          });

          stream.on('error', (err) => {
            reject(err);
          });
        });
      }
    );
  });
};

const dotenv = require('dotenv')
const mongoose = require('mongoose')
const ProblemModel = require('./models/Problems');
dotenv.config({path:'./config.env'});
const db= process.env.DATABASE;
mongoose.connect(db).then(()=>{
    console.log("Connection Succesful");
}).catch((e)=>{
    console.log(e);
})

app.post('/upload', async (req, res) => {
  try {
    // Find the highest ProblemID
    const highestProblem = await ProblemModel.findOne({}, { ProblemID: 1 }).sort({ ProblemID: -1 });

    // Increment ProblemID
    const newProblemID = highestProblem ? highestProblem.ProblemID + 1 : 1;

    // Create a new problem with the incremented ProblemID
    const problem = new ProblemModel({ ...req.body, ProblemID: newProblemID });
    const savedProblem = await problem.save();

    res.status(201).json(savedProblem);
} catch (error) {
    res.status(400).json({ error: error.message });
}
});

// Get a problem by ProblemID
app.get('/problem/:ProblemID', async (req, res) => {
  try {
      const problem = await ProblemModel.findOne({ ProblemID: req.params.ProblemID }).select('-ProblemHiddenTestCasesInput -ProblemHiddenTestCasesOutput');
      if (!problem) return res.status(404).json({ message: "Problem not found" });
      res.status(200).json(problem);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

app.get('/problems', async (req, res) => {
  try {
      const problems = await ProblemModel.find().select('ProblemID ProblemName ProblemDifficulty');
      res.status(200).json(problems);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

app.post('/submit-code', async (req, res) => {
  const { code, language, PID } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });
  if (!language) return res.status(400).json({ error: 'Language is required' });
  if (!PID) return res.status(400).json({ error: 'ProblemID is required' });

  if (language !== 'c' && language !== 'cpp') {
    return res.status(400).json({ error: 'Invalid language. Supported languages: c, cpp' });
  }

  const problem = await ProblemModel.findOne({ ProblemID: PID}).select('ProblemHiddenTestCasesInput ProblemHiddenTestCasesOutput');
  if (!problem) return res.status(404).json({ error : "Problem not found" });
  try {
    const dockerContainer = await getOrCreateContainer();
    const inputs = problem.ProblemHiddenTestCasesInput.trim().split('\n');
    const result = await runCodeInContainer(dockerContainer, code, inputs, language);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    if (problem.ProblemHiddenTestCasesOutput === result.output) {
      const msg = `CodeSubmission: Accepted!!!`;
      return res.status(200).json({ msg });
    }
    const msg = `CodeSubmission: Wrong Answer`;
    return res.status(200).json({ msg });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


const http = require('http');
const WebSocket = require('ws');
const uuid = require('uuid');
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const battles = {}; // Stores battle details
const sessions = {}; // Stores user sessions
const queue = []; // Stores users waiting for a battle
  

app.post('/enter-battle', async (req, res) => {
  const { SID } = req.body;
  const sessionId = SID;
  const problemID = Math.floor(Math.random() * 10) + 1; // Example problem ID assignment

  queue.push(sessionId);

  const checkQueueAndPair = () => {
    if (queue.length >= 2) {
        // Pair the top two players
        const player1Id = queue.shift();
        const player2Id = queue.shift();

        // Generate problem ID and battle ID
        const problemID = Math.floor(Math.random() * 10) + 1; // Example problem ID assignment
        const battleID = uuid.v4();

        // Store battle details
        battles[battleID] = {
            sessionId: [player1Id, player2Id],
            problemID,
        };

        // Store session details
        sessions[player1Id] = { battleID };
        sessions[player2Id] = { battleID };

        // Notify both players
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'battle',
                    battleID,
                    problemID,
                    sessionId: [player1Id, player2Id]
                }));
            }
        });

        // Respond with the problem ID and battle ID to the player who was just paired
        res.json({ problemID, battleID });
    } else {
        // If not enough players, set a timeout to check the queue again
        setTimeout(checkQueueAndPair, 1000); // Check queue every second
    }
};

checkQueueAndPair();
});

app.post('/submit-battle-code', async (req, res) => {
  const { code, language, PID, BID, SID } = req.body;
  const battle = battles[BID];
  
  if (!battle || battle.sessionId !== SID) {
      return res.status(400).json({ error: 'Invalid battle or session' });
  }

  try {
    const dockerContainer = await getOrCreateContainer();
    const inputs = problem.ProblemHiddenTestCasesInput.trim().split('\n');
    const result = await runCodeInContainer(dockerContainer, code, inputs, language);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    if (problem.ProblemHiddenTestCasesOutput === result.output) {
      const msg = `CodeSubmission: Accepted!!!`;
      const winner = SID;
            const loser = battle.sessionId.find(id => id !== SID);

            // Notify both players
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    if (client.sessionId === winner) {
                        client.send(JSON.stringify({
                            type: 'winner',
                            playerId: winner,
                            battleId: BID
                        }));
                    } else if (client.sessionId === loser) {
                        client.send(JSON.stringify({
                            type: 'loser',
                            playerId: loser,
                            battleId: BID
                        }));
                    }
                }
            });
  
      return res.status(200).json({ msg });
    }
    const msg = `CodeSubmission: Wrong Answer`;
    return res.status(200).json({ msg });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
  

app.listen(3333, () => console.log('Server running on port 3333'));


