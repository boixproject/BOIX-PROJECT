/**
 * Decodes a base64 string into a Uint8Array.
 */
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM data (Int16) OR a WAV file (ArrayBuffer) into an AudioBuffer.
 * Smartly detects RIFF WAV headers to strip them, preventing static noise/glitches.
 */
export async function decodeAudioData(
  data: Uint8Array | ArrayBuffer,
  ctx: AudioContext | OfflineAudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const bufferData = data instanceof Uint8Array ? data.buffer : data;
  
  let currentSampleRate = sampleRate;
  let currentNumChannels = numChannels;
  let pcmOffset = 0;

  const view = new DataView(bufferData);

  if (view.byteLength >= 44 && view.getUint32(0) === 0x52494646 && view.getUint32(8) === 0x57415645) {
    currentNumChannels = view.getUint16(22, true);
    currentSampleRate = view.getUint32(24, true);
    
    let pos = 12;
    while (pos < view.byteLength - 8) {
      const chunkId = view.getUint32(pos);
      if (chunkId === 0x64617461) { // "data"
        pcmOffset = pos + 8;
        break;
      }
      const chunkSize = view.getUint32(pos + 4, true);
      pos += 8 + chunkSize;
    }
    
    if (pcmOffset === 0) pcmOffset = 44;
  }

  const pcmData = bufferData.slice(pcmOffset);
  const dataInt16 = new Int16Array(pcmData);
  
  if (dataInt16.length === 0) {
      throw new Error("Audio data is empty");
  }

  const frameCount = dataInt16.length / currentNumChannels;
  const buffer = ctx.createBuffer(currentNumChannels, frameCount, currentSampleRate);

  for (let channel = 0; channel < currentNumChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * currentNumChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Applies "Cinematic" EQ and Compression to the audio.
 */
export async function applyAudioEnhancement(inputBuffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(
    inputBuffer.numberOfChannels,
    inputBuffer.length,
    inputBuffer.sampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = inputBuffer;

  const bassFilter = offlineCtx.createBiquadFilter();
  bassFilter.type = 'lowshelf';
  bassFilter.frequency.value = 120; 
  bassFilter.gain.value = 6;

  const trebleFilter = offlineCtx.createBiquadFilter();
  trebleFilter.type = 'highshelf';
  trebleFilter.frequency.value = 8000;
  trebleFilter.gain.value = 2;

  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 30;
  compressor.ratio.value = 12;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;

  source.connect(bassFilter);
  bassFilter.connect(trebleFilter);
  trebleFilter.connect(compressor);
  compressor.connect(offlineCtx.destination);

  source.start();

  return await offlineCtx.startRendering();
}

/**
 * Processes an AudioBuffer using a more robust SOLA (Synchronized Overlap-Add) 
 * for high-quality speed changes, now with cross-correlation for accuracy.
 */
export async function processAudioSpeed(audioBuffer: AudioBuffer, speed: number): Promise<AudioBuffer> {
  if (speed === 1.0) return audioBuffer;

  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;

  const windowSizeMs = 0.04;
  const overlapMs = 0.02;
  // FIX: Reduced search range to prevent the algorithm from finding a trivial
  // match with the current segment, which caused non-integer speed factors to fail.
  const searchMs = 0.008;
  
  const windowSize = Math.floor(sampleRate * windowSizeMs);
  const overlap = Math.floor(sampleRate * overlapMs);
  const searchRange = Math.floor(sampleRate * searchMs);
  
  const synthesisHop = overlap; 
  const targetAnalysisHop = Math.floor(synthesisHop * speed);

  const estimatedLength = Math.ceil(audioBuffer.length / speed);
  const safetyMargin = Math.ceil(estimatedLength * 0.2) + (sampleRate * 5);
  const maxBufferLength = estimatedLength + safetyMargin;
  
  const tempBuffer = new AudioBuffer({
    length: maxBufferLength,
    numberOfChannels: numChannels,
    sampleRate: sampleRate
  });

  const hanningWindow = new Float32Array(windowSize);
  for (let i = 0; i < windowSize; i++) {
    hanningWindow[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (windowSize - 1)));
  }

  const inputChannels: Float32Array[] = [];
  const outputChannels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    inputChannels.push(audioBuffer.getChannelData(c));
    outputChannels.push(tempBuffer.getChannelData(c));
  }

  let inputOffset = 0;
  let outputOffset = 0;
  const inputData = inputChannels[0]; // Use first channel for correlation analysis

  while (outputOffset + windowSize < maxBufferLength && inputOffset + windowSize < inputData.length) {
    
    for (let c = 0; c < numChannels; c++) {
      const inp = inputChannels[c];
      const out = outputChannels[c];
      for (let i = 0; i < windowSize; i++) {
        out[outputOffset + i] += inp[inputOffset + i] * hanningWindow[i];
      }
    }

    const naturalPos = inputOffset + synthesisHop;
    const approxNextInputPos = inputOffset + targetAnalysisHop;
    const searchStart = Math.max(0, approxNextInputPos - searchRange);
    const searchEnd = Math.min(inputData.length - windowSize, approxNextInputPos + searchRange);
    
    let bestOffset = approxNextInputPos;
    let maxCorrelation = -1;

    // More robust cross-correlation search
    for (let t = searchStart; t <= searchEnd; t++) { 
      let correlation = 0;
      for (let j = 0; j < overlap; j++) {
         correlation += inputData[naturalPos + j] * inputData[t + j];
      }
      
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestOffset = t;
      }
    }

    inputOffset = bestOffset;
    outputOffset += synthesisHop;
  }

  const finalLength = outputOffset + windowSize;
  const resultBuffer = new AudioBuffer({
    length: finalLength,
    numberOfChannels: numChannels,
    sampleRate: sampleRate
  });

  for (let c = 0; c < numChannels; c++) {
    const resultData = resultBuffer.getChannelData(c);
    const tempData = tempBuffer.getChannelData(c);
    resultData.set(tempData.subarray(0, finalLength));
  }

  return resultBuffer;
}

/**
 * Converts an AudioBuffer (Float32) back to a WAV Blob (Int16).
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;
  
  let result: Float32Array;
  if (numChannels === 2) {
    const inputL = buffer.getChannelData(0);
    const inputR = buffer.getChannelData(1);
    const length = inputL.length + inputR.length;
    result = new Float32Array(length);
    let index = 0, inputIndex = 0;
    while (index < length) {
      result[index++] = inputL[inputIndex];
      result[index++] = inputR[inputIndex];
      inputIndex++;
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  const wavBuffer = new ArrayBuffer(44 + result.length * bytesPerSample);
  const view = new DataView(wavBuffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + result.length * bytesPerSample, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, result.length * bytesPerSample, true);

  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  // FIX: Pass the underlying ArrayBuffer, not the DataView, to the Blob constructor.
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Formats seconds into a "mm:ss" string for the audio player.
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}