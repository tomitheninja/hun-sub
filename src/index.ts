import { v1p1beta1 as speech } from "@google-cloud/speech";

const [first_arg, second_arg] = process.argv.slice(2);

if (first_arg === "--help") {
  console.log("Usage: node index.js <GS_URI)> <LANG?>");
  process.exit(0);
}

const GS_URI = first_arg;
const LANG = second_arg ?? "hu-HU";

console.log({ GS_URI, LANG });

if (!GS_URI?.startsWith("gs://")) {
  throw new Error("Invalid GS_URL");
}

(async function main() {
  const client = new speech.SpeechClient();
  const [operation] = await client.longRunningRecognize({
    config: {
      enableWordTimeOffsets: true,
      encoding: "MP3",
      sampleRateHertz: 16_000,
      languageCode: LANG,
    },
    audio: {
      uri: GS_URI,
    },
  });

  // // Get a Promise representation of the final result of the job
  // const [response] = await operation.promise();
  // const transcription = response.results
  //   .map((result) => result.alternatives[0].transcript)
  //   .join("\n");
  // console.log(`Transcription: ${transcription}`);

  const [response] = await operation.promise();
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
