import eden from '../init_eden.js'
import fs from 'fs';
import {fileURLToPath} from 'url';
import {dirname} from 'path';
import upload_media from './upload_media.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const processConfig = {
  MAX_BATCH_SIZE: 4,
  PAUSE_IN_SECONDS: 30,
}

// const itemConfig = {
//   init_image: '',
//   control_image: ''
// }

// const taskConfig = {
//   generatorName: "controlnet",
//   config: {
//     ...baseConfig,
//     ...itemConfig
//   }
// }

// function groupFiles(array) {
//   return array.reduce((groups, item) => {
//     const match = item.match(/^(\d+)/);
//     if (match) {
//       const key = match[0];
//       if (!groups[key]) {
//         groups[key] = [];
//       }
//       groups[key].push(item);
//     }
//     return groups;
//   }, {});
// }

const inputBasePath = __dirname + '/input'
const inputFolder = `/round1`
const inputFilePath = inputBasePath + inputFolder

console.log('Reading directory...', inputFilePath)
const fileList = fs.readdirSync(inputFilePath)
console.log('Files found:', fileList)

// let grouped = groupFiles(fileList);
// console.log(grouped);

let tasks = []
//
// grouped.map((group, index) => {
//   console.log(group, index)
//   const controlnetImageFilePath = inputFilePath + '/' + group[0]
//   console.log(filePath)
//   // console.log(fileData)
//   // Do something with fileData
//   const itemConfig = {
//     text_input: 'Sunset on a beach, alien planet',
//     control_image: controlnetImageFilePath,
//     // controlnet_type: 'canny-edge',
//     // control_image_strength: 0.6,
//     lora: '65c5527b05ae245297bce5b8',
//     // lora_scale: 0.7,
//     // n_samples: 1,
//     // steps: 35,
//     // guidance_scale: 8,
//   }
//
//   tasks.push({
//     generatorName: "controlnet",
//     config: {
//       ...baseConfig,
//       ...itemConfig
//     }
//   })
// })

const roundConfig = await import(inputBasePath + '/config.js')
// console.log(roundConfigs)

await Promise.all(fileList.map(async (filePath, index) => {
  const controlnetImageFilePath = inputFilePath + '/' + filePath

  console.log('Uploading media...', controlnetImageFilePath)
  const uploadedImage = await upload_media(controlnetImageFilePath)
  console.log(uploadedImage)

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

try {
  for (let task of tasks) {
    console.log('Submitting task...', task)

    // const urls = await eden.create(task)
    const response = await eden.tasks.create(task)
    currentBatchSize++
    console.log('Task submiited successfully:', response)

    // Check if the current batch size is reached to the max size
    if (currentBatchSize >= processConfig.MAX_BATCH_SIZE) {
      // Wait for a specific period before processing the next batch
      await new Promise(resolve => setTimeout(resolve, processConfig.PAUSE_IN_SECONDS * 1000));

      // Reset the current batch size for the next batch
      currentBatchSize = 0;
    }
  }
  process.exit(0)
} catch (e) {
  console.log(e)
  process.exit(1)
}