import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import { geometry } from "../toolsGeomentry/getRectangle";
import rough from "roughjs/bundled/rough.esm";

function createElement(ref, x1, y1, x2, y2) {
  console.log("create element ", x1, y1, x2, y2);
  //const line = geometry.drwLine(ref, x1, y1, x2, y2);
  return { x1, y1, x2, y2 };
}

const FieldCanvas = () => {
  const [ctx, setCtx] = useState();
  const [elements, setElements] = useState([]);
  const [action, setAction] = useState("none");
  const canvasRef = useRef(null);
  const [typeInstrument, setTypeInstrument] = useState("wall");
  const [axis, setAxis] = useState("axisX");
  const [selectedElement, setSelectedElement] = useState(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    let ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    elements.forEach(({ x1, y1, x2, y2, typeInstr, axis }) => {
      switch (typeInstr) {
        case "line": {
          geometry.drwLine(canvas, x1, y1, x2, y2);
          break;
        }
        case "wall": {
          console.log("wall", axis);
          if (axis === "axisX") {
            geometry.drwRectangle(canvas, x1, y1, x2, y2, "fill");
          } else {
            geometry.drwRectangle(canvas, x1, y1, x2, y2, "fill");
          }

          break;
        }
        case "destination": {
          geometry.drwRectangle(canvas, x1, y1, x2, y2, "fill");
        }
      }
    });
  }, [elements]);

  function pointOnCanvas(clientX, clientY) {
    //const { clientX, clientY } = event;
    const canvas = canvasRef.current;
    const bounding = canvas.getBoundingClientRect();
    console.log(" clientX, clientY", clientX, clientY);
    return { x: clientX - bounding.left, y: clientY - bounding.top };
  }

  const distance = (a, b) =>
    Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

  const isWithinElement = (x, y, element) => {
    const { typeInstr, x1, x2, y1, y2 } = element;

    if (typeInstr === "wall") {
      // const minX = Math.min(x1, x2);
      // const maxX = Math.max(x1, x2);

      // const minY = Math.min(y1, y2);
      // const maxY = Math.max(y1, y2);
      if (Math.sign(y2) == -1) {
        return x <= x1 && x >= x2 && y >= y1 && y >= y2;
      } else if (Math.sign(x2) == -1) {
        console.log(
          "element",
          "x",
          x - y2,
          "y",
          y - 2,
          "x1x2",
          element.x1,
          element.x2,
          "y1y2",
          element.y1,
          Math.abs(element.y2) + y1,
          "abs"
          //element
        );
        console.log("element result x", x <= x1, x >= x2, y >= y1, y >= y2);
        return x <= x1 && x >= x2 && y >= y1 && y >= y2;
      }

      return x >= x1 && x <= x2 + x1 && y >= y1 && y <= y2 + y1;
    }
  };

  const getElementAtPosition = (x, y, elements) => {
    console.log(
      "check",
      elements.find((element) => isWithinElement(x, y, element))
    );

    return elements.find((element) => isWithinElement(x, y, element));
  };

  function handleMouseDown(event) {
    const { clientX, clientY } = event;

    if (typeInstrument === "selection") {
      const canvas = canvasRef.current;
      const x = pointOnCanvas(clientX, clientY).x;
      const y = pointOnCanvas(clientX, clientY).y;
      const element = getElementAtPosition(x, y, elements);
      console.log("elemenbt", element);
      if (element) {
        setSelectedElement(element);
        setAction("moving");
      }
    } else {
      setAction("draw");
      const canvas = canvasRef.current;
      const x = pointOnCanvas(clientX, clientY).x;
      const y = pointOnCanvas(clientX, clientY).y;
      const id = elements.length;
      console.log("csdac", x, y);
      let newElement;
      if (typeInstrument === "destination") {
        newElement = {
          x1: x,
          y1: y,
          x2: 15,
          y2: 15,
          typeInstr: typeInstrument,
          axis: axis,
          id: id,
        };
      } else {
        newElement = {
          x1: x,
          y1: y,
          x2: 0,
          y2: 0,
          typeInstr: typeInstrument,
          axis: axis,
          id: id,
        };
      }
      setElements((prevState) => [...prevState, newElement]);
    }
  }

  function handleMouseMove(event) {
    const { clientX, clientY } = event;
    //console.log(pointOnCanvas(clientX,clientY))
    if (action === "draw") {
      const canvas = canvasRef.current;
      const { clientX, clientY } = event;
      const indexElement = elements.length - 1;

      const x = pointOnCanvas(clientX, clientY).x;
      const y = pointOnCanvas(clientX, clientY).y;

      const { x1, y1 } = elements[indexElement];

      let newElement;
      if (typeInstrument === "destination") {
        console.log("elements", elements);
        newElement = {
          ...elements[elements.length - 1],

          x2: 15,
          y2: 15,
        };
        setElements((prevState) => [...prevState.slice(0, -1), newElement]);
      } else {
        newElement = {
          ...elements[elements.length - 1],
          x2: axis == "axisX" ? 20 : x - x1,
          y2: axis == "axisY" ? 20 : y - y1,
        };
        setElements((prevState) => [...prevState.slice(0, -1), newElement]);
      }
    } else if (action === "moving") {
      const { id, x1, x2, y1, y2, typeInstre } = selectedElement;
      const x = pointOnCanvas(clientX, clientY).x;
      const y = pointOnCanvas(clientX, clientY).y;

      let width = x2 + x1 - x1;
      let height = y2 + y1 - y1;

      const newElement = {
        ...elements[id],
        x1: x,
        y1: y,
        x2: x2, //+ width,
        y2: y2, //+ height,
      };
      console.log(
        "selectedElementMove newElement",
        x + width,
        y + height,
        newElement
      );
      let copyElement = [...elements];
      copyElement[id] = newElement;
      setElements(copyElement);
      //const id = selectedElement.id;
    }
  }

  function handleMouseUp(event) {
    setAction("none");
    console.log();
  }
  console.log("action", action);
  return (
    <div>
      <div style={{}}>
        <input
          type="radio"
          id="selection"
          content="selection"
          checked={typeInstrument === "selection"}
          onChange={() => setTypeInstrument("selection")}
        />
        <label for="selection">selection</label>
        <input
          type="radio"
          id="destination"
          content="destination"
          checked={typeInstrument === "destination"}
          onChange={() => setTypeInstrument("destination")}
        />
        <label for="destination">destination</label>
        <input
          type="radio"
          id="line"
          content="Line"
          checked={typeInstrument === "line"}
          onChange={() => setTypeInstrument("line")}
        />
        <label for="Line">Line</label>
        <input
          type="radio"
          id="wall"
          content="wall"
          checked={typeInstrument === "wall"}
          onChange={() => setTypeInstrument("wall")}
        />
        <label for="wall">wall</label>
        <input
          type="radio"
          id="axisX"
          content="axisX"
          checked={axis === "axisX"}
          onChange={() => setAxis("axisX")}
        />
        <label for="axisY">X</label>
        <input
          type="radio"
          id="axisY"
          content="axisY"
          checked={axis === "axisY"}
          onChange={() => setAxis("axisY")}
        />
        <label for="axisY">Y</label>
      </div>
      <canvas
        id={"canvas"}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={canvasRef}
        width={800}
        height={800}
        style={{ border: "0.5px solid black" }}
      />
    </div>
  );
};

export default FieldCanvas;
