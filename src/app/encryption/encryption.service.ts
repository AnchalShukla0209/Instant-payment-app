import { Injectable } from '@angular/core';
import  CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  private readonly key = CryptoJS.enc.Utf8.parse('12345678901234567890123456789012'); // 32 bytes
  private readonly iv = CryptoJS.enc.Utf8.parse('1234567890123456'); // 16 bytes

  encrypt(value: any): string {
  let stringValue: string;

  if (typeof value === 'string') {
    stringValue = value;
  } else {
    stringValue = JSON.stringify(value);
  }

  const encrypted = CryptoJS.AES.encrypt(
    stringValue,
    this.key,
    {
      iv: this.iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }
  );

  return encrypted.toString();
}



decrypt(data: string): any {
  if (!data) return null;

  try {
    const decrypted = CryptoJS.AES.decrypt(data, this.key, {
      iv: this.iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedText) return null;

    // Try to parse as JSON, fallback to plain string
    try {
      return JSON.parse(decryptedText);
    } catch {
      return decryptedText; // not JSON, return as-is
    }

  } catch (e) {
    console.error('Decryption failed', e);
    return null;
  }
}




}
