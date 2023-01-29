import './style.css'
import { Configuration, OpenAIApi } from 'openai'

const config = new Configuration({
  apiKey: "PUT_YOUR_API_KEY_HERE"
})

const openai = new OpenAIApi(configuration);

const response = await openai.createImage({
  prompt: "A cat wearing armor riding a TRex into battle",
  n: 1, //number of images requested
  size: "512x512",
});

console.log(response.data.data[0].url)

const img = document.createElement('img')
img.src = response.data.data[0].url
img.alt = "A cat wearing armor riding a TRex into battle"
document.body.appendChild(img)