type ZipInput = Record<string, string>;

const textEncoder = new TextEncoder();

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (let index = 0; index < bytes.length; index += 1) {
    crc ^= bytes[index];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(buffer: number[], value: number) {
  buffer.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(buffer: number[], value: number) {
  buffer.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function writeBytes(buffer: number[], bytes: Uint8Array | number[]) {
  for (const byte of bytes) buffer.push(byte);
}

function dosDateTime(date = new Date()) {
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate =
    ((date.getFullYear() - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();
  return { time, dosDate };
}

export function createZip(files: ZipInput) {
  const output: number[] = [];
  const centralDirectory: number[] = [];
  const now = dosDateTime();

  for (const [path, content] of Object.entries(files)) {
    const normalizedPath = path.replace(/^\/+/, '');
    const fileName = textEncoder.encode(normalizedPath);
    const fileBytes = textEncoder.encode(content);
    const checksum = crc32(fileBytes);
    const localHeaderOffset = output.length;

    writeUint32(output, 0x04034b50);
    writeUint16(output, 20);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint16(output, now.time);
    writeUint16(output, now.dosDate);
    writeUint32(output, checksum);
    writeUint32(output, fileBytes.length);
    writeUint32(output, fileBytes.length);
    writeUint16(output, fileName.length);
    writeUint16(output, 0);
    writeBytes(output, fileName);
    writeBytes(output, fileBytes);

    writeUint32(centralDirectory, 0x02014b50);
    writeUint16(centralDirectory, 20);
    writeUint16(centralDirectory, 20);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, now.time);
    writeUint16(centralDirectory, now.dosDate);
    writeUint32(centralDirectory, checksum);
    writeUint32(centralDirectory, fileBytes.length);
    writeUint32(centralDirectory, fileBytes.length);
    writeUint16(centralDirectory, fileName.length);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint32(centralDirectory, 0);
    writeUint32(centralDirectory, localHeaderOffset);
    writeBytes(centralDirectory, fileName);
  }

  const centralDirectoryOffset = output.length;
  writeBytes(output, centralDirectory);

  writeUint32(output, 0x06054b50);
  writeUint16(output, 0);
  writeUint16(output, 0);
  writeUint16(output, Object.keys(files).length);
  writeUint16(output, Object.keys(files).length);
  writeUint32(output, centralDirectory.length);
  writeUint32(output, centralDirectoryOffset);
  writeUint16(output, 0);

  return new Blob([new Uint8Array(output)], { type: 'application/zip' });
}

export function downloadZip(files: ZipInput, fileName: string) {
  const blob = createZip(files);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.zip') ? fileName : `${fileName}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
