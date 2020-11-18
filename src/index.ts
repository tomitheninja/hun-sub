import { v1p1beta1 as speech } from "@google-cloud/speech";
import fs from "fs";

const [first_arg, second_arg] = process.argv.slice(2);

if (first_arg === "--help") {
  console.log("Usage: node index.js <FILE_PATH? (or gs://)> <LANG?>");
  process.exit(0);
}

const FILE_PATH = first_arg ?? "./input.mp3";
const LANG = second_arg ?? "hu-HU";

console.log({ FILE_PATH, LANG });

(async function main() {
  const client = new speech.SpeechClient();

  const [response] = await client.recognize({
    config: {
      enableWordTimeOffsets: true,
      encoding: "MP3",
      sampleRateHertz: 16_000,
      languageCode: LANG,
    },
    audio: {
      content: FILE_PATH.startsWith("gs://")
        ? FILE_PATH
        : fs.readFileSync(FILE_PATH).toString("base64"),
    },
  });
  if (!response.results) {
    throw new Error("No result");
  }
  response.results.forEach((result) => {
    if (!result.alternatives || result.alternatives.length === 0) {
      console.log("__ERROR__");
      return;
    }
    console.log(`Transcription: ${result.alternatives[0].transcript}`);

    console.log("################################");

    result.alternatives[0].words!.forEach((wordInfo) => {
      const { startTime, endTime, word } = wordInfo;

      if (!startTime || !endTime || !startTime.nanos || !endTime.nanos) {
        console.log("__ERROR2__");
        return;
      }

      const min = (secs: number) => Math.floor(secs / 60);
      const sec = (secs: number) => Math.floor(secs % 60);

      const toNumber = (x: any) => Number(x.seconds);
      const timeStr = (time: any) =>
        `${min(toNumber(time))}:${sec(toNumber(time))}`;

      console.log(`${word}\n\t${timeStr(startTime)} => ${timeStr(endTime)}`);
    });
  });
})();
