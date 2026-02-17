// Complete i18n translations for Abe & Tina Avatar Concierge — 14 languages

export type LangCode = 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml' | 'es' | 'fr' | 'de' | 'ar' | 'zh' | 'ja' | 'pt' | 'ru'

export interface LanguageOption {
  code: LangCode
  name: string
  native: string
  flag: string
  rtl?: boolean
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
]

export interface Greetings {
  morning: string
  afternoon: string
  evening: string
  night: string
}

export interface Translations {
  greetings: Greetings
  welcomeMessage: string
  yesHelp: string
  noThanks: string
  dismissMessage: string
  chooseLang: string
  detectedForYou: string
  switchingTo: string
  capabilitiesIntro: string
  capabilities: string[]
  abeInputPrompt: string
  quickActions: string[]
  askName: string
  niceToMeet: string
  typeOrSpeak: string
  listening: string
  thinking: string
  disclaimer: string
  privacyPolicy: string
  needHelp: string
  welcomeBack: string
  nightGreeting: string
  idleNudge: string
  scrollNudge: string
  formHelp: string
  talkToHuman: string
  outOfScope: string
}

const translations: Record<LangCode, Translations> = {
  en: {
    greetings: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', night: 'Good evening' },
    welcomeMessage: "Welcome to GHL India Ventures. I'm Abe, and this is my colleague Tina. If you're seeing us right now, you've already made the right choice by visiting this site. We're here to help you make your next smart move. Would you like our help exploring the site?",
    yesHelp: "Yes, I'd love your help!",
    noThanks: "No thanks, I'll browse",
    dismissMessage: "No problem! We're right here if you need us.",
    chooseLang: 'Choose Your Preferred Language',
    detectedForYou: 'Detected for you',
    switchingTo: 'No problem! Switching to',
    capabilitiesIntro: "Wonderful! Think of us as your personal investment guides — like family looking out for you. Here's how we can help:",
    capabilities: [
      '📖 READ & TRANSLATE — Select any paragraph and I\'ll read it aloud in your language.',
      '💡 EXPLAIN & SIMPLIFY — Confused by investment terms? Just ask and we\'ll break it down.',
      '💰 INVESTMENT ADVISOR — Tell us your goals and we\'ll recommend the right plan.',
      '📝 FORM ASSISTANT — We\'ll walk you through the consultation form step by step.',
      '🗺️ SITE NAVIGATOR — Tell us where to go and we\'ll take you there instantly.',
      '📰 BLOG READER — We can read any blog post aloud in your language.',
      '🧮 CALCULATOR GUIDE — We\'ll help you use the investment tools.',
    ],
    abeInputPrompt: "Type in the box below, or tap the microphone and just speak to us naturally. We understand both! What would you like to do first?",
    quickActions: ['🏠 Show me around', '💰 Help me invest', '📖 Read this page', '🧮 Risk quiz', '📞 Talk to a human', '❓ Ask a question'],
    askName: "By the way, what should I call you?",
    niceToMeet: "Wonderful to meet you",
    typeOrSpeak: 'Type or speak your message...',
    listening: 'Listening...',
    thinking: 'is thinking',
    disclaimer: 'Not financial advice',
    privacyPolicy: 'Privacy Policy',
    needHelp: 'Need help?',
    welcomeBack: "Welcome back! Last time you were exploring our site. Pick up where you left off?",
    nightGreeting: "Burning the midnight oil? We appreciate your dedication to smart investing!",
    idleNudge: "I see you're reading this page. Any questions I can help with?",
    scrollNudge: "That was a lot of information! Want me to summarize the key points?",
    formHelp: "Don't worry — it's just a consultation request, not a commitment.",
    talkToHuman: "Of course! Our office hours are Mon-Sat, 10 AM - 6 PM IST. Call +91 7200 255 252 or WhatsApp us.",
    outOfScope: "Great question! Let me connect you with our human team for the best answer.",
  },
  hi: {
    greetings: { morning: 'शुभ प्रभात', afternoon: 'नमस्कार', evening: 'शुभ संध्या', night: 'शुभ रात्रि' },
    welcomeMessage: "GHL इंडिया वेंचर्स में आपका स्वागत है। मैं एबे हूँ, और ये मेरी सहयोगी टीना हैं। अगर आप अभी हमें देख रहे हैं, तो आपने सही जगह आकर अच्छा किया। हम आपकी मदद के लिए यहाँ हैं। क्या आप चाहेंगे कि हम साइट दिखाएँ?",
    yesHelp: 'हाँ, मुझे मदद चाहिए!',
    noThanks: 'नहीं, मैं खुद देखूँगा',
    dismissMessage: 'कोई बात नहीं! हम यहीं हैं अगर कुछ चाहिए।',
    chooseLang: 'अपनी भाषा चुनें',
    detectedForYou: 'आपके लिए पहचानी गई',
    switchingTo: 'बिल्कुल! बदल रहे हैं',
    capabilitiesIntro: 'बहुत अच्छा! हमें अपना निवेश मार्गदर्शक समझिए — जैसे परिवार का कोई अपना। यहाँ देखिए हम कैसे मदद कर सकते हैं:',
    capabilities: [
      '📖 पढ़ें और अनुवाद करें — कोई भी पैराग्राफ चुनें, हम पढ़कर सुनाएंगे।',
      '💡 समझाएँ — निवेश की बातें उलझन भरी लगें? बस पूछिए।',
      '💰 निवेश सलाह — अपने लक्ष्य बताइए, हम सही योजना सुझाएंगे।',
      '📝 फॉर्म सहायता — हम फॉर्म भरने में कदम-कदम साथ देंगे।',
      '🗺️ साइट नेविगेशन — बताइए कहाँ जाना है, हम ले चलेंगे।',
      '📰 ब्लॉग पढ़ें — कोई भी लेख हम आपकी भाषा में पढ़ सकते हैं।',
      '🧮 कैलकुलेटर गाइड — निवेश टूल्स इस्तेमाल करने में मदद।',
    ],
    abeInputPrompt: 'नीचे टाइप करें या माइक दबाकर बोलें — हम दोनों समझते हैं! पहले क्या करना चाहेंगे?',
    quickActions: ['🏠 साइट दिखाओ', '💰 निवेश करें', '📖 यह पेज पढ़ें', '🧮 रिस्क क्विज़', '📞 इंसान से बात', '❓ सवाल पूछें'],
    askName: 'वैसे, मैं आपको क्या कहकर बुलाऊँ?',
    niceToMeet: 'आपसे मिलकर बहुत अच्छा लगा',
    typeOrSpeak: 'टाइप करें या बोलें...',
    listening: 'सुन रहे हैं...',
    thinking: 'सोच रहे हैं',
    disclaimer: 'वित्तीय सलाह नहीं',
    privacyPolicy: 'गोपनीयता नीति',
    needHelp: 'मदद चाहिए?',
    welcomeBack: 'वापस आने पर स्वागत है! पिछली बार आप साइट देख रहे थे।',
    nightGreeting: 'रात को जाग रहे हैं? आपकी लगन की तारीफ करनी होगी!',
    idleNudge: 'मैं देख रहा हूँ आप यह पेज पढ़ रहे हैं। कोई सवाल है?',
    scrollNudge: 'बहुत सारी जानकारी! क्या मैं मुख्य बातें बताऊँ?',
    formHelp: 'चिंता न करें — यह बस एक पूछताछ है, कोई बंधन नहीं।',
    talkToHuman: 'बिल्कुल! कार्यालय समय: सोम-शनि, सुबह 10 - शाम 6 IST। कॉल करें: +91 7200 255 252',
    outOfScope: 'अच्छा सवाल! इसके लिए हमारी टीम से बात करें।',
  },
  ta: {
    greetings: { morning: 'காலை வணக்கம்', afternoon: 'மதிய வணக்கம்', evening: 'மாலை வணக்கம்', night: 'இனிய இரவு' },
    welcomeMessage: "GHL இந்தியா வென்ச்சர்ஸ்-க்கு வரவேற்கிறோம். நான் ஏப், இது என் சகாவி டினா. நீங்கள் இங்கே வந்தது மிகச் சரியான முடிவு. உங்கள் அடுத்த புத்திசாலித்தனமான நடவடிக்கைக்கு நாங்கள் உதவ உள்ளோம். எங்கள் உதவி வேண்டுமா?",
    yesHelp: 'ஆம், உதவுங்கள்!',
    noThanks: 'வேண்டாம், நானே பார்க்கிறேன்',
    dismissMessage: 'பரவாயில்லை! தேவைப்பட்டால் இங்கே இருக்கிறோம்.',
    chooseLang: 'உங்கள் மொழியைத் தேர்ந்தெடுங்கள்',
    detectedForYou: 'உங்களுக்காக கண்டறியப்பட்டது',
    switchingTo: 'சரி! மாற்றுகிறோம்',
    capabilitiesIntro: 'அருமை! எங்களை உங்கள் சொந்த குடும்ப முதலீட்டு ஆலோசகர்களாக நினைக்கவும். நாங்கள் எப்படி உதவ முடியும்:',
    capabilities: [
      '📖 படிக்கவும் மொழிபெயர்க்கவும் — எந்த பத்தியையும் தேர்ந்தெடுங்கள்.',
      '💡 விளக்குவோம் — முதலீட்டு சொற்கள் குழப்பமா? கேளுங்கள்.',
      '💰 முதலீட்டு ஆலோசனை — உங்கள் இலக்குகளைச் சொல்லுங்கள்.',
      '📝 படிவ உதவி — படிவம் நிரப்ப உதவுவோம்.',
      '🗺️ தள வழிகாட்டி — எங்கு செல்ல வேண்டும் என்று சொல்லுங்கள்.',
      '📰 வலைப்பதிவு படிப்போம் — எந்த கட்டுரையையும் படிக்கலாம்.',
      '🧮 கணக்கி வழிகாட்டி — முதலீட்டு கருவிகள் பயன்படுத்த உதவி.',
    ],
    abeInputPrompt: 'கீழே தட்டச்சு செய்யுங்கள் அல்லது மைக் அழுத்தி பேசுங்கள்! முதலில் என்ன செய்ய விரும்புகிறீர்கள்?',
    quickActions: ['🏠 சுற்றிக் காட்டு', '💰 முதலீடு', '📖 இதைப் படி', '🧮 ரிஸ்க் குவிஸ்', '📞 மனிதரிடம் பேசு', '❓ கேள்வி கேளு'],
    askName: 'சொல்லுங்கள், நான் உங்களை என்ன அழைக்கலாம்?',
    niceToMeet: 'உங்களைச் சந்தித்ததில் மகிழ்ச்சி',
    typeOrSpeak: 'தட்டச்சு செய்யுங்கள் அல்லது பேசுங்கள்...',
    listening: 'கேட்கிறோம்...',
    thinking: 'யோசிக்கிறார்',
    disclaimer: 'நிதி ஆலோசனை அல்ல',
    privacyPolicy: 'தனியுரிமைக் கொள்கை',
    needHelp: 'உதவி வேண்டுமா?',
    welcomeBack: 'மீண்டும் வரவேற்கிறோம்!',
    nightGreeting: 'இரவில் விழித்திருக்கிறீர்களா? உங்கள் அர்ப்பணிப்புக்கு நன்றி!',
    idleNudge: 'இந்தப் பக்கத்தைப் படிக்கிறீர்கள் என்று பார்க்கிறேன். ஏதாவது கேள்வி?',
    scrollNudge: 'நிறைய தகவல்கள்! முக்கிய புள்ளிகளை சுருக்கமாக சொல்லவா?',
    formHelp: 'கவலை வேண்டாம் — இது ஒரு ஆலோசனை கோரிக்கை மட்டுமே.',
    talkToHuman: 'நிச்சயமாக! அலுவலக நேரம்: திங்கள்-சனி, காலை 10 - மாலை 6. அழைக்கவும்: +91 7200 255 252',
    outOfScope: 'நல்ல கேள்வி! இதற்கு எங்கள் குழுவிடம் பேசுங்கள்.',
  },
  te: {
    greetings: { morning: 'శుభోదయం', afternoon: 'శుభ మధ్యాహ్నం', evening: 'శుభ సాయంత్రం', night: 'శుభ రాత్రి' },
    welcomeMessage: "GHL ఇండియా వెంచర్స్‌కు స్వాగతం. నేను ఏబ్, ఇది నా సహోద్యోగి టీనా. మీరు ఇక్కడకు రావడం మంచి నిర్ణయం. మీకు సహాయం కావాలా?",
    yesHelp: 'అవును, సహాయం కావాలి!', noThanks: 'వద్దు, నేనే చూస్తాను',
    dismissMessage: 'పర్వాలేదు! అవసరమైతే ఇక్కడే ఉన్నాము.',
    chooseLang: 'మీ భాషను ఎంచుకోండి', detectedForYou: 'మీ కోసం గుర్తించబడింది',
    switchingTo: 'సరే! మారుస్తున్నాము',
    capabilitiesIntro: 'అద్భుతం! మమ్మల్ని మీ సొంత కుటుంబ పెట్టుబడి సలహాదారులుగా భావించండి.',
    capabilities: ['📖 చదవండి & అనువదించండి', '💡 వివరించు & సరళీకరించు', '💰 పెట్టుబడి సలహాదారు', '📝 ఫారం సహాయం', '🗺️ సైట్ నావిగేటర్', '📰 బ్లాగ్ రీడర్', '🧮 కాలిక్యులేటర్ గైడ్'],
    abeInputPrompt: 'టైప్ చేయండి లేదా మైక్ నొక్కి మాట్లాడండి!', quickActions: ['🏠 చూపించు', '💰 పెట్టుబడి', '📖 చదువు', '🧮 క్విజ్', '📞 మానవుడితో', '❓ అడగు'],
    askName: 'మిమ్మల్ని ఏమని పిలవాలి?', niceToMeet: 'కలిసినందుకు సంతోషం',
    typeOrSpeak: 'టైప్ చేయండి లేదా మాట్లాడండి...', listening: 'వింటున్నాము...', thinking: 'ఆలోచిస్తున్నారు',
    disclaimer: 'ఆర్థిక సలహా కాదు', privacyPolicy: 'గోప్యతా విధానం', needHelp: 'సహాయం కావాలా?',
    welcomeBack: 'తిరిగి స్వాగతం!', nightGreeting: 'రాత్రి మేల్కొని ఉన్నారా? మీ అంకితభావానికి అభినందనలు!',
    idleNudge: 'ఈ పేజీ చదువుతున్నారు. ప్రశ్నలు ఉన్నాయా?', scrollNudge: 'చాలా సమాచారం! కీలక అంశాలు చెప్పమంటారా?',
    formHelp: 'ఆందోళన వద్దు — ఇది కేవలం సంప్రదింపు అభ్యర్థన.',
    talkToHuman: 'తప్పకుండా! కాల్ చేయండి: +91 7200 255 252',
    outOfScope: 'మంచి ప్రశ్న! మా బృందంతో మాట్లాడండి.',
  },
  kn: {
    greetings: { morning: 'ಶುಭೋದಯ', afternoon: 'ಶುಭ ಮಧ್ಯಾಹ್ನ', evening: 'ಶುಭ ಸಂಜೆ', night: 'ಶುಭ ರಾತ್ರಿ' },
    welcomeMessage: "GHL ಇಂಡಿಯಾ ವೆಂಚರ್ಸ್‌ಗೆ ಸ್ವಾಗತ. ನಾನು ಏಬ್, ಇವರು ನನ್ನ ಸಹೋದ್ಯೋಗಿ ಟೀನಾ. ನಿಮಗೆ ಸಹಾಯ ಬೇಕೇ?",
    yesHelp: 'ಹೌದು, ಸಹಾಯ ಬೇಕು!', noThanks: 'ಬೇಡ, ನಾನೇ ನೋಡುತ್ತೇನೆ',
    dismissMessage: 'ಪರವಾಗಿಲ್ಲ! ಬೇಕಾದಾಗ ಇಲ್ಲಿದ್ದೇವೆ.',
    chooseLang: 'ನಿಮ್ಮ ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ', detectedForYou: 'ನಿಮಗಾಗಿ ಗುರುತಿಸಲಾಗಿದೆ',
    switchingTo: 'ಸರಿ! ಬದಲಾಯಿಸುತ್ತಿದ್ದೇವೆ',
    capabilitiesIntro: 'ಅದ್ಭುತ! ನಮ್ಮನ್ನು ನಿಮ್ಮ ಕುಟುಂಬದ ಹೂಡಿಕೆ ಸಲಹೆಗಾರರೆಂದು ಭಾವಿಸಿ.',
    capabilities: ['📖 ಓದಿ & ಅನುವಾದಿಸಿ', '💡 ವಿವರಿಸಿ', '💰 ಹೂಡಿಕೆ ಸಲಹೆ', '📝 ಫಾರ್ಮ್ ಸಹಾಯ', '🗺️ ಸೈಟ್ ನ್ಯಾವಿಗೇಟರ್', '📰 ಬ್ಲಾಗ್ ರೀಡರ್', '🧮 ಕ್ಯಾಲ್ಕುಲೇಟರ್'],
    abeInputPrompt: 'ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮೈಕ್ ಒತ್ತಿ ಮಾತನಾಡಿ!', quickActions: ['🏠 ತೋರಿಸಿ', '💰 ಹೂಡಿಕೆ', '📖 ಓದಿ', '🧮 ಕ್ವಿಜ್', '📞 ಮಾನವರೊಂದಿಗೆ', '❓ ಕೇಳಿ'],
    askName: 'ನಿಮ್ಮನ್ನು ಏನೆಂದು ಕರೆಯಲಿ?', niceToMeet: 'ನಿಮ್ಮನ್ನು ಭೇಟಿಯಾಗಿ ಸಂತೋಷ',
    typeOrSpeak: 'ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮಾತನಾಡಿ...', listening: 'ಕೇಳುತ್ತಿದ್ದೇವೆ...', thinking: 'ಯೋಚಿಸುತ್ತಿದ್ದಾರೆ',
    disclaimer: 'ಆರ್ಥಿಕ ಸಲಹೆ ಅಲ್ಲ', privacyPolicy: 'ಗೌಪ್ಯತಾ ನೀತಿ', needHelp: 'ಸಹಾಯ ಬೇಕೇ?',
    welcomeBack: 'ಮರಳಿ ಸ್ವಾಗತ!', nightGreeting: 'ರಾತ್ರಿ ಎಚ್ಚರವಾಗಿದ್ದೀರಾ?',
    idleNudge: 'ಈ ಪುಟ ಓದುತ್ತಿದ್ದೀರಿ. ಪ್ರಶ್ನೆಗಳಿವೆಯೇ?', scrollNudge: 'ಸಾಕಷ್ಟು ಮಾಹಿತಿ! ಮುಖ್ಯ ಅಂಶಗಳು ಹೇಳಲೇ?',
    formHelp: 'ಚಿಂತಿಸಬೇಡಿ — ಇದು ಕೇವಲ ಸಮಾಲೋಚನೆ ವಿನಂತಿ.',
    talkToHuman: 'ಖಂಡಿತ! ಕರೆ ಮಾಡಿ: +91 7200 255 252',
    outOfScope: 'ಒಳ್ಳೆಯ ಪ್ರಶ್ನೆ! ನಮ್ಮ ತಂಡದೊಂದಿಗೆ ಮಾತನಾಡಿ.',
  },
  ml: {
    greetings: { morning: 'സുപ്രഭാതം', afternoon: 'ശുഭ ഉച്ചതിരിഞ്ഞ്', evening: 'ശുഭ സന്ധ്യ', night: 'ശുഭ രാത്രി' },
    welcomeMessage: "GHL ഇന്ത്യ വെഞ്ചേഴ്സിലേക്ക് സ്വാഗതം. ഞാൻ ഏബ്, ഇത് എന്റെ സഹപ്രവർത്തക ടീന. നിങ്ങൾക്ക് സഹായം വേണോ?",
    yesHelp: 'അതെ, സഹായിക്കൂ!', noThanks: 'വേണ്ട, ഞാൻ നോക്കാം',
    dismissMessage: 'സാരമില്ല! ആവശ്യമുള്ളപ്പോൾ ഇവിടെയുണ്ട്.',
    chooseLang: 'നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക', detectedForYou: 'നിങ്ങൾക്കായി കണ്ടെത്തി',
    switchingTo: 'ശരി! മാറ്റുന്നു',
    capabilitiesIntro: 'അതിശയം! ഞങ്ങളെ നിങ്ങളുടെ കുടുംബ നിക്ഷേപ ഉപദേഷ്ടാക്കളായി കരുതൂ.',
    capabilities: ['📖 വായിക്കുക & വിവർത്തനം', '💡 വിശദീകരിക്കുക', '💰 നിക്ഷേപ ഉപദേശം', '📝 ഫോം സഹായം', '🗺️ സൈറ്റ് നാവിഗേറ്റർ', '📰 ബ്ലോഗ് റീഡർ', '🧮 കാൽക്കുലേറ്റർ'],
    abeInputPrompt: 'ടൈപ്പ് ചെയ്യുക അല്ലെങ്കിൽ മൈക്ക് അമർത്തി സംസാരിക്കുക!', quickActions: ['🏠 കാണിക്കൂ', '💰 നിക്ഷേപം', '📖 വായിക്കൂ', '🧮 ക്വിസ്', '📞 മനുഷ്യനോട്', '❓ ചോദിക്കൂ'],
    askName: 'എന്ത് വിളിക്കണം?', niceToMeet: 'കണ്ടതിൽ സന്തോഷം',
    typeOrSpeak: 'ടൈപ്പ് ചെയ്യുക അല്ലെങ്കിൽ സംസാരിക്കുക...', listening: 'കേൾക്കുന്നു...', thinking: 'ചിന്തിക്കുന്നു',
    disclaimer: 'സാമ്പത്തിക ഉപദേശമല്ല', privacyPolicy: 'സ്വകാര്യതാ നയം', needHelp: 'സഹായം വേണോ?',
    welcomeBack: 'തിരിച്ചു സ്വാഗതം!', nightGreeting: 'രാത്രി ഉണർന്നിരിക്കുകയാണോ?',
    idleNudge: 'ഈ പേജ് വായിക്കുകയാണ്. ചോദ്യങ്ങളുണ്ടോ?', scrollNudge: 'ധാരാളം വിവരങ്ങൾ! പ്രധാന കാര്യങ്ങൾ ചുരുക്കട്ടെ?',
    formHelp: 'വിഷമിക്കേണ്ട — ഒരു കൂടിക്കാഴ്ച അഭ്യർത്ഥന മാത്രം.',
    talkToHuman: 'തീർച്ചയായും! വിളിക്കൂ: +91 7200 255 252',
    outOfScope: 'നല്ല ചോദ്യം! ഞങ്ങളുടെ ടീമിനോട് സംസാരിക്കൂ.',
  },
  es: {
    greetings: { morning: 'Buenos días', afternoon: 'Buenas tardes', evening: 'Buenas tardes', night: 'Buenas noches' },
    welcomeMessage: "Bienvenido a GHL India Ventures. Soy Abe y esta es mi colega Tina. Ha tomado una buena decisión al visitar nuestro sitio. ¿Le gustaría nuestra ayuda?",
    yesHelp: '¡Sí, me encantaría!', noThanks: 'No gracias, prefiero explorar',
    dismissMessage: '¡No hay problema! Estamos aquí si nos necesita.',
    chooseLang: 'Elija su idioma', detectedForYou: 'Detectado para usted',
    switchingTo: '¡Perfecto! Cambiando a',
    capabilitiesIntro: '¡Maravilloso! Piense en nosotros como sus guías personales de inversión.',
    capabilities: ['📖 LEER Y TRADUCIR', '💡 EXPLICAR Y SIMPLIFICAR', '💰 ASESOR DE INVERSIÓN', '📝 ASISTENTE DE FORMULARIOS', '🗺️ NAVEGADOR DEL SITIO', '📰 LECTOR DE BLOG', '🧮 GUÍA DE CALCULADORA'],
    abeInputPrompt: '¡Escriba abajo o toque el micrófono y háblenos!', quickActions: ['🏠 Tour', '💰 Invertir', '📖 Leer', '🧮 Quiz', '📞 Humano', '❓ Preguntar'],
    askName: '¿Cómo le llamo?', niceToMeet: 'Encantado de conocerle',
    typeOrSpeak: 'Escriba o hable...', listening: 'Escuchando...', thinking: 'está pensando',
    disclaimer: 'No es asesoría financiera', privacyPolicy: 'Política de privacidad', needHelp: '¿Necesita ayuda?',
    welcomeBack: '¡Bienvenido de nuevo!', nightGreeting: '¿Trabajando tarde? ¡Apreciamos su dedicación!',
    idleNudge: 'Veo que está leyendo esta página. ¿Alguna pregunta?', scrollNudge: '¡Mucha información! ¿Resumo los puntos clave?',
    formHelp: 'No se preocupe — es solo una consulta.', talkToHuman: '¡Por supuesto! Llame: +91 7200 255 252',
    outOfScope: '¡Buena pregunta! Hable con nuestro equipo.',
  },
  fr: {
    greetings: { morning: 'Bonjour', afternoon: 'Bon après-midi', evening: 'Bonsoir', night: 'Bonne nuit' },
    welcomeMessage: "Bienvenue chez GHL India Ventures. Je suis Abe, et voici ma collègue Tina. Vous avez fait le bon choix en visitant notre site. Souhaitez-vous notre aide?",
    yesHelp: 'Oui, avec plaisir!', noThanks: 'Non merci, je préfère explorer',
    dismissMessage: 'Pas de problème! Nous sommes là si besoin.',
    chooseLang: 'Choisissez votre langue', detectedForYou: 'Détecté pour vous',
    switchingTo: 'Parfait! Passage à',
    capabilitiesIntro: 'Merveilleux! Considérez-nous comme vos guides personnels d\'investissement.',
    capabilities: ['📖 LIRE ET TRADUIRE', '💡 EXPLIQUER ET SIMPLIFIER', '💰 CONSEILLER EN INVESTISSEMENT', '📝 ASSISTANT FORMULAIRE', '🗺️ NAVIGATEUR DU SITE', '📰 LECTEUR DE BLOG', '🧮 GUIDE CALCULATEUR'],
    abeInputPrompt: 'Tapez ci-dessous ou touchez le micro et parlez-nous!', quickActions: ['🏠 Visite', '💰 Investir', '📖 Lire', '🧮 Quiz', '📞 Humain', '❓ Question'],
    askName: 'Comment dois-je vous appeler?', niceToMeet: 'Ravi de vous rencontrer',
    typeOrSpeak: 'Tapez ou parlez...', listening: 'Écoute...', thinking: 'réfléchit',
    disclaimer: 'Ce n\'est pas un conseil financier', privacyPolicy: 'Politique de confidentialité', needHelp: 'Besoin d\'aide?',
    welcomeBack: 'Bienvenue à nouveau!', nightGreeting: 'Vous travaillez tard? Nous apprécions votre dévouement!',
    idleNudge: 'Vous lisez cette page. Des questions?', scrollNudge: 'Beaucoup d\'infos! Résumer les points clés?',
    formHelp: 'Ne vous inquiétez pas — c\'est juste une demande de consultation.', talkToHuman: 'Bien sûr! Appelez: +91 7200 255 252',
    outOfScope: 'Bonne question! Parlez à notre équipe.',
  },
  de: {
    greetings: { morning: 'Guten Morgen', afternoon: 'Guten Tag', evening: 'Guten Abend', night: 'Gute Nacht' },
    welcomeMessage: "Willkommen bei GHL India Ventures. Ich bin Abe, und das ist meine Kollegin Tina. Sie haben die richtige Wahl getroffen. Möchten Sie unsere Hilfe?",
    yesHelp: 'Ja, gerne!', noThanks: 'Nein danke, ich schaue mich um',
    dismissMessage: 'Kein Problem! Wir sind hier, wenn Sie uns brauchen.',
    chooseLang: 'Wählen Sie Ihre Sprache', detectedForYou: 'Für Sie erkannt',
    switchingTo: 'In Ordnung! Wechseln zu',
    capabilitiesIntro: 'Wunderbar! Betrachten Sie uns als Ihre persönlichen Investmentberater.',
    capabilities: ['📖 LESEN & ÜBERSETZEN', '💡 ERKLÄREN & VEREINFACHEN', '💰 INVESTMENTBERATER', '📝 FORMULAR-ASSISTENT', '🗺️ SITE-NAVIGATOR', '📰 BLOG-LESER', '🧮 RECHNER-GUIDE'],
    abeInputPrompt: 'Tippen Sie unten oder drücken Sie das Mikrofon und sprechen Sie!', quickActions: ['🏠 Zeigen', '💰 Investieren', '📖 Lesen', '🧮 Quiz', '📞 Mensch', '❓ Fragen'],
    askName: 'Wie darf ich Sie nennen?', niceToMeet: 'Schön, Sie kennenzulernen',
    typeOrSpeak: 'Tippen oder sprechen...', listening: 'Hört zu...', thinking: 'denkt nach',
    disclaimer: 'Keine Finanzberatung', privacyPolicy: 'Datenschutz', needHelp: 'Hilfe nötig?',
    welcomeBack: 'Willkommen zurück!', nightGreeting: 'Arbeiten Sie spät? Wir schätzen Ihr Engagement!',
    idleNudge: 'Sie lesen diese Seite. Fragen?', scrollNudge: 'Viele Infos! Die Kernpunkte zusammenfassen?',
    formHelp: 'Keine Sorge — nur eine Beratungsanfrage.', talkToHuman: 'Natürlich! Rufen Sie an: +91 7200 255 252',
    outOfScope: 'Gute Frage! Sprechen Sie mit unserem Team.',
  },
  ar: {
    greetings: { morning: 'صباح الخير', afternoon: 'مساء الخير', evening: 'مساء الخير', night: 'تصبح على خير' },
    welcomeMessage: "مرحباً بكم في GHL India Ventures. أنا إيب، وهذه زميلتي تينا. لقد اتخذتم القرار الصحيح بزيارتنا. هل تودون مساعدتنا؟",
    yesHelp: 'نعم، أرغب بالمساعدة!', noThanks: 'لا شكراً، سأتصفح بنفسي',
    dismissMessage: 'لا مشكلة! نحن هنا إذا احتجتم إلينا.',
    chooseLang: 'اختر لغتك', detectedForYou: 'تم الكشف لك',
    switchingTo: 'حسناً! التبديل إلى',
    capabilitiesIntro: 'رائع! اعتبرونا مستشاري استثمار عائلتكم.',
    capabilities: ['📖 اقرأ وترجم', '💡 اشرح وبسّط', '💰 مستشار استثمار', '📝 مساعد النماذج', '🗺️ دليل الموقع', '📰 قارئ المدونة', '🧮 دليل الحاسبة'],
    abeInputPrompt: 'اكتب أدناه أو اضغط على الميكروفون وتحدث!', quickActions: ['🏠 جولة', '💰 استثمار', '📖 اقرأ', '🧮 اختبار', '📞 إنسان', '❓ سؤال'],
    askName: 'ما اسمك؟', niceToMeet: 'سعيد بلقائك',
    typeOrSpeak: 'اكتب أو تحدث...', listening: 'أستمع...', thinking: 'يفكر',
    disclaimer: 'ليست نصيحة مالية', privacyPolicy: 'سياسة الخصوصية', needHelp: 'تحتاج مساعدة؟',
    welcomeBack: 'مرحباً بعودتك!', nightGreeting: 'تعمل في وقت متأخر؟ نقدر تفانيك!',
    idleNudge: 'أرى أنك تقرأ هذه الصفحة. أي أسئلة؟', scrollNudge: 'معلومات كثيرة! ألخص النقاط الرئيسية؟',
    formHelp: 'لا تقلق — مجرد طلب استشارة.', talkToHuman: 'بالتأكيد! اتصل: +91 7200 255 252',
    outOfScope: 'سؤال جيد! تحدث مع فريقنا.',
  },
  zh: {
    greetings: { morning: '早上好', afternoon: '下午好', evening: '晚上好', night: '晚安' },
    welcomeMessage: "欢迎来到GHL印度风投。我是Abe，这是我的同事Tina。您选择访问我们的网站是明智的。需要我们的帮助吗？",
    yesHelp: '是的，请帮助我！', noThanks: '不用了，我自己看看',
    dismissMessage: '没关系！需要时我们随时在这里。',
    chooseLang: '选择您的语言', detectedForYou: '为您检测到',
    switchingTo: '好的！正在切换到',
    capabilitiesIntro: '太好了！把我们当作您的家庭投资顾问。',
    capabilities: ['📖 阅读和翻译', '💡 解释和简化', '💰 投资顾问', '📝 表格助手', '🗺️ 网站导航', '📰 博客阅读', '🧮 计算器指南'],
    abeInputPrompt: '在下方输入或点击麦克风说话！', quickActions: ['🏠 参观', '💰 投资', '📖 阅读', '🧮 测验', '📞 真人', '❓ 提问'],
    askName: '我该怎么称呼您？', niceToMeet: '很高兴认识您',
    typeOrSpeak: '输入或说话...', listening: '正在听...', thinking: '正在思考',
    disclaimer: '非财务建议', privacyPolicy: '隐私政策', needHelp: '需要帮助吗？',
    welcomeBack: '欢迎回来！', nightGreeting: '工作到深夜？感谢您的努力！',
    idleNudge: '您在看这个页面。有问题吗？', scrollNudge: '信息量大！帮您总结要点？',
    formHelp: '别担心——这只是咨询请求。', talkToHuman: '当然！拨打：+91 7200 255 252',
    outOfScope: '好问题！请联系我们的团队。',
  },
  ja: {
    greetings: { morning: 'おはようございます', afternoon: 'こんにちは', evening: 'こんばんは', night: 'お疲れ様です' },
    welcomeMessage: "GHLインド・ベンチャーズへようこそ。私はエイブ、こちらは同僚のティナです。当サイトへのご訪問ありがとうございます。お手伝いしましょうか？",
    yesHelp: 'はい、お願いします！', noThanks: 'いいえ、自分で見ます',
    dismissMessage: '承知しました！必要な時はいつでもどうぞ。',
    chooseLang: '言語を選択してください', detectedForYou: '検出されました',
    switchingTo: 'はい！切り替えます',
    capabilitiesIntro: '素晴らしい！私たちをあなたの投資アドバイザーと思ってください。',
    capabilities: ['📖 読む＆翻訳', '💡 説明＆簡略化', '💰 投資アドバイザー', '📝 フォーム支援', '🗺️ サイトナビ', '📰 ブログリーダー', '🧮 計算機ガイド'],
    abeInputPrompt: '下に入力するかマイクをタップして話してください！', quickActions: ['🏠 案内', '💰 投資', '📖 読む', '🧮 クイズ', '📞 人間', '❓ 質問'],
    askName: 'お名前は？', niceToMeet: 'お会いできて嬉しいです',
    typeOrSpeak: '入力または話す...', listening: '聞いています...', thinking: '考えています',
    disclaimer: '金融アドバイスではありません', privacyPolicy: 'プライバシーポリシー', needHelp: 'お手伝いが必要ですか？',
    welcomeBack: 'お帰りなさい！', nightGreeting: '遅くまでお疲れ様です！',
    idleNudge: 'このページを読んでいますね。質問はありますか？', scrollNudge: '情報が多いですね！要点をまとめましょうか？',
    formHelp: 'ご安心ください — 相談の依頼だけです。', talkToHuman: 'もちろん！お電話：+91 7200 255 252',
    outOfScope: '良い質問です！チームにお問い合わせください。',
  },
  pt: {
    greetings: { morning: 'Bom dia', afternoon: 'Boa tarde', evening: 'Boa noite', night: 'Boa noite' },
    welcomeMessage: "Bem-vindo à GHL India Ventures. Sou Abe e esta é minha colega Tina. Você fez a escolha certa. Gostaria da nossa ajuda?",
    yesHelp: 'Sim, adoraria!', noThanks: 'Não, obrigado',
    dismissMessage: 'Sem problema! Estamos aqui se precisar.',
    chooseLang: 'Escolha seu idioma', detectedForYou: 'Detectado para você',
    switchingTo: 'Certo! Mudando para',
    capabilitiesIntro: 'Maravilhoso! Considere-nos seus consultores pessoais de investimento.',
    capabilities: ['📖 LER E TRADUZIR', '💡 EXPLICAR E SIMPLIFICAR', '💰 CONSULTOR DE INVESTIMENTO', '📝 ASSISTENTE DE FORMULÁRIO', '🗺️ NAVEGADOR DO SITE', '📰 LEITOR DE BLOG', '🧮 GUIA DA CALCULADORA'],
    abeInputPrompt: 'Digite abaixo ou toque no microfone e fale!', quickActions: ['🏠 Tour', '💰 Investir', '📖 Ler', '🧮 Quiz', '📞 Humano', '❓ Perguntar'],
    askName: 'Como posso chamá-lo?', niceToMeet: 'Prazer em conhecê-lo',
    typeOrSpeak: 'Digite ou fale...', listening: 'Ouvindo...', thinking: 'está pensando',
    disclaimer: 'Não é aconselhamento financeiro', privacyPolicy: 'Política de privacidade', needHelp: 'Precisa de ajuda?',
    welcomeBack: 'Bem-vindo de volta!', nightGreeting: 'Trabalhando até tarde? Apreciamos sua dedicação!',
    idleNudge: 'Está lendo esta página. Alguma pergunta?', scrollNudge: 'Muita informação! Resumo os pontos principais?',
    formHelp: 'Não se preocupe — é apenas uma consulta.', talkToHuman: 'Claro! Ligue: +91 7200 255 252',
    outOfScope: 'Boa pergunta! Fale com nossa equipe.',
  },
  ru: {
    greetings: { morning: 'Доброе утро', afternoon: 'Добрый день', evening: 'Добрый вечер', night: 'Доброй ночи' },
    welcomeMessage: "Добро пожаловать в GHL India Ventures. Я Эйб, а это моя коллега Тина. Вы сделали правильный выбор. Хотите нашей помощи?",
    yesHelp: 'Да, с удовольствием!', noThanks: 'Нет спасибо, я сам посмотрю',
    dismissMessage: 'Не проблема! Мы здесь, если понадобимся.',
    chooseLang: 'Выберите язык', detectedForYou: 'Определено для вас',
    switchingTo: 'Хорошо! Переключаемся на',
    capabilitiesIntro: 'Замечательно! Считайте нас вашими личными инвестиционными консультантами.',
    capabilities: ['📖 ЧТЕНИЕ И ПЕРЕВОД', '💡 ОБЪЯСНЕНИЕ', '💰 ИНВЕСТИЦИОННЫЙ СОВЕТНИК', '📝 ПОМОЩНИК С ФОРМАМИ', '🗺️ НАВИГАТОР САЙТА', '📰 ЧТЕНИЕ БЛОГА', '🧮 ГАЙД ПО КАЛЬКУЛЯТОРУ'],
    abeInputPrompt: 'Напишите ниже или нажмите на микрофон и говорите!', quickActions: ['🏠 Показать', '💰 Инвестировать', '📖 Читать', '🧮 Тест', '📞 Человек', '❓ Спросить'],
    askName: 'Как к вам обращаться?', niceToMeet: 'Рад знакомству',
    typeOrSpeak: 'Напишите или говорите...', listening: 'Слушаю...', thinking: 'думает',
    disclaimer: 'Не финансовая консультация', privacyPolicy: 'Политика конфиденциальности', needHelp: 'Нужна помощь?',
    welcomeBack: 'С возвращением!', nightGreeting: 'Работаете допоздна? Ценим ваше усердие!',
    idleNudge: 'Вы читаете эту страницу. Есть вопросы?', scrollNudge: 'Много информации! Подытожить ключевые моменты?',
    formHelp: 'Не волнуйтесь — это только запрос на консультацию.', talkToHuman: 'Конечно! Звоните: +91 7200 255 252',
    outOfScope: 'Хороший вопрос! Свяжитесь с нашей командой.',
  },
}

