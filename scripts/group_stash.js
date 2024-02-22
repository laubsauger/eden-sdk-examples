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



// let grouped = groupFiles(fileList);
// console.log(grouped);

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