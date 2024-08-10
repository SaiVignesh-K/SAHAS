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
  const runCommand = 'timeout 20 /code/main < /code/input.txt > /code/output.txt'; // 10-second timeout

  let startTime = Date.now();

  try {
    // Compile code
    const compileResult = await executeInContainer(container, compileCommand);
    if (compileResult.includes('error')) throw new Error('Compilation failed: '+compileResult);

    // Run the compiled program
    await executeInContainer(container, runCommand);
    
    let endTime = Date.now();
    let runtime = (endTime - startTime) / 1000; // runtime in seconds
    if(runtime > 20) {
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

app.listen(3333, () => console.log('Server running on port 3333'));
