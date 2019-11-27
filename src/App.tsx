import React, { Component, useState } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import MindComponent from './components/MindComponent'
let _id = 0;
export const AppContext = React.createContext(1);
const App = () => {

  const [k, setK] = useState(1);
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const MindComponents = []
  for (let x = -size.width / 2; x < size.width / 2; x += 40) {
    for (let y = -size.height / 2; y < size.height / 2; y += 40) {
      MindComponents.push(
        <MindComponent key={_id++} position={{ x, y }} />
      )
    }
  }
  return (
    <AppContext.Provider value={k}>
      <Stage
        offsetX={-size.width / (2 * k)}
        offsetY={-size.height / (2 * k)}
        onWheel={(e) => {
          const data = e.evt as any;
          if (data.deltaY < 0) {
            setK(k * 1.1)
          } else {
            setK(k * 0.9)
          }
        }}
        scaleX={k} scaleY={k} {...size}>
        <Layer>
          {MindComponents}
        </Layer>
      </Stage>
    </AppContext.Provider>

  );
}

export default App;
