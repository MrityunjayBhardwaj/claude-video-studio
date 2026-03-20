import { execSync } from "child_process";
import path from "path";
import fs from "fs";

/**
 * Add background music to a rendered video
 */
export function addAudio(
  videoPath: string,
  audioPath: string,
  outputPath: string,
  volume = 0.3
): void {
  const cmd = [
    "ffmpeg -y",
    `-i "${videoPath}"`,
    `-i "${audioPath}"`,
    `-filter_complex "[1:a]volume=${volume}[a]"`,
    `-map 0:v -map "[a]"`,
    `-c:v copy -c:a aac`,
    `-shortest`,
    `"${outputPath}"`,
  ].join(" ");

  console.log("Adding audio...");
  execSync(cmd, { stdio: "inherit" });
  console.log(`Output: ${outputPath}`);
}

/**
 * Add subtitles / burned-in text overlay to a video
 */
export function addSubtitles(
  videoPath: string,
  srtPath: string,
  outputPath: string
): void {
  const cmd = `ffmpeg -y -i "${videoPath}" -vf "subtitles='${srtPath}'" -c:a copy "${outputPath}"`;
  console.log("Adding subtitles...");
  execSync(cmd, { stdio: "inherit" });
  console.log(`Output: ${outputPath}`);
}

/**
 * Convert video to GIF (for social sharing / previews)
 */
export function toGif(
  videoPath: string,
  outputPath: string,
  fps = 15,
  width = 640
): void {
  const palette = outputPath.replace(".gif", "_palette.png");
  try {
    execSync(
      `ffmpeg -y -i "${videoPath}" -vf "fps=${fps},scale=${width}:-1:flags=lanczos,palettegen" "${palette}"`,
      { stdio: "inherit" }
    );
    execSync(
      `ffmpeg -y -i "${videoPath}" -i "${palette}" -vf "fps=${fps},scale=${width}:-1:flags=lanczos,paletteuse" "${outputPath}"`,
      { stdio: "inherit" }
    );
    console.log(`GIF saved: ${outputPath}`);
  } finally {
    if (fs.existsSync(palette)) fs.unlinkSync(palette);
  }
}

/**
 * Trim a video to a time range
 */
export function trim(
  videoPath: string,
  startSeconds: number,
  endSeconds: number,
  outputPath: string
): void {
  const duration = endSeconds - startSeconds;
  const cmd = `ffmpeg -y -ss ${startSeconds} -i "${videoPath}" -t ${duration} -c copy "${outputPath}"`;
  console.log(`Trimming ${startSeconds}s–${endSeconds}s...`);
  execSync(cmd, { stdio: "inherit" });
  console.log(`Output: ${outputPath}`);
}

/**
 * Concatenate multiple video files
 */
export function concat(videoPaths: string[], outputPath: string): void {
  const listFile = outputPath + ".list.txt";
  fs.writeFileSync(listFile, videoPaths.map((p) => `file '${p}'`).join("\n"));
  try {
    const cmd = `ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${outputPath}"`;
    console.log(`Concatenating ${videoPaths.length} videos...`);
    execSync(cmd, { stdio: "inherit" });
    console.log(`Output: ${outputPath}`);
  } finally {
    fs.unlinkSync(listFile);
  }
}

/**
 * Get video info (duration, resolution, etc.)
 */
export function getInfo(videoPath: string): string {
  return execSync(`ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`)
    .toString();
}
