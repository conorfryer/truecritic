// fetchKaggleData.js
const { exec } = require('child_process');
const path = require('path');
require('dotenv').config();

const dataset = 'ngshiheng/michelin-guide-restaurants-2021';
const downloadPath = path.join(__dirname, '../data');
const command = `kaggle datasets download -d ${dataset} -p ${downloadPath} --unzip`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error downloading dataset: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`Dataset downloaded successfully: ${stdout}`);
});
