const http = require('http'); // Підключаємо модуль 'http' для створення HTTP-сервера
const fs = require('fs'); // Підключаємо модуль 'fs' для роботи з файловою системою
const fastXmlParser = require('fast-xml-parser'); // Підключаємо модуль 'fast-xml-parser' для роботи з XML

// Функція для розбору XML-даних
function XMLParser(xmlString) {
  // Налаштовуємо параметри для парсера XML
  const options = {
    attributeNamePrefix: '@', // Префікс для атрибутів
    ignoreAttributes: false, // Враховувати атрибути як елементи
    format: true, // Використовувати форматування
  };

  // Використовуємо бібліотеку 'fast-xml-parser' для парсингу рядка XML
  return fastXmlParser.parse(xmlString, options);
}

// Функція для побудови XML-документу
function XMLBuilder(data) {
  // Налаштовуємо параметри для генератора XML
  const builderOptions = {
    attributeNamePrefix: '@', // Префікс для атрибутів
    format: true, // Використовувати форматування
  };

  // Створюємо об'єкт генератора XML
  const xmlBuilder = new fastXmlParser.j2xParser(builderOptions);

  // Генеруємо XML-документ з вхідних даних
  return xmlBuilder.parse(data);
}

// Створюємо HTTP-сервер
const server = http.createServer((req, res) => {
  // Перевіряємо, чи це GET-запит і чи URL - '/'
  if (req.method === 'GET' && req.url === '/') {
    // Читаємо дані з файлу data.xml
    const xmlData = fs.readFileSync('data.xml', 'utf8');

    // Розбираємо XML-дані за допомогою функції XMLParser
    const parsedData = XMLParser(xmlData);

    // Перевіряємо, чи вдалося розібрати дані та чи існує потрібна структура
    if (parsedData && parsedData.indicators && parsedData.indicators.banksincexp) {
      const banksincexpData = parsedData.indicators.banksincexp;

      // Фільтруємо дані, обираючи лише обрані категорії
      const filteredData = banksincexpData.filter((item) => {
        return item.txt === 'Доходи, усього' || item.txt === 'Витрати, усього';
      });

      // Створюємо початок XML-відповіді з обгорненим <data> елементом
      const xmlResponse = {
        data: {
          indicators: filteredData.map(item => ({
            txt: item.txt,
            value: item.value
          }))
        }
      };

      // Генеруємо XML-документ з вхідних даних за допомогою XMLBuilder
      const xmlString = XMLBuilder(xmlResponse);

      // Відправляємо XML-відповідь зі статусом 200 (OK)
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(xmlString);
    } else {
      // Якщо дані некоректні, встановлюємо статус 500 (Internal Server Error) і надсилаємо відповідь "Invalid XML Data"
      res.statusCode = 500;
      res.end('Invalid XML Data');
    }
  } else {
    // Якщо запит не підходить під умову, встановлюємо статус 400 (Bad Request) і надсилаємо відповідь "Bad Request"
    res.statusCode = 400;
    res.end('Bad Request');
  }
});

// Запускаємо сервер на порті 8000 і виводимо повідомлення про запуск в консоль
server.listen(8000, () => {
  console.log('Сервер запущено');
});