const { get } = require('lodash');
const axios = require('axios');

async function getPhotoByTitle(title) {
    const resp = await axios.request({
        method: 'GET',
        url: 'https://bing-image-search1.p.rapidapi.com/images/search',
        params: {
            q: title
        },
        headers: {
            'x-rapidapi-host': 'bing-image-search1.p.rapidapi.com',
            'x-rapidapi-key': '21df5df486mshd98381060aaad3fp1f699bjsn9dc645b33838'
        }
    });

    const totalPhotos = get(resp, `data.value.length`, 10);
    const randomNumber = Math.floor(Math.random() * totalPhotos);
    return get(resp, `data.value[${randomNumber}].contentUrl`, '');
}

module.exports = {
    getPhotoByTitle
}
