const http = require('http'); 
const fs = require('fs'); 
const fastXmlParser=require('fast-xml-parser')



function XMLParser(xmlString) {
  
  const options = {
    attributeNamePrefix: '@', 
    ignoreAttributes: false, 
    format: true, 
  };

  return fastXmlParser.parse(xmlString, options);
}


function XMLBuilder(data) {
  
  const builderOptions = {
    attributeNamePrefix: '@', 
    format: true, 
  };

  const xmlBuilder = new fastXmlParser.j2xParser(builderOptions);
  return xmlBuilder.parse(data);
}


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