export function getTranslations(lang: LangCode): Translations {
  return translations[lang] || translations.en
}

export function detectLanguageFromRegion(region: string, country: string): LangCode {
  const r = region?.toLowerCase() || ''
  const c = country?.toLowerCase() || ''
  if (c === 'in') {
    if (['tamil nadu', 'tn', 'puducherry', 'py'].some(s => r.includes(s))) return 'ta'
    if (['andhra pradesh', 'ap', 'telangana', 'ts'].some(s => r.includes(s))) return 'te'
    if (['karnataka', 'ka'].some(s => r.includes(s))) return 'kn'
    if (['kerala', 'kl', 'lakshadweep', 'ld'].some(s => r.includes(s))) return 'ml'
    return 'hi'
  }
  if (['es', 'mx', 'ar', 'co', 'cl', 'pe', 'ec', 've'].includes(c)) return 'es'
  if (['fr', 'be', 'ch', 'ca', 'sn', 'ci', 'ml', 'cm'].includes(c)) return 'fr'
  if (['de', 'at'].includes(c)) return 'de'
  if (['sa', 'ae', 'qa', 'kw', 'bh', 'om', 'eg', 'jo', 'lb', 'iq'].includes(c)) return 'ar'
  if (['cn', 'tw', 'hk', 'sg'].includes(c)) return 'zh'
  if (c === 'jp') return 'ja'
  if (['br', 'pt', 'ao', 'mz'].includes(c)) return 'pt'
  if (['ru', 'by', 'kz', 'uz', 'kg'].includes(c)) return 'ru'
  return 'en'
}

export function getTimeGreeting(lang: LangCode, hour: number): string {
  const t = translations[lang]?.greetings || translations.en.greetings
  if (hour >= 5 && hour < 12) return t.morning
  if (hour >= 12 && hour < 17) return t.afternoon
  if (hour >= 17 && hour < 21) return t.evening
  return t.night
}
