import { GoogleGenAI, Type } from "@google/genai";

// Helper for recipe suggestions using the recommended gemini-3-flash-preview model
export const generateRecipeSuggestion = async (dishName: string, inventoryList: string): Promise<any> => {
  // Always use the process.env.API_KEY directly for initialization as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Profesyonel bir otel mutfağı şefisin. "${dishName}" yemeği için standart bir reçete oluştur.
      
      Mevcut envanter listesi: ${inventoryList}
      
      Lütfen çıktıyı aşağıdaki JSON formatında ver. Miktarlar tek bir porsiyon içindir.
      Eğer malzeme envanter listesinde varsa, ismini tam olarak eşleştir. Yoksa genel ismini kullan.
      Birimler sadece şunlar olabilir: 'kg', 'lt', 'adet', 'gr', 'ml'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING, description: "Yemeğin kısa, iştah açıcı tanımı" },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  unit: { type: Type.STRING, enum: ['kg', 'lt', 'adet', 'gr', 'ml'] }
                }
              }
            },
            suggestedPrice: { type: Type.NUMBER, description: "Tahmini satış fiyatı (TL)" }
          }
        }
      }
    });
    
    // Access response.text directly (property, not a method)
    let text = response.text || '{}';
    // Remove Markdown code block markers if present
    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Recipe Error:", error);
    return {
      description: "Bağlantı hatası nedeniyle reçete oluşturulamadı.",
      suggestedPrice: 0,
      ingredients: []
    };
  }
};

// Analyze stock data and provide recommendations using gemini-3-flash-preview
export const analyzeStockAction = async (inventoryData: string): Promise<string> => {
  // Use the process.env.API_KEY directly for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Aşağıdaki otel envanter verilerini analiz et. Kritik seviyenin altında olan ürünleri vurgula ve satın alma önerilerinde bulun. Aşçıbaşına hitaben kısa, profesyonel bir rapor yaz.
      
      Veri: ${inventoryData}`,
    });
    // Access response.text as a property
    return response.text || "Analiz yanıtı boş.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Analiz sırasında bir hata oluştu. İnternet bağlantınızı kontrol edin.";
  }
};
