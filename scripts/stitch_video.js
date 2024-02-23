import ffmpeg from 'fluent-ffmpeg';

const createVideoFromImages = async (imagePaths, outputFilename) => {
  return new Promise((resolve, reject) => {
    let ff = ffmpeg();

    imagePaths.forEach((imagePath) => {
      ff = ff.input(imagePath);
    });

    ff.on('error', reject)
      .on('end', resolve)
      .inputOptions('-framerate', '1/5') // Adjust as needed
      .videoCodec('libx264')
      .outputOptions('-pix_fmt', 'yuv420p') // Needed for some players
      .output(outputFilename)
      .run();
  });
}