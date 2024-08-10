const express = require('express');
const bodyParser = require('body-parser');
const Docker = require('dockerode');

const app = express();
const docker = new Docker();
const cors = require('cors');
app.use(cors());

app.use(bodyParser.json());

// Run Code API
app.post('/run-code', async (req, res) => {
  const { code, inputs } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  // Create job
  const job = { code, inputs };

  try {
    const dockerContainer = await getOrCreateContainer();
    const result = await runCodeInContainer(dockerContainer, job.code, job.inputs);
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
const runCodeInContainer = async (container, code, inputs) => {
  // Save code to file
  const tar = require('tar-stream');
  const { PassThrough } = require('stream');
  const fs = require('fs');
  const path = require('path');

  // Create a tar archive with the code file
  const pack = tar.pack();
  pack.entry({ name: 'main.c' }, code);
  pack.finalize();
  
  // Create a PassThrough stream to use as an input for putArchive
  const tarStream = new PassThrough();
  pack.pipe(tarStream);
  
  // Upload code to container
  await container.putArchive(tarStream, { path: '/code' });
  
  // Upload code to container
  await container.putArchive(tarStream, { path: '/code' });

  // Compile and run code with timeout
  const compileCommand = `gcc -o /code/main /code/main.c`;
  const runCommand = `timeout 10 /code/main <<< "${inputs.join(' ')}"`; // 10-second timeout

  let startTime = Date.now();

  try {
    // Compile code
    const compileResult = await executeInContainer(container, compileCommand);
    if (compileResult.includes('error')) throw new Error('Compilation failed');

    // Measure memory usage before running the code
    let statsBefore = await getContainerStats(container);

    // Run the compiled program
    const runResult = await executeInContainer(container, runCommand);
    
    let endTime = Date.now();
    let runtime = (endTime - startTime) / 1000; // runtime in seconds

    // Measure memory usage after running the code
    let statsAfter = await getContainerStats(container);
    let memoryUsage = statsAfter.memory_stats.usage - statsBefore.memory_stats.usage;

    return { output: runResult, runtime, memoryUsage };
  } catch (error) {
    throw error;
  }
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
            // Convert buffer to string and accumulate the output
            output += data.toString();
          });

          stream.on('end', () => {
            // Clean up the output
            // Remove control characters except newline and tab
            const cleanedOutput = output
              .replace(/[\x00-\x08\x0E-\x1F\x7F-\x9F]/g, '') // Remove control characters
              .replace(/\f/g, '')  // Remove form feeds
              .replace(/\r/g, ''); // Remove carriage returns

            // Optionally log cleaned output for debugging
            console.log("Cleaned Output:", cleanedOutput);

            resolve(cleanedOutput);
          });

          stream.on('error', (err) => {
            reject(err);
          });
        });
      }
    );
  });
};




// Get container stats
const getContainerStats = async (container) => {
  return new Promise((resolve, reject) => {
    container.stats({ stream: false }, (err, stats) => {
      if (err) return reject(err);
      resolve(stats);
    });
  });
};

app.listen(3333, () => console.log('Server running on port 3333'));
