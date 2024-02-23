import eden from '../init_eden.js'
import fs from 'fs'
import {fileURLToPath} from 'url'
import path, {dirname} from 'path'
import upload_media from './upload_media.js'
import fetch from 'node-fetch'
import ffmpeg from 'fluent-ffmpeg';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
const argv = yargs(hideBin(process.argv))
  .option('prompt', {
    alias: 'p',
    type: 'string',
    describe: 'text prompt',
    demandOption: true
  })
  .option('dir', {
    alias: 'd',
    type: 'string',
    describe: 'folder name',
    demandOption: true
  })
  .option('concept', {
    alias: 'c',
    type: 'string',
    describe: 'conceptId'
  })
  .option('seed', {
    alias: 's',
    type: 'number',
    describe: 'seed'
  })
  .argv;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const processConfig = {
  MAX_BATCH_SIZE: 6,
  PAUSE_IN_SECONDS: 20,
}
const roundFolder = argv.dir;
const inputBasePath = __dirname + '/input'
const inputPath = inputBasePath + '/' + roundFolder
const outputBasePath = __dirname + '/output'
const outputPath = outputBasePath + '/' + roundFolder

console.log('---')
console.log('Reading directory...', inputPath)
const fileList = fs.readdirSync(inputPath).filter((file) => {
  // Get the file extension
  const ext = path.extname(file).toLowerCase();

  // Return true if the extension denotes a media file
  return ['.webp', '.jpg', '.jpeg', '.png', '.gif', '.mp4', '.avi', '.mov', '.flv'].includes(ext);
});
console.log('Media files found:', fileList)
console.log('---')

let tasks = []

const roundConfig = await import(inputBasePath + '/config.js')
// console.log(roundConfigs)

await Promise.all(fileList.map(async (filePath, index) => {
  const controlnetImageFilePath = inputPath + '/' + filePath

  console.log('Uploading media...', controlnetImageFilePath)
  const uploadedImage = await upload_media(controlnetImageFilePath)
  // console.log(uploadedImage)

  const itemConfig = {
    text_input: argv.prompt,
    control_image: uploadedImage.url,
  }

  if (argv.concept) {
    itemConfig['lora'] = argv.concept
  }
  if (argv.seed) {
    itemConfig['seed'] = argv.seed
  }

  tasks.push({
    fileName: filePath,
    params: {
      generatorName: "controlnet",
      config: {
        ...roundConfig.default,
        ...itemConfig
      }
    }
  })
}))

console.log('---')
console.log('Num Tasks:', tasks.length)
console.log('Num Tasks per batch:', processConfig.MAX_BATCH_SIZE)
console.log('Num Batches:', Math.ceil(tasks.length/processConfig.MAX_BATCH_SIZE))
console.log('---')
process.on('exit', function(code) {
  return console.log(`Script execution finished - Code: ${code}`);
});

let currentBatchSize = 0;

const downloadAndStoreMedia = async (url, outputFolder, fileName) => {
  console.log('Downloading media...', url);
  const response = await fetch(url);
  const data = await response.arrayBuffer();
  const buffer = Buffer.from(data);

  // Check if the directory exists and create it if it doesn't.
  await fs.promises.mkdir(outputFolder, { recursive: true }).catch(console.error);

  // Gets the file extension from the original file url.
  const fileExtension = path.extname(new URL(url).pathname);

  // Remove the extension from the provided filename if it exists
  const fileNameWithoutExtension = path.basename(fileName, path.extname(fileName));

  // Append the original file extension to the provided file name.
  const completeFileName = `${fileNameWithoutExtension}${fileExtension}`;

  const outputFilePath = path.join(outputFolder, completeFileName);

  await fs.promises.writeFile(outputFilePath, buffer);
  console.log('Storing media...', outputFilePath);
};

const submitTasksPolling = async (tasks) => {
  for (let task of tasks) {
    console.log('Submitting task...', task)
    const response = await eden.tasks.create(task)
    console.log('Task submitted successfully:', response)

    currentBatchSize = await handleBatchPause(currentBatchSize, processConfig.MAX_BATCH_SIZE, processConfig.PAUSE_IN_SECONDS)
  }
}

// Asynchronous function to handle a batch of tasks
const handleBatch = async (batch) => {
  await Promise.all(batch.map(async (task) => {
    console.log('Submitting task...', task)
    const creationUrls = await eden.create(task.params)
    console.log('Task finished successfully:', creationUrls[0]);
    await downloadAndStoreMedia(creationUrls[0], outputPath, task.fileName)
  }))
}

const handleBatchPause = async (currentBatchSize, maxBatchSize, pauseInSeconds) => {
  // const response = await eden.tasks.create(task)
  currentBatchSize++
  // Check if the current batch size is reached to the max size
  if (currentBatchSize >= maxBatchSize) {
    // Wait for a specific period before processing the next batch
    await new Promise(resolve => setTimeout(resolve, pauseInSeconds * 1000));

    // Reset the current batch size for the next batch
    return 0
  }

  return currentBatchSize
}

const submitTasksAwait = async (tasks) => {
  // create tasks batches as an array of arrays using MAX_BATCH_SIZE
  const taskBatches = [];
  while (tasks.length > 0) {
    taskBatches.push(tasks.splice(0, processConfig.MAX_BATCH_SIZE));
  }

  const allButLast = taskBatches.slice(0, -1);
  const lastBatch = taskBatches[taskBatches.length - 1];

  // Process all but the last batch and pause
  for(let [index, batch] of allButLast.entries()) {
    console.log('Executing batch', index + 1, 'of', taskBatches.length)
    await handleBatch(batch);
    currentBatchSize = await handleBatchPause(
      currentBatchSize,
      processConfig.MAX_BATCH_SIZE,
      processConfig.PAUSE_IN_SECONDS
    );
  }

  // Process the last batch without pausing
  if(lastBatch) {
    console.log('Executing batch', taskBatches.length, 'of', taskBatches.length)
    await handleBatch(lastBatch);
  }
}

const createVideoFromImages = async (imageDirectory, outputFilename) => {
  console.log('Stitching video from images...', imageDirectory)
  return new Promise((resolve, reject) => {
    ffmpeg()
      .on('error', reject)
      .on('end', () => {
        console.log('Saving video...', outputFilename)
        resolve()
      })
      .input(imageDirectory + '/*.jpg')
      .inputOptions(['-pattern_type glob', '-r 12']) // Adjust as needed
      .videoCodec('libx264')
      .outputOptions('-pix_fmt', 'yuv420p') // Needed for some players
      .output(outputFilename)
      .run();
  });
}

try {
  await submitTasksAwait(tasks)
  await createVideoFromImages(outputPath, outputPath + `/output_${Date.now()}.mp4`)
  process.exit(0)
} catch (e) {
  console.log(e)
  process.exit(1)
}