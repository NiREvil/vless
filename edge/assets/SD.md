---
layout: doc
outline: deep
title: Stable Diffusion
description: 'Stable Diffusion is aa neural network that generates images from a text prompt'
date: 2025-02-06
editLink: true
head:
  - - meta
    - name: keywords
      content: Image generator, Stable Diffusion, text prompt, Telegram bot, DALL.E3, Flux, Midjourney
---

# Stable Diffusion

> Stable Diffusion is a neural network that generates images from a text prompt

Welcome! Today, we’ll journey from the simplest generations to the most elegant ones, and I’ll provide examples along the way.

Before we begin, I’d like to mention that AI models are excellent at generating various types of content: girls, cities, guys, nature. However, we’ll focus on cats and something unusual to showcase the full potential! You can experiment on your own after reading this guide :)

**I recommend three bots for use,**  
but I will only explain the first one in detail, as the other two are quite similar to each other.

1. **[StableDiffusion_robot]**
2. **[stable_diffusion_bot]**
3. **[StableDiffusionWrapperBot]**

<br/>

### First Steps

Let’s start with the basics. We’ve just entered the bot and want to generate, say, a frog in a pink spacesuit. So, we’ll write:

![An image](https://github.com/user-attachments/assets/5958bdd9-ad29-49b5-a170-d5bb6c35c956)

<br/>

> Frog in a pink spacesuit on the moon

You’ll notice that it doesn’t matter whether you use Russian or English for the bot, so for clarity, I’ll use English in the following examples:

### Upscale Function

Want to improve the quality of your image? Click the "Upscale" button under the art, and you’ll get a high-resolution PNG image.

![An image](https://github.com/user-attachments/assets/5b09e183-4bf1-4605-adb6-f0299bf297b7)

<br/>

![An image](https://github.com/user-attachments/assets/bf866f8b-bddd-41dc-973d-65121758afa9)

<hr><br/>

### Main Bot Functionality

Access the settings via the `/menu` command or by clicking the ⚙️ Menu button available under each generation.

![An image](https://github.com/user-attachments/assets/3712473f-5c37-4d24-aac2-d1aa5e0b8d06)

<br/>

- **📐 Format** – The aspect ratio of your generation. The image can be horizontal (for landscapes), vertical (for portraits), or square.
- **📺 Model** – The foundation of your generation, determining the style. All models lean towards realism but retain their unique flair. Try them out and find your favorite! ❤️
- **🎨 Style** – Easily customize your generation. Be sure to try each one. Examples of all styles are available in the bot!

<hr><br/>

#### Models

The bot contains 4 different models: SD 1.5, SDXL 1, SDXL turbo X2.
You get 8 free generations every day.

#### How to Earn Generations?

We provide you with several free generations daily. If you run out, here’s how to get more:

#### Referral System

In the ⚙️ Menu, select ✨ Invite a Friend and get your unique referral link in the format:  
[https://t.me/StableDiffusion_robot/?start=]

For every person who clicks your link and creates art, you’ll earn 10 generations! For example, you can write an article about the bot on Pikabu and include your referral link, or share it in a chat with friends.

#### Shop

Find 🚀 Shop in the menu and purchase additional generations! Developing and maintaining each model costs us a lot, so we’d appreciate your financial support.

If you purchase a Premium subscription, you’ll be able to create 18+ art!

#### Generation Contest

When you upscale a generation, a 🏆 Submit to Contest button will appear.

![An image](https://github.com/user-attachments/assets/6170649a-181d-4326-a6c0-0bd73cb44df9)

<br>

> Feel free to click it—your masterpiece will be sent to our admin,
> who periodically selects works for publication in our channel! If your work is chosen,
> it will be published, and you’ll receive 30 bonus generations!

<hr><br/>

### Advanced Input

Let’s learn how to adjust the weights of tag-words. Here’s an example to illustrate this concept:

![An image](https://github.com/user-attachments/assets/0fc8cdba-61d2-48d7-a99a-33298066556c)

<br/>

> **a cat**, (jumping:0.5), (flowers at the background:1.5), **close up**

And the second version:

![An image](https://github.com/user-attachments/assets/bb5ce6d4-76ac-46b8-a2ef-7275649ec7fa)

<br/>

> **a cat**, (jumping:1.5), (flowers at the background:0.5), **close up**

As you can see, the number of flowers and the cat’s pose change within the same prompt.

In the first art, we asked the bot to create a cat with flowers in the background, slightly emphasizing them, while downplaying the cat’s pose.

In the second art, we increased the emphasis on the "jump" and reduced the "flowers in the background." By default, each element has a weight of 1.0. We adjusted the weight from 0.5 to 1.5. It’s recommended not to overuse this, as it can distort the result. A good rule of thumb is to keep values between 0.5 and 1.6. Also, avoid applying this technique to all tags at once, as it can easily ruin the image.

- **(flowers in the background)** – Increases the weight from 1.0 to 1.1.
- **((flowers in the background))** – Increases the weight from 1.0 to 1.21.
- You can manually set the value: **(flowers in the background:<value>)**
- **[flowers in the background]** – Decreases the weight from 1.0 to 0.9.

::: tip
You can only manually decrease the weight using round brackets. For example, you can’t write [orange ears:0.4], only (orange ears:0.4).  
:::

👍 That’s it! Mastering this technique opens up many more possibilities for refining results and fixing flaws. Practice on your own to see how it can enhance your favorite art.

<hr><br/>

### Characters

We’ve compiled a huge list of character descriptions. Check it out to find the tags you need, or simply write the character’s name in Russian, and the bot will provide the relevant tags.

<br/>

### Interesting Tags

Here, we’ll add non-obvious, interesting tags that can make your generations even cooler!

#### Frame

- Wide shooting angle
- Low angle shooting
- Selfie shot angle
- Dynamic pose
- Close up
- Medium close up
- Full body
- A frame from the movie

<br/>

#### Tags for Different Genres

- **Abstract Art**: “Vibrant colors,” “Geometric shapes,” “Abstract patterns,” “Movement and flow,” “Texture and layers”
- **Surrealism**: “Dreamlike,” “Surreal landscapes,” “Mystical creatures,” “Twisted reality,” “Surreal still life.”
- **Landscape Photography**: “Majestic mountains,” “Lush forests,” “Glittering lakes,” “Desert dunes,” “Golden sunsets.”
- **Portrait Photography**: “Emotive eyes,” “Intense gazes,” “Contemplative mood,” “Expressive gestures,” “Stylized poses.”
- **Minimalism**: “Simplicity,” “Clean lines,” “Minimal colors,” “Negative space,” “Minimal still life.”
- **Realism**: “Hyper-realistic textures,” “Precise details,” “Realistic still life,” “Realistic portraits,” “Realistic landscapes.”
- **Pop Art**: “Bold colors,” “Stylized portraits,” “Famous faces,” “Pop art still life,” “Pop art landscapes.”
- **Street Photography**: “Candid moments,” “Urban landscapes,” “Street life,” “Stories in motion,” “Street portraits.”
- **Night Photography**: “Lit cityscapes,” “Starry skies,” “Moonlit landscapes,” “Night time portraits,” “Long exposures.”

<br/>

#### Camera Lenses

- **Sigma 150-600mm 5-6.3 Contemporary DG OS HSM Lens**: Ideal for sports and wildlife photography.  
  Example prompt: _mountain lion in his natural habitat, shot with a Sigma 150-600mm 5-6.3 Contemporary DG OS HSM Lens, lit by daylight, photo_

- **GoPro Max Lens**: Ultra-wide-angle view up to 155°. Perfect for sports events, vlogging, or any scenario requiring smooth, wide shots.  
  Example prompt: _player kicking the soccer ball in a game, shot with a GoPro Max Lens, lit by stadium lights, photo_

- **Tamron 10-24mm f/3.5-4.5 Di II VC HLD Lens**: Great for landscapes, real estate, and architecture.  
  Example prompt: _luxury home living room, shot with a Tamron 10-24mm f/3.5-4.5 Di II VC HLD Lens, lit by daylight, photo_

- **Zeiss Otus 55mm f/1.4 Lens**: Known for its sharpness, ideal for portraits and general photography.  
  Example prompt: _classic car on a street, shot with a Zeiss Otus 55mm f/1.4 Lens, lit by daylight, photo_

- **Canon EF 100mm f/2.8L Macro IS USM Lens**: Perfect for close-ups of insects, flowers, or small details. Also great for portraits due to its beautiful bokeh.  
  Example prompt: _close up of a bee on a flower, shot with a Canon EF 100mm f/2.8L Macro IS USM Lens, lit by daylight, photo_

<hr><br/>

### More Cool Tags

Add these tokens to your prompts—they’ll come in handy for all kinds of image generations. These hints will add different styles, colors, moods, and more to your results.

- **holographic**
- **in the style of kawaii aesthetic**
- **colorful garden**
- **in a style of surrealism**
- **light silver and light gold**
- **neon light**
- **pastel accent colors**
- **in the style of circular abstraction**
- **atmospheric lighting**
- **candid moments captured**
- **in the style of conceptual installation**
- **emotional and dramatic scenes**
- **in the style of surreal engine**
- **carpetpunk**
- **troubadour style**
- **celebration of rural life**
- **liquid foil gradient**
- **euphoria**
- **in the style of minimalist monochromatic landscapes**
- **surreal fashion photography**
- **post-internet aesthetics**
- **in the style of hyperrealistic photography**
- **in the style of organic material**
- **algeapunk**
- **transfixing marine scenes**
- **roman art and architecture**
- **in the style of pastel color palette**
- **in the style of unreal engine**
- **in the style of hyperrealistic animal portraits**
- **adventurecore**
- **neon sparks**
- **nature-inspired camouflage**
- **rural life**
- **unicorn**
- **hyperbolic expression**
- **kodak**
- **muted tones**
- **ektachrome**
- **in the style of organic forms**
- **neon colors**
- **forestpunk**
- **cambodian art**
- **in the style of psychadelic surrealism**
- **in the style of dark reflections**
- **in the style of gauzy atmospheric landscapes**
- **conceptual installation art**
- **product photography**
- **dreamy**
- **in the style of surreal architectural landscapes**
- **light white and light amber**

<hr><br/>

### Inspiration

Coming up with a good prompt isn’t easy, so you can look at the best art for new ideas. Let’s check out some works from our subscribers, which you can borrow for inspiration: <br/>

![An image](https://github.com/user-attachments/assets/abd03786-9704-4006-9b9a-722bdf43b434)

<br/>

> Prompt: A photorealistic image of an anthropomorphic wolf with human-like hands and feet,
> wearing a tailored suit and tie, playing an electric guitar in the middle of a bustling New York City street.
> The wolf is standing on its hind legs, holding the guitar with its human-like hands.
> The guitar is a Gibson Les Paul, and the wolf is playing a blues riff.
> The background is a busy New York City street with yellow taxis, skyscrapers, and pedestrians.
> The lighting is dramatic and cinematic, with a shallow depth of field focusing on the wolf.
> High detail, 8k resolution, masterpiece.
>
> > Model: RealVis Vanilla

<br/>-

![An image](https://github.com/user-attachments/assets/923bd226-0482-4c50-9226-4b09d08cbfff)

<br/>

> Prompt: (totoro:1.5), (by hayao miyazaki:2), (minimalism:1.2), (miyazaki style:1.7)
>
> > Model: Stable Diffusion XL Midjourney

<br/>

![An image](https://github.com/user-attachments/assets/b9ba3e8d-2871-4788-ae12-7b711d4b03e5)

<br>

> Prompt: three-dimensional white drawing of train placed on a blank page.
>
> > Model: Stable Diffusion XL Vanilla

<br/>-

![An image](https://github.com/user-attachments/assets/000e92dc-3f5c-43f6-975d-07f518ae6b53)

<br>

> Prompt: rick from rick and morty.
>
> > Model: Dreamshaper Vanilla

<br/>

![An image](https://github.com/user-attachments/assets/1c2bfaf7-704e-40c6-973f-8ae18802ba0a)

<br/>

> Prompt: hygge set, hand drawn vector, scandinavian doodle sketchy elements. cozy comfortable lifestyle hygge, set, vector, cozy, cosy, home, illustration, candle, hand drawn, drawing, flat, house, scandinavian, book, warm, lifestyle, trendy, comfortable, doodle.
>
> > Model: Dreamshaper Vanilla

<br/>

![An image](https://github.com/user-attachments/assets/86e218db-6801-40cf-9037-a76e1dad7b40)

<br/>

> Prompt: skinny model wearing a dress at beach bar drinks a cocktail.
>
> > Model: EpicRealism Vanilla

Do you need more inspiration ?
Be my guest, [Best of Stable Diffusion]

<hr><br/>

[StableDiffusion_robot]: https://t.me/StableDiffusion_robot/?start=6064662462
[stable_diffusion_bot]: https://t.me/stable_diffusion_bot
[StableDiffusionWrapperBot]: https://t.me/StableDiffusionWrapperBot
[Best of Stable Diffusion]: https://t.me/StableDiffusionBest
[https://t.me/StableDiffusion_robot/start]: https://t.me/StableDiffusion_robot/?start=6064662462
