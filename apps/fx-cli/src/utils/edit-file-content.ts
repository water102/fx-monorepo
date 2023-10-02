import fs from 'fs';

export const editFileContent = async (filePath: string, callback: (currentContent: string) => Promise<string>) => {
  const rawData = fs.readFileSync(filePath);
  const newContent = await callback(rawData.toString());
  fs.writeFileSync(filePath, newContent);
}