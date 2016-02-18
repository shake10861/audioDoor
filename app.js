var fs = require('fs');
var lame = require('lame');
var Speaker = require('speaker');

var Gpio = require('onoff').Gpio;

var swtch = new Gpio(23, 'in', 'both');
var buzzer = new Gpio(24, 'out');

var soundPlaying = false;

function randomInt(min, max) {
  return Math.floor(Math.random()*(max-min+1)+min);
}

function getRandomFile() {
  var files = fs.readdirSync('./sounds');
  var idx = randomInt(0, files.length);
  if (files[idx] == '.')
    return getRandomFile(); // try again

  if (files[idx] == '..')
    return getRandomFile(); // try again

  return files[idx];
}


function playSound() {
  if (!soundPlaying) {
    soundPlaying = true;
    var fileToPlay = getRandomFile();
    console.log('Playing Sound:  ./sounds/' + fileToPlay);
    fs.createReadStream('./sounds/' + fileToPlay)
      .pipe(new lame.Decoder())
      .on('format', function (format) {
        this.pipe(new Speaker(format))
        .on('close', function () {
          console.log('audio file complete.');
          soundPlaying = false;
        });
      });
  } else {
    console.log('Door opened again, but sound already playing');
  }
}


swtch.read(function (err, value) {
  if (err) console.log(err);
  if (value == 1) {
    buzzer.writeSync(0);
  } else {
    buzzer.writeSync(1);
  }
});

swtch.watch(function (err, value) {
  if (err) console.log(err);
  //console.log('The value is: ', value);
  if (value == 1) {
    buzzer.writeSync(0);
  } else {
    buzzer.writeSync(1);
    playSound();
  }
});


function exit() {
  swtch.unexport();
  buzzer.unexport();
  console.log('SWTCH Unexported..');
  process.exit();
}

process.on('SIGINT', exit);
