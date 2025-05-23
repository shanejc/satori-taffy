import satori, { setLayoutEngine, initTaffy } from '../src/index.js'
import { TaffyNode } from '../src/taffy/taffy-prebuilt.js'

// Initialize Taffy as the layout engine (default)
setLayoutEngine('taffy')
initTaffy(TaffyNode)

// Now use satori with Taffy as the layout engine
const svg = await satori(
  {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        width: 300,
        height: 200,
        backgroundColor: 'lightgreen',
        alignItems: 'center',
        justifyContent: 'center',
      },
      children: 'Hello Taffy!'
    }
  },
  {
    width: 300,
    height: 200,
    fonts: [],
    layoutEngine: 'taffy' // Optional: can also be set here
  }
)

console.log(svg) 