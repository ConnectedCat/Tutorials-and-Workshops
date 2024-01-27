import './style.css'
import OpenAI from "openai"

const openai = new OpenAI({ 
  apiKey: 'YOUR_API_KEY_HERE',
  dangerouslyAllowBrowser: true //this is because you are storing your API key right above in your code
})

const response = await openai.images.generate({
  model: "dall-e-3",
  prompt: "A cat wearing armor riding a TRex into battle",
  n: 1,
  size: "1024x1024",
})

console.log(response)

const img = document.createElement('img')
img.src = response.data[0].url
img.alt = "A cat wearing armor riding a TRex into battle"
document.body.appendChild(img)