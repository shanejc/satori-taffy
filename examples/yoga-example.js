import satori, { setLayoutEngine, initYoga } from '../src/index.js'
import yoga from 'yoga-wasm-web/auto'

// Initialize Yoga as the layout engine
setLayoutEngine('yoga')
initYoga(yoga)

// Now use satori with Yoga as the layout engine
const svg = await satori(
  {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        width: 300,
        height: 200,
        backgroundColor: 'lightblue',
        alignItems: 'center',
        justifyContent: 'center',
      },
      children: 'Hello Yoga!'
    }
  },
  {
    width: 300,
    height: 200,
    fonts: [],
    layoutEngine: 'yoga' // Optional: can also be set here
  }
)

console.log(svg) 