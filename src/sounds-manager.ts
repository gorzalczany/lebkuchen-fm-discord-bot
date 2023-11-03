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

    if (fileExists) {
      return destination;
    }

    const asyncUnlink = util.promisify(fs.unlink);

    // download
    console.log('File not exists. Downloading...');
    const res = await nodeFetch(url);
    if (!res.body) { return null; }
    if (!fs.existsSync('downloads')) await fs.promises.mkdir('downloads');
    const originFile = resolve('./downloads', originName);
    const fileStream = fs.createWriteStream(originFile, { flags: 'wx' });

    try {
      await finished(Readable.from(res.body).pipe(fileStream));
    } catch {
      console.log('error when downloading new sound');
      fileStream.close((err) => {
        if (err) { return; }
        asyncUnlink(originFile);
      });
      return null;
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
    } catch {
      console.log('error when converting new sound');
      return null;
    }

    await asyncUnlink(originFile).catch((_) => {
      console.log('error when deleting origin file');
    });

    return destination;
  }
}

export { SoundsManager };
