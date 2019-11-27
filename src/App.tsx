import React, { useState } from 'react';
import { Stage, Layer } from 'react-konva';
import MindComponent from './components/MindComponent'
import EventBus from './EventBus'

let _id = 0;
const getUniqueId = () => String(_id++)
const createInitNode = (size: ISize) => {
  const nodes: INode[] = [];
  for (let x = -size.width / 2; x < size.width / 2; x += 400) {
    for (let y = -size.height / 2; y < size.height / 2; y += 400) {
      nodes.push({
        id: getUniqueId(),
        size: {
          width: 20,
          height: 20
        },
        position: { x, y },
        active: false
      });

    }
  }
  return nodes;
}
const App = () => {

  const [k, setK] = useState(1);
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [nodes, setNodes] = useState(createInitNode(size));

  const updateNodeData = (data: { [x: string]: any }): void => {
    let node = nodes.find(res => res.id === data.id);
    console.log(data.id)
    if (!node) return;
    if (data.position) {
      data.position.x = data.position.x - (size.width / 2);
      data.position.y = data.position.y - (size.height / 2);
    }
    node = {
      ...node,
      ...data
    }
    setNodes([...nodes])
  }

  EventBus.on('updateNodeData', updateNodeData);
  return (
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
        {
          nodes.map(node => <MindComponent key={node.id} {...node} />)
        }
      </Layer>
    </Stage>
  );
}

export default App;
