import { execSync } from 'node:child_process';
import fs from 'node:fs';

const seedFiles = fs
  .readdirSync(`${import.meta.dirname}`, { encoding: 'utf-8' })
  .filter((file) => file.endsWith('.sql'));

seedFiles.forEach((file) => {
  const frontCommand = 'npm run --prefix ../../ front';
  const cmd = `${frontCommand} -- db-execute -- --file=${resolve(file)}`
  console.log(`Run: ${file}`);
  execSync(cmd);
});

function resolve(file: string) {
  return `${import.meta.dirname}/${file}`;
}