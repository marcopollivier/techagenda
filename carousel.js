// Seu JSON
const jsonData = {
  "seasons": [
    {
      "year": 2024,
      "events": [
            {
                "id": "gopherconbr",
                "title": "GopherCon Brasil",
                "description": "O maior evento de Go da América Latina",
                "banner": "img/gopherconbr/logo.png",
                "href": "https://gopherconbr.org/",
                "online": false,
                "inPerson": true,
                "begin": "2023-05-09 00:00:00",
                "end": "2023-05-10 23:59:00",
                "venue": [{
                    "alias": "CentroSul - Florianopolis - SC",
                    "address": "Av. Gov. Gustavo Richard, 850 - Centro, Florianópolis - SC, 88010-290",
                    "lat": "-27.601996145321202",
                    "long": "-48.55201843558214"
                }],
                "cfp": {
                    "begin": "",
                    "end": "",
                    "href": ""
                },
                "tags": ["dev", "go", "golang"]
            },
            {
                "id": "tdc-summit-sp",
                "title": "TDC SUMMIT SÃO PAULO",
                "description": "INTELIGÊNCIA ARTIFICIAL,TECNOLOGIA,NEGÓCIOS E VOCÊ!",
                "href": "https://thedevconf.com/tdc/2024/summit-sao-paulo/",
                "online": true,
                "inPerson": true,
                "begin": "2023-03-26 00:00:00",
                "end": "2023-03-27 23:59:00",
                "venue": [{
                    "alias": "Centro de Convenções Rebouças",
                    "address": "Av.Rebouças, 600 Pinheiros - São Paulo - SP",
                    "lat": "-23.55736284085273",
                    "long": "-46.66796755767078"
                }],
                "cfp": {
                    "begin": "",
                    "end": "",
                    "href": ""
                },
                "tags": ["dev", "go", "golang"]
            }
      ]
    }
  ]
};

async function loadJSON() {
    try {
        const response = await fetch('eventos.json');
        const data = await response.json();
        return jsonData;
    } catch (error) {
        console.error('Erro ao carregar o arquivo JSON:', error);
    }
}

function createCarouselElements(data) {
  const carouselIndicators = document.getElementById('carousel-indicators');
  const carouselInner = document.getElementById('carousel-inner');

  data.seasons[0].events.forEach((event, index) => {
    const indicator = document.createElement('li');
    indicator.setAttribute('data-target', '#carouselExampleIndicators');
    indicator.setAttribute('data-slide-to', index);
    if (index === 0) {
      indicator.classList.add('active');
    }
    carouselIndicators.appendChild(indicator);

    const carouselItem = document.createElement('div');
    carouselItem.classList.add('carousel-item');
    carouselItem.classList.add('bg-neutral');
    if (index === 0) {
      carouselItem.classList.add('active');
    }

    const carouselItemLink = document.createElement('a');
    carouselItemLink.setAttribute('href', event.href);
    carouselItemLink.setAttribute('target', '_blank');

    const image = document.createElement('img');
    image.classList.add('d-block', 'carousel-img');
    image.setAttribute('src', event.banner || 'img/slide-default.png');
    image.setAttribute('alt', event.title);

    const caption = document.createElement('div');
    caption.classList.add('carousel-caption', 'd-none', 'd-md-block', 'bg-primary', 'text-white');
    caption.innerHTML = `<h5>${event.title}</h5><p>${event.description}</p>`;

    carouselItem.appendChild(carouselItemLink);
    carouselItemLink.appendChild(image);
    carouselItemLink.appendChild(caption);
    carouselInner.appendChild(carouselItem);
  });
}

createCarouselElements(jsonData);