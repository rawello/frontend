import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import { geometry } from "../toolsGeomentry/getRectangle";
import { Menu, Dropdown, Button, Input } from "antd";
import { DownOutlined, UserOutlined } from "@ant-design/icons";
import axios from "axios";
import { addRouteToDbFromFront, customRouter, editRoute, getQrCodeApi, getRoute, saveFrontObject } from "../tools/api";

// function createElement(ref, x1, y1, x2, y2) {
//   console.log('create element ', x1, y1, x2, y2);
//   //const line = geometry.drwLine(ref, x1, y1, x2, y2);
//   return { x1, y1, x2, y2 };
// }

const FieldCanvas = () => {
  const [ctx, setCtx] = useState();
  const [elements, setElements] = useState([]);
  const [action, setAction] = useState("none");
  const canvasRef = useRef(null);
  const [typeInstrument, setTypeInstrument] = useState("wall");
  const [axis, setAxis] = useState("axisX");
  const [selectedElement, setSelectedElement] = useState(null);
  const [lineWidth, setLineWidth] = useState(12);
  const [prevId, setPrevId] = useState({ id: null, color: null });
  const [floorCurrent, setFloor] = useState(1);
  const [waypoints, setWaypoints] = useState({});
  const [waypointType, setWaypointType] = useState("ladder");
  const [namePoint, setNamePoint] = useState("Кабинет 0");
  const [maps, setMaps] = useState({});
  const [login, setLogin] = useState("");
  const [build, setBuild] = useState("");
  const [routeData, setGetRouteData] = useState();
  const [nameNewBuild, setNameNewBuild] = useState("");
  const [floors, setFloors] = useState([1]);
  const [waypointQr, setWaypointQr] = useState();
  const [linkqr, setlinkQr] = useState("");
  useEffect(() => {
    renderGeometry();
  });

  const menu = (
    <Menu>
      {floors.map((item) => {
        return (
          <Menu.Item
            onClick={() => {
              setFloor(item);
              cachingFloor();
            }}
            key={item}
          >
            Этаж {item}
          </Menu.Item>
        );
      })}
    </Menu>
  );

  function cachingFloor() {
    console.log("cache");
    const canvas = document.getElementById("canvas"); // получаем элемент canvas
    const dataUrl = canvas.toDataURL("image/png"); // получаем содержимое canvas в формате data URL

    var svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}"><image xlink:href="${dataUrl}" height="${canvas.height}" width="${canvas.width}"/></svg>`;
    let data = svgData;
    let cache = { ...maps, [floorCurrent]: data };
    setMaps(cache);
    console.log("check", cache);
    return cache;
  }

  function pointOnCanvas(clientX, clientY) {
    //const { clientX, clientY } = event;
    const canvas = canvasRef.current;
    const bounding = canvas.getBoundingClientRect();
    console.log(" clientX, clientY", clientX, clientY);
    return { x: clientX - bounding.left, y: clientY - bounding.top };
  }

  const distance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

  function renderGeometry() {
    const canvas = canvasRef.current;
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    elements.forEach(({ floor, x1, y1, x2, y2, typeInstr, axis, color, lineWidth }) => {
      if (floorCurrent == floor) {
        switch (typeInstr) {
          case "line": {
            geometry.drwLine(canvas, x1, y1, x2, y2);
            break;
          }
          case "wall": {
            console.log("wall", elements);
            if (axis === "axisX") {
              geometry.drwRectangle(canvas, x1, y1, x2, y2, "fill", color, lineWidth);
            } else {
              geometry.drwRectangle(canvas, x1, y1, x2, y2, "fill", color, lineWidth);
            }

            break;
          }
          case "destination": {
            geometry.drwRectangle(canvas, x1, y1, x2, y2, "fill", color, lineWidth);
          }
        }
      }
    });
  }

  const isWithinElement = (x, y, element) => {
    const { typeInstr, x1, x2, y1, y2 } = element;

    if (typeInstr === "wall" || typeInstr === "destination") {
      // const minX = Math.min(x1, x2);
      // const maxX = Math.max(x1, x2);

      // const minY = Math.min(y1, y2);
      // const maxY = Math.max(y1, y2);
      if (Math.sign(y2) == -1) {
        return x <= x1 && x >= x2 && y >= y1 && y <= y2;
      } else if (Math.sign(x2) == -1) {
        console.log("element result x", x <= x1, x >= x2, y >= y1, y >= y2);
        return x <= x1 && x >= x2 && y >= y1 && y >= y2;
      }

      return x >= x1 && x <= x2 + x1 && y >= y1 && y <= y2 + y1;
    }
  };

  const getElementAtPosition = (x, y, elements) => {
    return elements.find((element) => isWithinElement(x, y, element));
  };

  function handleMouseDown(event) {
    const { clientX, clientY } = event;
    cachingFloor();
    if (typeInstrument === "selection") {
      console.log("prevId", prevId);

      const canvas = canvasRef.current;
      const x = pointOnCanvas(clientX, clientY).x;
      const y = pointOnCanvas(clientX, clientY).y;
      const element = getElementAtPosition(x, y, elements);
      if (element) {
        setSelectedElement(element);
        setPrevId({ id: element.id, color: element.color });
        //elements.find((item) => item.id === element.id).color = 'red';
        console.log("onMouseDown prevId", element);

        if (elements.find((item) => item.id === prevId?.id)) elements.find((item) => item.id === prevId?.id).color = prevId.color;

        setElements(elements);
        setAction("moving");
      }
    } else {
      setAction("draw");
      const canvas = canvasRef.current;
      const x = pointOnCanvas(clientX, clientY).x;
      const y = pointOnCanvas(clientX, clientY).y;
      const id = elements.length;

      let newElement;
      if (typeInstrument === "destination") {
        if (namePoint in waypoints) {
          alert("Точка с таким именем уже есть");
          return;
        }
        generateWaypoints(x, y, id);
        newElement = {
          floor: floorCurrent,
          namePoint: namePoint,
          x1: x,
          y1: y,
          x2: 15,
          y2: 15,
          typeInstr: typeInstrument,
          axis: axis,
          id: id,
          color: waypointType == "ladder" ? "green" : "#3F48CC",
          lineWidth: lineWidth,
        };
      } else {
        newElement = {
          floor: floorCurrent,
          x1: x,
          y1: y,
          x2: 0,
          y2: 0,
          typeInstr: typeInstrument,
          axis: axis,
          id: id,
          color: "black",
          lineWidth: lineWidth,
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
        console.log("typeInstrument destination", elements);
        newElement = {
          ...elements[elements.length - 1],

          x2: 15,
          y2: 15,
        };

        setElements((prevState) => [...prevState.slice(0, -1), newElement]);
      } else {
        newElement = {
          ...elements[elements.length - 1],
          x2: axis == "axisY" ? lineWidth : Math.sign(x - x1) == -1 ? 1 : x - x1,
          y2: axis == "axisX" ? lineWidth : Math.sign(y - y1) == -1 ? 1 : y - y1,
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
      console.log("selectedElementMove newElement", x + width, y + height, newElement);
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

  function deleteElement() {
    //delete [selectedElement.id];
    console.log("ass", selectedElement, waypoints);
    elements.splice(selectedElement.id, 1);
    if (selectedElement.namePoint) {
      delete waypoints[selectedElement.namePoint];
    }
    //setPrevId(null);
    let newArrayElements = elements.filter((item) => item.id !== selectedElement.id);
    setElements(newArrayElements);
    renderGeometry();
  }

  function generateWaypoints(x, y, id) {
    if (waypointType === "ladder") return;

    let point = [floorCurrent, [Math.ceil(x), Math.ceil(y)]];
    if (namePoint in waypoints) {
      alert("Точка с таким именем уже есть");
      return;
    }

    waypoints[namePoint] = point;
    console.log("generateWaypoints", waypoints);
    setWaypoints(waypoints);
  }

  function getRouteUser() {
    if (login == "" && build == "") {
      alert("Введите логин и здание");
      return;
    }
    const fetchData = async () => {
      try {
        const result = await getRoute(login, build); // Замените user и build на ваши значения
        if (result.obj.length !== 0) {
          setGetRouteData(result);
          setFloors(JSON.parse(result.floors));
          setElements(result.obj);
        }
      } catch (error) {
        console.error("Ошибка получения данных:", error);
      }
    };

    fetchData();
  }

  function getQrCode() {
    console.log("waypointQr", waypointQr);
    if (build.length == 0) {
      alert("Введите название здания");
      return;
    }
    if (!waypointQr) {
      alert("Выберите точку");
      return;
    }
    const getQr = async () => {
      try {
        const result = await getQrCodeApi(build, waypointQr.key); // Замените user и build на ваши значения
        console.log("result", result);
        var link = `http://26.140.209.161:8000/generateQR/${build}/${waypointQr.key}`;
        setlinkQr(link);
        window.location.href = link;
        window.open(link);
      } catch (error) {
        console.error("Ошибка получения данных:", error);
      }
    };
    getQr();
  }

  function prepareImageMap() {
    let mapsReady = [];
    if (nameNewBuild.length == 0) {
      alert("Введите имя здания");
      return;
    }
    cachingFloor();
    if (floorCurrent in maps) {
    } else {
      const forMap = cachingFloor();
      for (let key in forMap) {
        mapsReady.push(forMap[key]);
      }
    }
    for (let key in maps) {
      mapsReady.push(maps[key]);
    }
    const data = {
      svg: mapsReady,
      build: nameNewBuild,
      obj: elements,
      floors: floors,
      rooms: {
        ...waypoints,
      },
      login: login,
    };
    addRouteToDbFromFront(data);
  }

  function editRouteCurrent() {
    let mapsReady = [];
    if (build == 0) {
      alert("Введите имя здания");
      return;
    }
    if (floorCurrent in maps) {
    } else {
      const forMap = cachingFloor();
      for (let key in forMap) {
        mapsReady.push(forMap[key]);
      }
      console.log("cachingFloor", forMap, mapsReady);
    }

    const data = {
      svg: JSON.stringify(mapsReady),
      build: build,
      obj: elements,
      floors: floors,
      rooms: {
        ...waypoints,
      },
      login: login,
    };
    editRoute(data);
  }
  function manageFloors() {
    const lastFloor = floors[floors.length - 1];
    setFloors([...floors, lastFloor + 1]);
    setFloor(lastFloor + 1);
    cachingFloor();
    console.log("floors", floors);
  }

  return (
    <div>
      <div style={{ display: "flex", padding: 5 }}>
        <div
          style={{
            display: "flex",
            width: 300,
            flexDirection: "column",
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div>
            <input type="radio" id="selection" content="selection" checked={typeInstrument === "selection"} onChange={() => setTypeInstrument("selection")} />
            <label for="selection">selection</label>
          </div>
          <input type="radio" id="destination" content="destination" checked={typeInstrument === "destination"} onChange={() => setTypeInstrument("destination")} />
          <label for="destination">destination</label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            {typeInstrument === "destination" && (
              <div>
                <div>
                  <input type="radio" id="ladder" content="ladder" checked={waypointType === "ladder"} onChange={() => setWaypointType("ladder")} />
                  <label for="ladder">Лестница</label>
                </div>
                <div>
                  <input type="radio" style={{ visibility: true }} id="waypoint" content="waypoint" checked={waypointType === "waypoint"} onChange={() => setWaypointType("waypoint")} />
                  <label for="waypoint">Точка</label>
                  {waypointType == "waypoint" && <input type="text" id="waypoint" value={namePoint} onChange={(value) => setNamePoint(value.target.value)} required />}
                </div>
              </div>
            )}
          </div>
          <div>
            <input type="radio" id="wall" content="wall" checked={typeInstrument === "wall"} onChange={() => setTypeInstrument("wall")} />
            <label for="wall">wall</label>
          </div>
          {typeInstrument === "wall" && (
            <div>
              <div>
                <input type="radio" id="axisY" content="axisY" checked={axis === "axisY"} onChange={() => setAxis("axisY")} />
                <label for="axisY">Y</label>
              </div>
              <div>
                <input type="radio" id="axisX" content="axisX" checked={axis === "axisX"} onChange={() => setAxis("axisX")} />
                <label for="axisX">X</label>
              </div>
              <div>
                <input
                  type="number"
                  id="lineWid"
                  content="lineWid"
                  value={lineWidth}
                  style={{ width: 30 }}
                  onChange={(value) => {
                    setLineWidth(Number(value.target.value) == 0 ? 0 : Number(value.target.value));
                  }}
                />
                <label for="lineWid">Ширина стен</label>
              </div>
            </div>
          )}
          <Dropdown overlay={menu}>
            <Button>
              Этаж {floorCurrent} <DownOutlined />
            </Button>
          </Dropdown>
          <Button type="primary" onClick={manageFloors}>
            Добавить этаж
          </Button>
          <Input placeholder="Логин" onChange={(value) => setLogin(value.target.value)} />
          <Input placeholder="Здание" onChange={(value) => setBuild(value.target.value)} />
          <Button type="primary" onClick={getRouteUser}>
            Загрузить здание
          </Button>
          <Input placeholder="Здание" onChange={(value) => setBuild(value.target.value)} />
          <Button type="primary" onClick={getQrCode}>
            Получить QR
          </Button>
          {Object.keys(waypoints).map((key) => (
            <Button onClick={() => setWaypointQr({ key, point: waypoints[key][1] })} type="text" block>
              {console.log("render", waypointQr)}
              {key}
            </Button>
          ))}
        </div>
        {!linkqr.length == 0 ? <img src={linkqr} width={256} height={256} /> : null}

        <canvas id={"canvas"} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} ref={canvasRef} width={512} height={512} style={{ border: "0.5px solid black" }} />
      </div>
      <Input size="small" style={{ width: 234 }} placeholder="Название здания" onChange={(value) => setNameNewBuild(value.target.value)} />
      <button onClick={deleteElement}>удалить элемент</button>
      <button onClick={prepareImageMap}>Создать маршрут</button>
      <button onClick={editRouteCurrent}>Изменить маршрут</button>
    </div>
  );
};

export default FieldCanvas;
