import { existsSync, statSync } from "fs";
import { dirname, join } from "path";

export function getPathToDirectory(directoryName: string) {
  let currentDirectory = process.cwd();

  while (true) {
    const directoryPath = join(currentDirectory, directoryName);

    if (existsSync(directoryPath) && statSync(directoryPath).isDirectory()) {
      return directoryPath;
    }

    if (dirname(currentDirectory) === currentDirectory) {
      return null;
    }
    currentDirectory = dirname(currentDirectory);
  }
}

export function dayIsInThePass(date: Date | null) {
  const today = new Date();
  today.setHours(12);

  return !!date ? today.getTime() > date.getTime() : true;
}