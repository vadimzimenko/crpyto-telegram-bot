const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const TOKEN = "6849920760:AAEih7Ax3pqZgMKrCEChhjS-xBSzCmFeKME";
const bot = new TelegramBot(TOKEN, { polling: true });

const defaultCurrencies = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "ATOMUSDT",
  "ADAUSDT",
  "MATICUSDT",
];
let userCurrencies = [...defaultCurrencies];
let previousPrices = {};

const start = () => {
  bot.setMyCommands([
    { command: "/start", description: "Начальное приветствие" },
    {
      command: "/prices",
      description:
        "Получить список курсов криптовалют(по умолчанию выводит BTC, ETH, SOL, ATOM, ADA, MATIC",
    },
    {
      command: "/add",
      description:
        "Добавить криптовалюту в формате КРИПТОВАЛЮТА(например, NEAR) через пробел с использованием /add",
    },
    {
      command: "/remove",
      description:
        "Удалить криптовалюту в формате КРИПТОВАЛЮТА(например, NEAR) через пробел с использованием /remove",
    },
  ]);
};

// Функция для отправки курсов криптовалют
async function sendCryptoPrices(chatId) {
  try {
    const prices = {};

    for (const symbol of userCurrencies) {
      const response = await axios.get(
        `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
      );
      prices[symbol] = parseFloat(response.data.price);
    }

    let message = "Текущие курсы:\n";

    for (const symbol of userCurrencies) {
      const currentPrice = prices[symbol];
      const previousPrice = previousPrices[symbol];

      // Извлекаем основной символ криптовалюты из пары (например, из "BTCUSDT" извлекаем "BTC")
      const baseSymbol = symbol.replace("USDT", "");

      message += `${baseSymbol} : ${currentPrice} USDT`;

      if (previousPrice !== undefined) {
        const priceChange = currentPrice - previousPrice;
        const percentageChange = (priceChange / previousPrice) * 100;

        message += ` (${priceChange > 0 ? "+" : ""}${priceChange.toFixed(
          2
        )} USDT ${percentageChange.toFixed(2)}%)`;
      }

      message += "\n";
    }

    bot.sendMessage(chatId, message);

    // Обновляем предыдущие курсы
    previousPrices = { ...prices };
  } catch (error) {
    console.error("Ошибка получения курсов:", error.message);
  }
}

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Привет! Я бот для отслеживания курсов криптовалют. Отправь /prices, чтобы получить текущие курсы. Используйте /default, чтобы увидеть список валют по умолчанию."
  );
});

bot.onText(/\/default/, (msg) => {
  const chatId = msg.chat.id;
  const defaultList = defaultCurrencies.join(", ");

  bot.sendMessage(
    chatId,
    `Список по умолчанию:\n${defaultList}\n\nИспользуйте команду /add для добавления валют в ваш список.`
  );
});

// Обработка команды /prices
bot.onText(/\/prices/, (msg) => {
  const chatId = msg.chat.id;
  sendCryptoPrices(chatId);
});

// Обработка команды /add
bot.onText(/\/add (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  let symbol = match[1];

  // Если введен только основной символ криптовалюты (например, "BTC"), добавляем "USDT"
  if (!symbol.toUpperCase().includes("USDT")) {
    symbol += "USDT";
  }

  if (!userCurrencies.includes(symbol)) {
    userCurrencies.push(symbol);
    bot.sendMessage(
      chatId,
      `Валюта ${symbol} добавлена в список отслеживаемых.`
    );
    sendCryptoPrices(chatId); // Отправить текущие курсы после добавления
  } else {
    bot.sendMessage(
      chatId,
      `Валюта ${symbol} уже присутствует в списке отслеживаемых.`
    );
  }
});

bot.onText(/\/remove (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  let symbol = match[1];

  // Если введен только основной символ криптовалюты (например, "BTC"), добавляем "USDT"
  if (!symbol.toUpperCase().includes("USDT")) {
    symbol += "USDT";
  }

  if (userCurrencies.includes(symbol)) {
    userCurrencies = userCurrencies.filter((curr) => curr !== symbol);
    bot.sendMessage(
      chatId,
      `Валюта ${symbol} удалена из списка отслеживаемых.`
    );
    sendCryptoPrices(chatId); // Отправить текущие курсы после удаления
  } else {
    bot.sendMessage(
      chatId,
      `Валюта ${symbol} не найдена в списке отслеживаемых.`
    );
  }
});

// Установка интервала для отправки курсов каждый час
setInterval(() => {
  // Замените ID чата ниже на ваш собственный, если вы хотите отправлять сообщения нескольким пользователям
  sendCryptoPrices(YOUR_CHAT_ID);
}, 14400000); // 4 часа в миллисекундах

start();
