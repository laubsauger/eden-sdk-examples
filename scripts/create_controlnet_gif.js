import eden from '../init_eden.js'
import fs from 'fs'
import {fileURLToPath} from 'url'
import path, {dirname} from 'path'
import upload_media from './upload_media.js'
import fetch from 'node-fetch'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const processConfig = {
  MAX_BATCH_SIZE: 1,
  PAUSE_IN_SECONDS: 30,
}

const roundFolder = `/round1`
const inputBasePath = __dirname + '/input'
const inputPath = inputBasePath + roundFolder
const outputBasePath = __dirname + '/output'
const outputPath = outputBasePath + roundFolder

console.log('Reading directory...', inputPath)
const fileList = fs.readdirSync(inputPath)
console.log('Files found:', fileList)

let tasks = []

const roundConfig = await import(inputBasePath + '/config.js')
// console.log(roundConfigs)

await Promise.all(fileList.map(async (filePath, index) => {
  const controlnetImageFilePath = inputPath + '/' + filePath

  console.log('Uploading media...', controlnetImageFilePath)
  const uploadedImage = await upload_media(controlnetImageFilePath)
  // console.log(uploadedImage)

  const itemConfig = {
    control_image: uploadedImage.url,
  }

  tasks.push({
    generatorName: "controlnet",
    config: {
      ...roundConfig.default,
      ...itemConfig
    }
  })
}))

console.log('Num tasks to create:', tasks.length)

process.on('exit', function(code) {
  return console.log(`Script execution finished - Code: ${code}`);
});

let currentBatchSize = 0;

// create an array of array for batches
// await Promise.all
// wait after

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

const downloadAndStoreMedia = async (url, outputFolder) => {
  console.log('Downloading media...', url);
  const response = await fetch(url);
  const data = await response.arrayBuffer();
  const buffer = Buffer.from(data);
  const fileName = url.substring(url.lastIndexOf('/') + 1);

  // Check if the directory exists and create it if it doesn't.
  await fs.promises.mkdir(outputFolder, { recursive: true }).catch(console.error);

  const outputFilePath = path.join(outputFolder, fileName);
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

const submitTasksAwait = async (tasks) => {
  // create tasks batches as an array of arrays using MAX_BATCH_SIZE
  const taskBatches = [];
  while (tasks.length > 0) {
    taskBatches.push(tasks.splice(0, processConfig.MAX_BATCH_SIZE));
  }

  for (let taskBatch of taskBatches) {
    await Promise.all(taskBatch.map(async (task) => {
      console.log('Submitting task...', task)
      const creationUrls = await eden.create(task)
      console.log('Task finished successfully:', creationUrls[0])
      await downloadAndStoreMedia(creationUrls[0], outputPath)
    }))
    currentBatchSize = await handleBatchPause(
      currentBatchSize,
      processConfig.MAX_BATCH_SIZE,
      processConfig.PAUSE_IN_SECONDS
    )
  }
}

try {
  // await submitTasksPolling(tasks)
  await submitTasksAwait(tasks)
  process.exit(0)
} catch (e) {
  console.log(e)
  process.exit(1)
}