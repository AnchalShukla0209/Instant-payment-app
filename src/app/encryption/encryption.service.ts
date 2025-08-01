import { Injectable } from '@angular/core';
import  CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  private readonly key = CryptoJS.enc.Utf8.parse('12345678901234567890123456789012'); // 32 bytes
  private readonly iv = CryptoJS.enc.Utf8.parse('1234567890123456'); // 16 bytes

  encrypt(value: any): string {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(value),
      this.key,
      {
        iv: this.iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    return encrypted.toString(); // base64
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
      return JSON.parse(decryptedText);  // Parsed object: like { Token: ..., Username: ..., ... }
    } catch (e) {
      console.error('Decryption failed', e);
      return null;
    }
  }



}
