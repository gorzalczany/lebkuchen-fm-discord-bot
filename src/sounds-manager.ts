import { Service } from 'typedi';
import { resolve } from 'path';
import fs from 'fs';
import ffmpegPath from 'ffmpeg-static';
import { execFile } from 'child_process';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import nodeFetch from 'node-fetch'; // TODO: fetch vs node-fetch - better solution
import util from 'util';
import { PlayXSoundEvent } from './interfaces/events';

@Service()
class SoundsManager {
  async getFile(from: PlayXSoundEvent): Promise<string | null> {
    const url = new URL(from.soundUrl);
    const originName = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
    const oggName = `${originName.substring(0, originName.lastIndexOf('.'))}.ogg`;

    const destination = resolve('./downloads', oggName);
    const fileExists = fs.existsSync(destination);

    console.log(originName, ' => ', oggName, ' [', destination, ' ]');

    if (fileExists) { return destination; }

    // download
    const res = await nodeFetch(url);
    if (!res.body) { return null; }
    if (!fs.existsSync('downloads')) await fs.promises.mkdir('downloads');
    const originFile = resolve('./downloads', originName);
    const fileStream = fs.createWriteStream(originFile, { flags: 'wx' });

    try {
      await finished(Readable.from(res.body).pipe(fileStream));
    } catch (err) {
      console.log(err);
    }

    // convert
    if (!ffmpegPath) { return null; }
    const args = [
      '-i', originFile,
      '-acodec', 'libopus',
      '-f', 'opus',
      '-ar', '48000',
      '-ac', '2',
      destination,
    ];

    const asyncExec = util.promisify(execFile);
    try {
      await asyncExec(ffmpegPath, args);
    } catch (err) {
      console.log(err);
    }

    fs.unlinkSync(originFile);

    return destination;
  }
}

export { SoundsManager };