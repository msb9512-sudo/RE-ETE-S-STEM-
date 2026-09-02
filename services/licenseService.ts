
// Basit bir hash fonksiyonu
const generateHash = (input: string): string => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase();
};

const SECRET_SALT = "OTELPRO_ENTERPRISE_2024_SECRET_KEY";

// NOT: Gerçek bir sistemde bu URL sizin API adresiniz olur.
// Örn: https://lisans.siteniz.com/check/[machineId]
const REMOTE_LICENSE_URL = "https://api.otelpro.com/v1/license/check/"; 

export interface VerificationResult {
  isValid: boolean;
  expirationDate?: number;
  isExpired?: boolean;
}

export const verifyLicenseKey = (machineId: string, inputKey: string): VerificationResult => {
  if (!inputKey) return { isValid: false };
  const parts = inputKey.trim().toUpperCase().split('-');
  if (parts.length !== 3 || parts[0] !== 'LIS') return { isValid: false };

  const hexExpiry = parts[1];
  const inputSignature = parts[2];
  const expectedSignatureRaw = generateHash(machineId + hexExpiry + SECRET_SALT);
  const expectedSignature = expectedSignatureRaw.substring(0, 8);

  if (inputSignature !== expectedSignature) return { isValid: false };

  const expiryTimestamp = parseInt(hexExpiry, 16);
  return { 
    isValid: true, 
    isExpired: Date.now() > expiryTimestamp, 
    expirationDate: expiryTimestamp 
  };
};

/**
 * Uzaktan Lisans Kontrolü (Otomatik Yenileme İçin)
 * Bu fonksiyon bir sunucuya istek atar.
 */
export const checkRemoteLicenseStatus = async (machineId: string): Promise<string | null> => {
  try {
    // NOT: Burada gerçek bir fetch isteği simüle ediliyor.
    // Gerçekte: const response = await fetch(`${REMOTE_LICENSE_URL}${machineId}`);
    // Müşteriye sunduğunuz web arayüzünde yaptığınız güncellemeyi burası yakalar.
    
    // Simülasyon gereği: Yerel depolamada bir 'cloud_update' bekliyoruz.
    const cloudUpdate = localStorage.getItem(`remote_update_${machineId}`);
    if (cloudUpdate) {
      localStorage.removeItem(`remote_update_${machineId}`); // Bir kere işle
      return cloudUpdate; // Gelen değer yeni bir LIS-XXXX-XXXX anahtarıdır.
    }
    return null;
  } catch (error) {
    console.error("Lisans sunucusuna ulaşılamadı:", error);
    return null;
  }
};
