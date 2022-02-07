const readline = require('readline');
const { stdin, stdout } = require('process');

export const getStdIn = async (str, hidden = false) => {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  rl._writeToOutput = function _writeToOutput(stringToWrite) {
    if (rl.stdoutMuted)
      rl.output.write("*");
    else
      rl.output.write(stringToWrite);
  };

  if (hidden) {
    rl.stdoutMuted = true;
  }

  console.log(`\n${str}: `);

  return new Promise(resolve =>
    rl.question('', answer => {
      rl.close();
      resolve(answer);
    })
  );
};

export const loadFromStdIn = async text => {
  let input;

  while (!input) {
    input = await getStdIn(text, true);
  }

  return input;
};
