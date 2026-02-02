import { Linking, Platform, Alert } from 'react-native';

export type ShareMethod = 'sms' | 'whatsapp';

export const openSMS = async (message: string, phoneNumber?: string): Promise<void> => {
  try {
    const encodedMessage = encodeURIComponent(message);

    let url: string;
    // Both iOS and Android use ? before body parameter
    if (phoneNumber) {
      url = `sms:${phoneNumber}?body=${encodedMessage}`;
    } else {
      url = `sms:?body=${encodedMessage}`;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Cannot open SMS app. Please check your device settings.');
    }
  } catch (error) {
    console.error('Error opening SMS:', error);
    Alert.alert('Error', 'Failed to open SMS app. Please try again.');
  }
};

export const openWhatsApp = async (message: string, phoneNumber?: string): Promise<void> => {
  try {
    const encodedMessage = encodeURIComponent(message);

    // WhatsApp deep link format: whatsapp://send?text=MESSAGE
    // For specific phone: whatsapp://send?phone=COUNTRY_CODE_PHONE&text=MESSAGE
    let url: string;
    if (phoneNumber) {
      // Remove spaces, dashes, and add country code if missing
      const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
      const phoneWithCode = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`;
      url = `whatsapp://send?phone=${phoneWithCode}&text=${encodedMessage}`;
    } else {
      url = `whatsapp://send?text=${encodedMessage}`;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      // Fallback: Try web.whatsapp.com (works without LSApplicationQueriesSchemes)
      const webUrl = phoneNumber
        ? `https://wa.me/${phoneNumber.replace(/[\s-+]/g, '')}?text=${encodedMessage}`
        : `https://api.whatsapp.com/send?text=${encodedMessage}`;

      await Linking.openURL(webUrl);
    }
  } catch (error) {
    console.error('Error opening WhatsApp:', error);
    Alert.alert(
      'Cannot Open WhatsApp',
      'Please make sure WhatsApp is installed on your device.',
      [{ text: 'OK' }]
    );
  }
};

export const shareBalance = async (
  method: ShareMethod,
  message: string,
  phoneNumber?: string
): Promise<void> => {
  if (method === 'sms') {
    await openSMS(message, phoneNumber);
  } else {
    await openWhatsApp(message, phoneNumber);
  }
};
